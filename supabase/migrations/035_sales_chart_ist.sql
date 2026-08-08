-- ---------------------------------------------------------------------------
-- Sales chart: bucket days in India Standard Time, not UTC
--
-- Migration 032 grouped orders by their UTC calendar day and deliberately left
-- the timezone question open. This closes it.
--
-- India is UTC+5:30, so anything placed between 00:00 and 05:29 IST falls on
-- the previous UTC day. Verified against the live data before writing this:
--
--   EWMS3O2I8C5968  created 2026-07-27T20:15:40Z  =  01:45 IST on 28 July
--
-- That order — one of only two in the table — was being drawn on 27 July. The
-- same offset also means that between midnight and 5:30am IST the chart's last
-- bar is still labelled yesterday, so the dashboard appears to be missing today
-- entirely every night.
--
-- generate_series now walks IST days and each order is compared on its IST
-- date, so a day on the chart is the same day the shop actually had. India has
-- no daylight saving, so this offset is fixed and 'Asia/Kolkata' is stable.
--
-- Note this changes what the dashboard displays: the July order moves from the
-- 27th to the 28th. That is the correction, not a regression.
--
-- Safe to re-run: CREATE OR REPLACE, reads only.
-- ---------------------------------------------------------------------------

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
    (now() at time zone 'Asia/Kolkata')::date - (greatest(coalesce(p_days, 30), 1) - 1),
    (now() at time zone 'Asia/Kolkata')::date,
    interval '1 day'
  ) as series(day)
  left join public.orders o
    on (o.created_at at time zone 'Asia/Kolkata')::date = series.day::date
   and o.payment_status = 'paid'
  group by series.day
  order by series.day
$$;

-- Re-applied because CREATE OR REPLACE resets privileges to the default, which
-- grants EXECUTE to PUBLIC — the exact trap migration 034 had to clean up after
-- 032. Revoking from anon/authenticated alone is a no-op; it must be PUBLIC,
-- with service_role granted back explicitly.
REVOKE EXECUTE ON FUNCTION public.admin_sales_chart(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sales_chart(integer) TO service_role;
