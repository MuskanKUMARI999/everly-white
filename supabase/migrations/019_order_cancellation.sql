-- Customer self-service order cancellation (within a short window after placing).
--
-- Cancelling a paid order reverses the same side effects that confirming it applied: the money is
-- refunded (via Razorpay, in app code), stock is added back, and the coupon use is released. These
-- two RPCs make the stock/coupon reversals atomic per-row, mirroring the decrement/increment
-- functions used at fulfilment time.

-- Record-keeping columns on the order itself.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_id TEXT;

-- Add stock back when an order is cancelled (inverse of decrement_product_stock).
create or replace function public.increment_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stock integer;
begin
  update public.products
  set stock_quantity = stock_quantity + p_quantity
  where id = p_product_id
  returning stock_quantity into new_stock;

  return new_stock;
end;
$$;

-- Release a coupon use when a counted order is cancelled (inverse of increment_coupon_usage).
-- greatest(..., 0) floors the count so it can never go negative under a race.
create or replace function public.decrement_coupon_usage(p_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.coupons
  set uses_count = greatest(uses_count - 1, 0)
  where code = upper(p_code)
  returning uses_count into new_count;

  return new_count;
end;
$$;

-- Only trusted server-side callers (the service-role client) should ever adjust stock or usage.
revoke execute on function public.increment_product_stock(uuid, integer) from anon, authenticated;
revoke execute on function public.decrement_coupon_usage(text) from anon, authenticated;
