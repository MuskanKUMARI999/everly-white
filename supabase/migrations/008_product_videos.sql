-- Product videos, alongside product_images, for showcasing products on the
-- storefront product page. Mirrors product_images' shape/policies.

CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);

ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product videos" ON product_videos FOR SELECT USING (true);

-- Storage bucket for the actual video files. Admin actions use the
-- service-role client, so no INSERT/UPDATE/DELETE policy is granted here.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('product-videos', 'product-videos', true, 104857600) -- 100MB per file
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view product videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-videos');
