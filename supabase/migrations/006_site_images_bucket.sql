-- Storage bucket for non-product images (collection hero images, blog cover
-- images), used by the admin image-upload field for those sections.

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view (bucket is public + storefront reads images directly by URL)
CREATE POLICY "Public can view site images" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-images');

-- Only service role (admin actions use the service-role client) can manage files.
-- No INSERT/UPDATE/DELETE policy is granted to anon/authenticated roles, so
-- uploads/deletes only succeed via the service-role key used in admin actions.
