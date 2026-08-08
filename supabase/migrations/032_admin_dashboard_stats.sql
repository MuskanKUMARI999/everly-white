-- ---------------------------------------------------------------------------
-- Admin dashboard figures, computed in the database
--
-- Two problems with computing these in application code, both of which showed
-- up in the pre-deploy audit:
--
--   1. Revenue counted orders that were never paid for. The dashboard summed
--      `total` across every row it fetched — pending, failed, cancelled and
--      refunded included — so "Total Revenue" was overstated from day one, and
--      the sales chart drew the same inflated line. Money only counts once
--      payment_status = 'paid'; a refund moves the row to 'refunded', which
--      takes it back out of the total, so no separate subtraction is needed.
--
--   2. PostgREST caps a response at db-max-rows (1000 by default). The old code
--      fetched every order and every product just to count them and add them
--      up, so past that many rows the totals would quietly stop growing — the
--      worst kind of wrong, because nothing errors and the number still looks
--      plausible. count(*) and sum() in SQL have no such ceiling, and stop the
--      dashboard hauling the whole orders table over the wire on every load.
--
-- Both functions are read-only (`stable`) and, like decrement_product_stock and
-- increment_coupon_usage, are revoked from anon/authenticated: they aggregate
-- across every customer's orders, so only the service-role client behind
-- requireAdmin() has any business calling them.
--
-- Safe to re-run: both are CREATE OR REPLACE and neither writes anything.
-- ---------------------------------------------------------------------------


-- Headline counters for the dashboard tiles. -------------------------------
create or replace function public.admin_dashboard_stats()
returns table (
  total_orders bigint,
  paid_orders bigint,
  pending_orders bigint,
  total_revenue numeric,
  total_products bigint,
  available_products bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*) from public.orders),
    (select count(*) from public.orders where payment_status = 'paid'),
    (select count(*) from public.orders where status = 'pending'),
    -- coalesce so an empty table reads as 0 rather than NULL.
    (select coalesce(sum(total), 0) from public.orders where payment_status = 'paid'),
    (select count(*) from public.products),
    (select count(*) from public.products where is_available)
$$;

revoke execute on function public.admin_dashboard_stats() from anon, authenticated;


-- Daily series for the sales chart. ----------------------------------------
--
-- generate_series supplies the calendar so days with no orders still appear as
-- zeroes and the line stays continuous — the application used to pre-fill that
-- gap by hand. Day boundaries are UTC, matching what the old code effectively
-- did (it bucketed on the ISO timestamp) and what the server runs as; switching
-- them to IST would silently reassign late-evening orders to the next day, so
-- that is deliberately left as its own decision.
create or replace function public.admin_sales_chart(p_days integer default 30)
returns table (
  day date,
  revenue numeric,
  orders bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    series.day::date,
    coalesce(sum(o.total), 0) as revenue,
    count(o.id) as orders
  from generate_series(
    (now() at time zone 'utc')::date - (greatest(coalesce(p_days, 30), 1) - 1),
    (now() at time zone 'utc')::date,
    interval '1 day'
  ) as series(day)
  left join public.orders o
    on (o.created_at at time zone 'utc')::date = series.day::date
   and o.payment_status = 'paid'
  group by series.day
  order by series.day
$$;

revoke execute on function public.admin_sales_chart(integer) from anon, authenticated;
