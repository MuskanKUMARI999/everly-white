-- The welcome popup collects first name, last name, and phone alongside the email, but only the
-- email was ever persisted — the other fields were dropped in the browser. Add nullable columns so
-- those lead details are actually captured. Nullable because the footer newsletter form (and any
-- past subscribers) only ever supply an email.
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS phone TEXT;
