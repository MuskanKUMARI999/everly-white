-- ---------------------------------------------------------------------------
-- Close the anon hole on the admin dashboard functions added in 032
--
-- Migration 032 ended with:
--
--   revoke execute on function public.admin_dashboard_stats() from anon, authenticated;
--   revoke execute on function public.admin_sales_chart(integer) from anon, authenticated;
--
-- which does nothing at all. Postgres grants EXECUTE on a new function to
-- PUBLIC by default, and anon/authenticated inherit that grant, so revoking
-- from those roles removes a privilege they never separately held. This is the
-- identical mistake migrations 013/014/019 made and that migration 029 already
-- diagnosed and fixed for the stock and coupon functions — 032 reproduced the
-- broken pattern instead of the corrected one.
--
-- Verified live before this migration: calling both functions with only the
-- public anon key succeeded, returning total order count, paid order count and
-- exact revenue, plus a 30-day revenue-per-day series. The anon key ships in
-- the browser bundle, so that is world-readable business data — every figure on
-- the admin dashboard was available without logging in at all.
--
-- Revoking from PUBLIC also strips service_role (it is a member of PUBLIC), so
-- EXECUTE is re-granted to service_role explicitly. Only server-side code
-- holding the service key — i.e. behind requireAdmin() — may call these.
--
-- Safe to re-run: REVOKE/GRANT are idempotent.
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.admin_dashboard_stats()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_sales_chart(integer)     FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats()         TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_sales_chart(integer)      TO service_role;
