-- Stock was checked at order creation but never reduced once an order was paid, so the catalog
-- could oversell (two buyers could each pass the stock check for the last unit). This function
-- draws down products.stock_quantity atomically at the row level when a payment is confirmed.
--
-- The arithmetic UPDATE (stock = stock - qty) can't be expressed as a single call through the
-- Supabase JS query builder, and doing a read-then-write in application code would reintroduce
-- the race. greatest(..., 0) floors the result so concurrent decrements can never push stock
-- negative. Returns the resulting stock so the caller can log when a piece sells out.
create or replace function public.decrement_product_stock(
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
  set stock_quantity = greatest(stock_quantity - p_quantity, 0)
  where id = p_product_id
  returning stock_quantity into new_stock;

  return new_stock;
end;
$$;

-- Only trusted server-side callers (the service-role client) should ever adjust stock — never
-- the browser via the anon/authenticated keys.
revoke execute on function public.decrement_product_stock(uuid, integer) from anon, authenticated;
