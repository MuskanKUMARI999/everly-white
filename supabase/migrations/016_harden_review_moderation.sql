-- Harden review moderation so the public can't bypass the admin approval queue.
--
-- Three RLS gaps let a caller publish a review without moderation (RLS policies for the same
-- command are OR'd, so any one permissive policy is enough):
--   1. "Anyone can submit a review"          INSERT WITH CHECK (true)               -> anon could insert is_approved = true
--   2. "Authenticated users can create reviews" INSERT WITH CHECK (auth.uid() = user_id) -> logged-in user could insert is_approved = true
--   3. "Users can update own reviews"         UPDATE USING (auth.uid() = user_id)     -> logged-in user could flip their own row to approved
--
-- Fix: public submissions must be unapproved, and self-service review updates are removed. Admin
-- moderation uses the service-role client, which bypasses RLS entirely and is unaffected.

-- INSERT — collapse the two insert policies into one that forces is_approved = false.
DROP POLICY IF EXISTS "Anyone can submit a review" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;

CREATE POLICY "Anyone can submit a review" ON reviews
  FOR INSERT WITH CHECK (is_approved = false);

-- UPDATE — remove the self-service update path. There is no storefront review-editing feature, and
-- the policy let a user approve their own review. Approval/moderation happens only via the admin
-- (service-role) client.
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
