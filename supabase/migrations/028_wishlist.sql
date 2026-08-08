-- ============================================================
-- WISHLIST
-- ============================================================
-- Until now the wishlist lived in the browser's localStorage, so it belonged to a device
-- rather than to a customer: it didn't follow anyone to a second browser, and it survived
-- logging out. This gives it the same home the cart already has.
--
-- Flat table rather than a parent "wishlists" row + items: a wishlist has no properties of
-- its own (no coupon, no totals), so the extra table would only add a join.

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id TEXT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Every row belongs to someone: a signed-in user or a guest cookie, never neither.
  CONSTRAINT wishlist_items_owner_present CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
);

-- Partial rather than a plain UNIQUE(user_id, product_id): Postgres treats NULLs as distinct,
-- so on a table where one of the two owner columns is always NULL a plain constraint would let
-- the same product be saved twice.
CREATE UNIQUE INDEX IF NOT EXISTS wishlist_items_user_product_idx
  ON wishlist_items (user_id, product_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wishlist_items_guest_product_idx
  ON wishlist_items (guest_id, product_id)
  WHERE guest_id IS NOT NULL;

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Signed-in users reach only their own rows. Guest rows (user_id IS NULL) match no policy and
-- are therefore invisible to the anon key — they're reachable only through the service-role
-- client in server actions, which is the same boundary carts/cart_items rely on: a guest_id
-- cookie is not something Postgres can verify the way it verifies auth.uid().
DROP POLICY IF EXISTS "Users can manage own wishlist items" ON wishlist_items;
CREATE POLICY "Users can manage own wishlist items" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);
