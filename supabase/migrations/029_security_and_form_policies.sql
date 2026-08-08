-- Audit remediation (2026-08-03). Four defects found by auditing the LIVE database rather than
-- the migration files. Migrations 009, 010 and 016 exist in this folder but are demonstrably not
-- in effect on the live project, so their statements are re-applied here rather than assumed.
--
-- Every statement below is re-runnable: policies are dropped before creation, grants are absolute.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Newsletter + contact form submissions are being rejected  (was: 009, 010)
--
-- Both tables have RLS enabled with no INSERT policy, so every storefront submission is denied.
-- The footer signup, the welcome popup and the /contact form all insert through the
-- RLS-respecting client, so all three silently fail and the visitor sees "Something went wrong."
-- Both tables are empty as a result. Reads stay admin-only — the admin panel uses the
-- service-role client, which bypasses RLS and is unaffected by these policies.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_submissions;
CREATE POLICY "Anyone can submit a contact message" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Reviews can be inserted pre-approved, skipping moderation  (was: 016)
--
-- Verified live: an insert carrying is_approved = true is accepted and the review publishes
-- immediately. RLS policies for the same command are OR'd, so the permissive
-- WITH CHECK (true) policy from 011 is enough on its own — both older insert policies are
-- dropped and replaced by one that forces submissions to land unapproved.
-- submitReview() already hardcodes is_approved: false, so the storefront is unaffected.
-- Admin approval runs through the service-role client and bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;

CREATE POLICY "Anyone can submit a review" ON public.reviews
  FOR INSERT WITH CHECK (is_approved = false);

-- Removes the self-service update path: it let a user flip their own review to approved.
-- There is no storefront review-editing feature, so nothing depends on this.
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Inventory and coupon RPCs are executable by anon and authenticated
--
-- Migrations 013/014/019 each ended with `REVOKE EXECUTE ... FROM anon, authenticated`, but
-- Postgres grants EXECUTE on a new function to PUBLIC by default, and both roles inherit that
-- grant — so the revoke removed a privilege they were never separately holding and changed
-- nothing. Verified live: an unauthenticated caller moved a product's stock from 49 to 48.
--
-- Revoking from PUBLIC also strips service_role (it is a member of PUBLIC), so EXECUTE is
-- re-granted to service_role explicitly. Only server-side code holding the service key may
-- adjust stock or coupon usage. The table owner (postgres) always retains EXECUTE, so the
-- Supabase SQL editor is unaffected.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_coupon_usage(text)           FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.decrement_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_product_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(text)           TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_coupon_usage(text)           TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. A logged-in user can grant themselves is_admin
--
-- requireAdmin() gates the entire /admin panel on profiles.is_admin, and the
-- "Users can update own profile" policy permits updating one's own row. Postgres RLS is
-- row-level, not column-level, so that policy covers EVERY column — including is_admin.
-- Verified live: a freshly created account set is_admin = true on itself and the admin layout
-- would have rendered for it.
--
-- Two independent defences, because this one grants total control of the store:
--
--   (a) Column privileges. Table-level UPDATE is replaced with a grant on exactly the three
--       columns updateProfile() writes. is_admin is not among them, so the API rejects the
--       write outright. anon gets no UPDATE at all.
--   (b) A trigger, in case a future column grant is ever widened by accident. It blocks any
--       is_admin change arriving over the public API while still allowing the service-role
--       client (scripts/make-admin.ts) and direct SQL (the Supabase table editor / SQL editor),
--       which is how admins are actually promoted.
--
-- The signup trigger handle_new_user() (018) INSERTs is_admin and is untouched: the trigger
-- below is BEFORE UPDATE only, and column grants do not apply to a SECURITY DEFINER function.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, updated_at) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_claims text := current_setting('request.jwt.claims', true);
  claim_role text := '';
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- PostgREST publishes the caller's JWT claims here. A direct psql/SQL-editor session has
    -- no claims at all, which is how a project owner stays able to promote an admin by hand.
    IF raw_claims IS NOT NULL AND raw_claims <> '' THEN
      BEGIN
        claim_role := COALESCE((raw_claims::jsonb) ->> 'role', '');
      EXCEPTION WHEN others THEN
        claim_role := '';
      END;
    END IF;

    IF claim_role IN ('anon', 'authenticated') THEN
      RAISE EXCEPTION 'is_admin cannot be modified through the public API';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
