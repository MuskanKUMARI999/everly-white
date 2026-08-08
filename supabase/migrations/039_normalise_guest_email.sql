-- ---------------------------------------------------------------------------
-- Guarantee guest_email is stored lowercase, whoever writes it
--
-- 037 folded the existing rows to lowercase and checkout was changed to write
-- them that way, which is what lets a returning guest's orders be matched to
-- their account with a plain equality test (see 037 for why an ILIKE compare is
-- unsafe here — `_` is a wildcard, and underscores are common in addresses).
--
-- But that left the rule living in application code, where it holds only as long
-- as every future writer remembers it. A single INSERT that skips the step — a
-- data import, an admin tool, a second code path — would leave an order that
-- silently never attaches to its owner's account, and a customer unable to reach
-- their own tax invoice. Nothing would error; the order would just quietly stay
-- orphaned.
--
-- Found by a test that deliberately stored a mixed-case address and watched the
-- claim return nothing.
--
-- A trigger makes it true by construction instead of by convention. Chosen over
-- a CHECK constraint because normalising is what we actually want; a constraint
-- would reject the write and break checkout rather than quietly doing the right
-- thing.
--
-- Safe to re-run.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalise_order_guest_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.guest_email IS NOT NULL THEN
    NEW.guest_email := lower(trim(NEW.guest_email));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalise_order_guest_email ON orders;
CREATE TRIGGER normalise_order_guest_email
  BEFORE INSERT OR UPDATE OF guest_email ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.normalise_order_guest_email();

-- Catch anything written between 037 and this trigger existing.
UPDATE orders
SET guest_email = lower(trim(guest_email))
WHERE guest_email IS NOT NULL
  AND guest_email <> lower(trim(guest_email));
