-- Allow the public storefront contact form to insert a submission.
-- contact_submissions had RLS enabled with no policies at all, so every
-- insert was silently denied.

CREATE POLICY "Anyone can submit a contact message" ON contact_submissions
  FOR INSERT WITH CHECK (true);
