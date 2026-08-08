-- ---------------------------------------------------------------------------
-- Let a guest's past orders follow them into an account
--
-- Orders placed without signing in store only `guest_email`; `user_id` is null.
-- Order history is fetched by user_id, so those orders stay invisible even after
-- the same person creates an account with the same address — and, since the
-- invoice download authorises on ownership, they cannot get their tax invoice
-- either.
--
-- The fix in application code is to attach unclaimed guest orders to the account
-- on sign-in, matching on email. That match has to be exact, which is what this
-- migration prepares.
--
-- WHY LOWERCASE RATHER THAN A CASE-INSENSITIVE COMPARE
--
-- Checkout never normalised the address, so guest_email can hold "Foo@Bar.com".
-- The obvious fix is to compare with ILIKE — but ILIKE is a pattern match, and
-- `_` is its single-character wildcard. Underscores are perfectly common in
-- email addresses, so `john_doe@x.com` would also match `johnXdoe@x.com` and
-- hand one person's order to another. Storing the address folded to lowercase
-- keeps the comparison a plain equality test, with no pattern syntax involved.
--
-- Safe to re-run: lower() of an already-lowercased address is unchanged, and the
-- WHERE clause means a second run touches nothing.
-- ---------------------------------------------------------------------------

UPDATE orders
SET guest_email = lower(guest_email)
WHERE guest_email IS NOT NULL
  AND guest_email <> lower(guest_email);

-- Supports the claim lookup, which only ever asks for unclaimed guest orders.
-- Partial, because claimed rows are never scanned by it.
CREATE INDEX IF NOT EXISTS idx_orders_unclaimed_guest_email
  ON orders (guest_email)
  WHERE user_id IS NULL AND guest_email IS NOT NULL;
