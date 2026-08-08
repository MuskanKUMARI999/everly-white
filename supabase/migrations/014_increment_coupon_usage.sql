-- Coupon usage was previously counted at order *creation* (before payment) with a non-atomic
-- read-then-write, so abandoned/unpaid carts permanently burned a coupon's max_uses, and two
-- concurrent orders could both read the same count and under-increment. Usage is now bumped only
-- once payment is confirmed (in fulfillPaidOrder), and this function makes the bump atomic.
--
-- The `uses_count < max_uses` guard means the count never climbs past the cap even under a race,
-- and an uncapped coupon (max_uses IS NULL) always increments. Returns the new count, or NULL if
-- the code doesn't exist or is already at its cap.
create or replace function public.increment_coupon_usage(p_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.coupons
  set uses_count = uses_count + 1
  where code = upper(p_code)
    and (max_uses is null or uses_count < max_uses)
  returning uses_count into new_count;

  return new_count;
end;
$$;

-- Only trusted server-side callers (the service-role client) should ever adjust coupon usage.
revoke execute on function public.increment_coupon_usage(text) from anon, authenticated;
