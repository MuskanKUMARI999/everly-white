-- Allow the public storefront "Write a Review" form to submit a review (as a
-- guest or a logged-in user) and upload accompanying photos.
--
-- reviews already had an INSERT policy, but it was restricted to
-- "auth.uid() = user_id" — logged-in users only, tied to their own account.
-- The public form has no login gate, so guests could never submit at all.
-- Adding this as an additional permissive policy (OR'd with the existing one)
-- rather than replacing it.
CREATE POLICY "Anyone can submit a review" ON reviews
  FOR INSERT WITH CHECK (true);

-- Storage bucket for review photos.
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view review photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');

-- Public can upload review photos (pending admin approval of the review itself).
CREATE POLICY "Anyone can upload review photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-photos');
