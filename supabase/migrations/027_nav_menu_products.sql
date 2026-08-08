-- ---------------------------------------------------------------------------
-- Header "Collection" dropdown — product order and menu blurbs
--
-- Two drifts from the design file, both in the mega-menu's product grid:
--
--   1. Order. The design lists Twin Flames, Lunar Bond, Star Crossed Lovers,
--      Butterfly Effect, String of Fate. The queries ordered on created_at
--      alone, and all five rows were seeded in one statement — same timestamp,
--      so Postgres was free to return them in any order, and it did (Lunar Bond
--      came out first). The decorative icons in the menu are assigned by
--      position, so a shuffled list also handed Twin Flames the moon and Lunar
--      Bond the flame.
--      There was no column to order on: 002_seed_data.sql writes a sort_order
--      for products, but no migration ever created it, so that value was never
--      stored. This adds the column for real and fills it in.
--
--   2. Blurb. The menu cell is one of three across with room for two short
--      lines. The design writes a separate one-liner for it; we were reusing
--      products.tagline, the longer line printed under the title on the product
--      page, which wrapped to three lines in the menu and pushed the second row
--      out of alignment. The taglines themselves are correct on the product page
--      and are left untouched — the menu copy goes in metadata.navDescription,
--      the same pattern as the collection's navImage/navTagline (024).
--
-- Safe to re-run: 1 ALTER (IF NOT EXISTS) and 10 UPDATEs, each writing an
-- absolute value; `||` merges into existing metadata so nothing else is lost.
-- ---------------------------------------------------------------------------


-- 1. Catalog order -----------------------------------------------------------
--
-- Also the order of the /products grid and the collection page, which read the
-- same queries. Editable per product later; new products default to 0 and fall
-- back to the created_at tie-break.

ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE products SET sort_order = 0 WHERE slug = 'twin-flames';
UPDATE products SET sort_order = 1 WHERE slug = 'lunar-bond';
UPDATE products SET sort_order = 2 WHERE slug = 'star-crossed-lovers';
UPDATE products SET sort_order = 3 WHERE slug = 'butterfly-effect';
UPDATE products SET sort_order = 4 WHERE slug = 'string-of-fate';


-- 2. Mega-menu blurbs --------------------------------------------------------
--
-- Verbatim from the design file's header data.

UPDATE products
SET metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('navDescription', 'Two souls, one flame, mirrored in eternal light.')
WHERE slug = 'twin-flames';

UPDATE products
SET metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('navDescription', 'A quiet pull between moon and mirror.')
WHERE slug = 'lunar-bond';

UPDATE products
SET metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('navDescription', 'Written in the stars, held by fate.')
WHERE slug = 'star-crossed-lovers';

UPDATE products
SET metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('navDescription', 'The smallest spark, rippling into transformation.')
WHERE slug = 'butterfly-effect';

UPDATE products
SET metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object('navDescription', 'An invisible thread binding hearts across time.')
WHERE slug = 'string-of-fate';
