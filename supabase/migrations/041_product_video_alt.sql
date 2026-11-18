-- A description for each product video, matching product_images.alt.
--
-- Videos sit in the same gallery as photos and are arranged in the same grid, but had nowhere to
-- store a description — so the admin's media panel showed a text field under every photo and
-- nothing under a clip. On the storefront the gap was worse than cosmetic: a real video rendered as
-- a bare <video> with no accessible name at all, so screen readers announced it as nothing.
--
-- Nullable with no default, exactly like product_images.alt: empty means "fall back to the product
-- name", which is what the storefront already does for photos.

ALTER TABLE product_videos ADD COLUMN IF NOT EXISTS alt TEXT;
