-- The redesigned signup form collects a phone number (country-code picker + national number)
-- alongside name and email. profiles.phone already exists from 001_initial_schema.sql, but
-- handle_new_user only ever copied full_name across, so the submitted number was captured on the
-- auth user's metadata and then silently dropped when the profile row was created.
--
-- Widen the trigger to carry phone through as well. Existing behaviour is unchanged for signups
-- that don't send a phone: the column stays null, exactly as before.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NULLIF(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
