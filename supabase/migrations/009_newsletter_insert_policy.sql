-- Allow the public storefront (footer newsletter form, welcome popup) to insert
-- their own email address. newsletter_subscribers had RLS enabled with no
-- policies at all, so every insert was silently denied.

CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);
