-- ---------------------------------------------------------------------------
-- Repoint product imagery at the folder-based .jpg photo set
--
-- The rows in product_images still referenced the original flat filenames
-- (/images/products/twin-flames-1.png and friends). The front-end redesign
-- shipped a complete four-photo set per product under
-- /images/products/<slug>/, but the database was never updated to match, so
-- the storefront kept rendering the old photos.
--
-- Butterfly Effect was the one product already on the new folder layout, but
-- it accumulated duplicate rows (positions 2 and 3 repeated 0 and 1), which
-- showed the same two photos twice in its gallery. Rows are deleted and
-- reinserted rather than updated in place so those duplicates go away.
--
-- Effects on the storefront:
--   - every product gets the correct featured (1-pair) and hover (2-lifestyle)
--     image, so the homepage and catalog cards match the design
--   - String of Fate gains a hover image it never had
--   - the four products that only had two photos gain their detail and
--     specification shots, so the product page gallery is complete
-- ---------------------------------------------------------------------------

DELETE FROM product_images
WHERE product_id IN (
  SELECT id FROM products
  WHERE slug IN (
    'twin-flames',
    'lunar-bond',
    'star-crossed-lovers',
    'butterfly-effect',
    'string-of-fate'
  )
);

INSERT INTO product_images (product_id, url, alt, position, is_featured)
SELECT
  p.id,
  '/images/products/' || p.slug || '/' || i.file,
  replace(i.alt_template, '{name}', p.name),
  i.position,
  i.position = 0
FROM products p
CROSS JOIN (VALUES
  ('1-pair.jpg',           '{name} large and small mirror-inlay plates displayed on brass stands', 0),
  ('2-lifestyle.jpg',      '{name} plates styled in a furnished interior',                         1),
  ('3-detail.jpg',         'Close-up of the hand-set mirror inlay and carved detail on {name}',    2),
  ('4-specifications.jpg', '{name} product specifications — dimensions, materials and care',       3)
) AS i(file, alt_template, position)
WHERE p.slug IN (
  'twin-flames',
  'lunar-bond',
  'star-crossed-lovers',
  'butterfly-effect',
  'string-of-fate'
);

-- ---------------------------------------------------------------------------
-- Collection imagery
--
-- hero_image drives the /collection/[slug] page hero, which was still showing
-- an Instagram lifestyle photo instead of the collection hero from the design.
--
-- The homepage "Shop By Category" tile needs a different crop than the page
-- hero, so it lives in metadata rather than fighting over hero_image.
-- ShopByCategory reads metadata.tileImage and falls back to hero_image.
-- ---------------------------------------------------------------------------

UPDATE collections
SET
  hero_image = '/images/banners/collection-hero.jpg',
  metadata = coalesce(metadata, '{}'::jsonb)
    || '{"tileImage": "/images/banners/category-1.jpeg"}'::jsonb
WHERE slug = 'center-of-the-universe';
