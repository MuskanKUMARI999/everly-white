-- Admins used to be promotable only via the profiles.is_admin column, which exists only AFTER a
-- person signs up (the handle_new_user trigger creates the profile). That forced the owner to wait
-- for someone to log in before running scripts/make-admin.ts. This table lets the owner pre-authorize
-- an admin by email at any time; the signup trigger below reads it so the profile is created with
-- is_admin already set. Emails are stored lowercased so lookups are case-insensitive.
CREATE TABLE IF NOT EXISTS admin_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Only the service role (used by scripts/make-admin.ts and server code) should ever touch this list.
-- RLS on with no policies denies all normal/anon access; the service role bypasses RLS, and the
-- SECURITY DEFINER trigger below reads it as the table owner.
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Recreate the signup trigger so a newly created profile is flagged admin when the user's email is
-- on the pre-authorized list.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    EXISTS (SELECT 1 FROM public.admin_emails WHERE email = lower(NEW.email))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
