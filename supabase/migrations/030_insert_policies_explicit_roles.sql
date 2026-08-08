-- Follow-up to 029. Already applied on 2026-08-03 (as supabase/029b_diagnose_insert_policies.sql,
-- now folded in here so the migrations folder remains a complete, replayable history).
--
-- CORRECTION TO THE 029 HEADER: section 1 of 029 claimed the newsletter and contact forms were
-- silently failing in production. That was not established. The audit probe inserted with a
-- PostgREST `RETURNING` clause (supabase-js `.insert(...).select()`), and Postgres applies the
-- SELECT policy to the returned row. Neither table grants anon a SELECT policy — by design, they
-- are admin-only reads — so the probe failed for a reason the real code never encounters:
-- subscribeToNewsletter(), submitContactForm() and submitReview() all insert WITHOUT .select().
-- Verified after the fact: all three app-style inserts succeed and the rows land.
--
-- What this migration does is therefore hardening rather than repair: it states the table
-- privilege and the policy roles explicitly instead of relying on inherited PUBLIC defaults,
-- and it removes any same-command policy left behind under an older name.

-- Drop every INSERT-affecting policy on the three public-submission tables regardless of name,
-- so a stray or misnamed policy from an earlier migration cannot linger alongside the intended
-- one. SELECT policies are untouched.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('newsletter_subscribers', 'contact_submissions', 'reviews')
      AND cmd IN ('INSERT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- RLS is applied on top of table privileges, not instead of them. State the grant explicitly
-- rather than depending on Supabase's default grants surviving future changes.
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT INSERT ON public.contact_submissions    TO anon, authenticated;
GRANT INSERT ON public.reviews                TO anon, authenticated;

CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can submit a contact message" ON public.contact_submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Public review submissions must land unapproved. This one IS a real fix: before 029 an
-- anonymous caller could insert is_approved = true and the review published without moderation.
CREATE POLICY "Anyone can submit a review" ON public.reviews
  FOR INSERT TO anon, authenticated WITH CHECK (is_approved = false);
