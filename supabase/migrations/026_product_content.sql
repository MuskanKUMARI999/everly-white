-- ---------------------------------------------------------------------------
-- Products page — batched content changes from the design-file review
--
-- This is the single migration for the products review; further decisions get
-- appended here rather than spawning new files, and the whole file is re-run.
-- Sections 1-2 were run on their own first; 3-4 were appended afterwards.
--
-- Safe to re-run as a whole — 1 ALTER (IF NOT EXISTS) and 18 UPDATEs, every one
-- writing an absolute value. No INSERT/DELETE, nothing that accumulates. The
-- only caveat is that a re-run overwrites anything edited via Admin → Products
-- since the last run.
-- ---------------------------------------------------------------------------


-- 1. Dimensions ("Dimensions & What's Included" accordion row) -----------------
--
-- The seeded spec disagreed with the design file on the actual product:
-- 20cm/12cm plates with brass stands in a plain gift box, versus 31cm/21cm
-- pieces with metal stands and brand cards in a ribboned shimmer box. The
-- design file is the client's spec, so it wins.
--
-- All five pieces share one spec. A single product can still be given its own
-- text later from Admin → Products; DEFAULT_DIMENSIONS in collectionData.ts is
-- only the fallback for a product left empty, and now matches this wording.

UPDATE products
SET dimensions = 'Piece 1 — approx. 31cm (12in) · Piece 2 — approx. 21cm (8in). Weight: Piece 1 ~360g, Piece 2 ~400g approx (package ~2kg). Includes 2 metal stands and 2 brand cards, delivered in a shimmer box tied with a metallic ribbon.'
WHERE collection_id = (SELECT id FROM collections WHERE slug = 'center-of-the-universe');


-- 2. Composition ("Composition & Care" accordion row) -------------------------
--
-- The accordion already had a `composition` prop, but the product page never
-- passed one, so every product silently fell back to a short generic line
-- ("Hand-carved from solid wood...") that contradicts the design file: the
-- design describes five layers of premium materials set with 500+ mirrors and
-- finished in pigments, not carved wood.
--
-- The design also gives Lunar Bond its own reworded version, so this has to be
-- a real per-product field rather than one shared constant. There was no column
-- for it — `material` and `care_instructions` already exist, mean narrower
-- things, and are edited separately in the admin panel, so overloading either
-- would break those fields.
--
-- The shared wording lives in DEFAULT_COMPOSITION in ProductDetailsAccordion.tsx
-- and applies whenever this column is empty; the column is the per-product
-- override, editable from Admin → Products.

ALTER TABLE products ADD COLUMN IF NOT EXISTS composition TEXT;

-- Shared text for every piece in the collection.
UPDATE products
SET composition = 'Inspired by the cosmic theme of the Center of the Universe collection, this mirrored art piece is hand-finished in five refined layers of premium materials and set with over 500 radiant mirrors that catch and multiply light like distant stars. Each piece takes at least 100 hours of artisan craftsmanship from base to finish, using dustproof, non-toxic, alcohol-free, water-resistant pigments — clean with a dry brush or damp cloth, no fuss required. Built to last generations; a gentle repaint after 15–20 years brings it back to full shine.'
WHERE collection_id = (SELECT id FROM collections WHERE slug = 'center-of-the-universe');

-- Lunar Bond carries its own wording in the design file.
UPDATE products
SET composition = 'This mirrored art piece is handcrafted with five refined layers of premium materials, featuring over 500 radiant mirrors that capture and multiply light like distant stars. Each artwork requires at least 100 hours of meticulous artisan craftsmanship, and is finished with dustproof, non-toxic, alcohol-free, water-resistant pigments — maintained with a gentle brush or damp cloth. A timeless creation meant to last for generations, with a potential delicate repaint after 15–20 years.'
WHERE slug = 'lunar-bond';


-- 3. Product stories (the pink "The Story" panel on each product page) --------
--
-- This copy lives in the database here, but in collectionData.ts in the design
-- folder, so a file-by-file diff of the components never caught it. All five
-- seeded stories were shorter rewrites; these are the design's originals, which
-- carry the actual meaning behind each piece.

UPDATE products
SET story = 'A twin flame is believed to be one soul split into two bodies — a mirror of your own soul in another person. Unlike soulmates, who are deeply compatible, twin flames are mirrors to each other: the Divine Masculine and the Divine Feminine, often triggering intense emotional, spiritual, and personal growth. It feels like you''ve known them forever, even if you''ve just met. For twin flames meet not by chance, but by a divine plan.'
WHERE slug = 'twin-flames';

UPDATE products
SET story = 'They say certain souls rise and fall in each other''s light — like the moon and the sea. A lunar bond speaks of a connection between two souls that is gentle, intuitive, and emotionally deep, much like the moon''s influence over the tides and our inner world. An ever-present love that never seems to fade, but lives on bright in the eyes of the lovers.'
WHERE slug = 'lunar-bond';

UPDATE products
SET story = 'Star-crossed lovers drift into each other''s orbits for a fleeting moment — summoned by fate to awaken growth, to offer something the soul will never forget. Born from different worlds, they cross paths briefly, yet leave a lasting mark, etched in the heart long after they part.'
WHERE slug = 'star-crossed-lovers';

UPDATE products
SET story = 'The Butterfly Effect is the idea that small, seemingly insignificant actions can lead to vast, unpredictable changes over time. This piece is a reminder that your presence, your love, your choices — they echo far beyond what you see. Even the smallest flutter can shape a lifetime.'
WHERE slug = 'butterfly-effect';

UPDATE products
SET story = 'An invisible thread connects those destined to meet, regardless of time, place, or circumstance. Moments converge with such effortless precision, as though the table had been set for them long before they arrived. No matter how far apart the two people may be, or what obstacles arise, fate will bring them together.'
WHERE slug = 'string-of-fate';


-- 4. Product image alt text ---------------------------------------------------
--
-- The photos and their order are already correct and byte-identical to the
-- design; only the descriptions attached to them drifted. Matching on url so
-- this stays independent of row ids.
--
-- NOTE: migration 022 DELETEs and reinserts product_images for these five
-- products. If it is ever re-run, re-run this section after it.

-- The main pair shot: the design says "gold stands" for four of the five.
-- Butterfly Effect genuinely reads "brass stands" there and is already correct.
UPDATE product_images SET alt = 'Twin Flames large and small mirror-inlay plates displayed on gold stands'
WHERE url = '/images/products/twin-flames/1-pair.jpg';

UPDATE product_images SET alt = 'Lunar Bond large and small mirror-inlay plates displayed on gold stands'
WHERE url = '/images/products/lunar-bond/1-pair.jpg';

UPDATE product_images SET alt = 'Star Crossed Lovers large and small mirror-inlay plates displayed on gold stands'
WHERE url = '/images/products/star-crossed-lovers/1-pair.jpg';

UPDATE product_images SET alt = 'String of Fate large and small mirror-inlay plates displayed on gold stands'
WHERE url = '/images/products/string-of-fate/1-pair.jpg';

-- The lifestyle shot: the design describes each scene individually rather than
-- reusing one generic "styled in a furnished interior" line.
UPDATE product_images SET alt = 'Twin Flames plates styled on a console table with pampas grass and brass candlesticks'
WHERE url = '/images/products/twin-flames/2-lifestyle.jpg';

UPDATE product_images SET alt = 'Lunar Bond plates styled on a console table with dried flowers and candlelight'
WHERE url = '/images/products/lunar-bond/2-lifestyle.jpg';

UPDATE product_images SET alt = 'Star Crossed Lovers plates styled on a console table with pampas grass and candlelight'
WHERE url = '/images/products/star-crossed-lovers/2-lifestyle.jpg';

UPDATE product_images SET alt = 'Butterfly Effect plates styled on a console table with pampas grass and candles'
WHERE url = '/images/products/butterfly-effect/2-lifestyle.jpg';

UPDATE product_images SET alt = 'String of Fate plates styled on a console table with pampas grass and candlesticks'
WHERE url = '/images/products/string-of-fate/2-lifestyle.jpg';

-- The detail shot: only Butterfly Effect differs ("carved floral detail").
UPDATE product_images SET alt = 'Close-up of the hand-set mirror inlay and carved floral detail on Butterfly Effect'
WHERE url = '/images/products/butterfly-effect/3-detail.jpg';
