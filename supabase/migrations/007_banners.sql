-- Banners table for admin-managed promotional/hero images across the site.
-- "placement" identifies which slot a banner belongs to (e.g. the homepage
-- hero slider); more placements can be added later without a schema change.

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement TEXT NOT NULL DEFAULT 'homepage_hero',
  image_url TEXT NOT NULL,
  link_url TEXT,
  alt TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners(placement);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Public can read active banners (storefront reads them directly)
CREATE POLICY "Anyone can read active banners" ON banners
  FOR SELECT USING (is_active = true);

-- Only service role (admin actions use the service-role client) can manage banners.
