-- Customers can delete their own account (Account Details → Delete account).
--
-- Deleting the auth user already does most of the work through the existing foreign keys: the
-- profile, saved addresses, cart and wishlist cascade away, and orders and reviews are kept with
-- user_id set to NULL. Orders have to survive — they are the shop's sales and GST records.
--
-- What was missing is somewhere for the order's email to live afterwards. An account order stores
-- only user_id, so once the user is gone it would show "No email on file" in admin and could no
-- longer be emailed or tracked. Writing the address back into guest_email is not an option either:
-- claimGuestOrders (src/lib/orders/claim.ts) attaches guest_email orders to whoever signs in with
-- that address, so a customer who deleted their account and later signed up again with the same
-- email would get their old orders back. A deleted account is meant to come back as a fresh one.
--
-- So the address goes in its own column, which every "who is this order for" lookup falls back to
-- and which the claim deliberately never reads.
--
-- Safe to re-run.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS former_account_email TEXT;
