-- ---------------------------------------------------------------------------
-- Header mega-menu image for a collection
--
-- The "Collection" dropdown in the header shows a tall 260px-wide photo panel
-- next to the product list. It was reading hero_image, which migration 022
-- repointed at the full-bleed banner (collection-hero.jpg) for the
-- /collection/[slug] page. That banner is a wide 21:9-ish composition, so the
-- narrow menu panel crops it down to the middle and loses the image.
--
-- The menu therefore gets its own photo in metadata, exactly like the homepage
-- "Shop By Category" tile does with metadata.tileImage. getNavCollections reads
-- metadata.navImage / metadata.navImageAlt and falls back to hero_image.
--
-- Safe to re-run: `||` merges into the existing metadata, so tileImage, intro,
-- stats and founderNote all survive.
-- ---------------------------------------------------------------------------

UPDATE collections
SET
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'navImage', '/images/instagram/product-coffee-table.jpg',
      'navImageAlt', 'Everly White plates styled on a coffee table'
    )
WHERE slug = 'center-of-the-universe';
