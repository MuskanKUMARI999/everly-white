-- Storage bucket for product images, used by admin product image upload
-- (src/lib/admin/actions.ts: uploadProductImages / deleteProductImage)

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view (bucket is public + storefront reads images directly by URL)
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Only service role (admin actions use the service-role client) can manage files.
-- No INSERT/UPDATE/DELETE policy is granted to anon/authenticated roles, so
-- uploads/deletes only succeed via the service-role key used in admin actions.
