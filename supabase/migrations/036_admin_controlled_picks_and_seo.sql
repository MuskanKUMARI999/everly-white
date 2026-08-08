-- Two storefront selections move from hardcoded lists into admin-editable flags, plus the SEO
-- title/description that every product and post was missing.
--
-- Re-runnable: every value is absolute and every jsonb write is a `||` merge, so running this twice
-- changes nothing the second time and never drops a key written alongside it (navDescription,
-- hoverImage, category, date, readTime, authorRole all survive).
--
-- Nothing here changes what the site looks like today. The flags below reproduce exactly the
-- selections that were previously hardcoded in ProductCard.tsx and app/page.tsx — the point is that
-- the client can now change them from the admin panel instead of needing a code edit, and that a
-- rename no longer makes a badge or a homepage card silently disappear.


-- ─── 1. Flagship badge ────────────────────────────────────────────────────────
-- Was: const FLAGSHIP_PRODUCTS = new Set(["Twin Flames", "Lunar Bond"]) — matched on the display
-- NAME, so renaming either piece in admin removed its badge with no warning.
-- Now: Admin → Products → "Flagship" checkbox.

UPDATE products
SET metadata   = COALESCE(metadata, '{}'::jsonb) || '{"isFlagship": true}'::jsonb,
    updated_at = now()
WHERE slug IN ('twin-flames', 'lunar-bond');

-- ─── 2. Homepage Journal pair ─────────────────────────────────────────────────
-- Was: two slugs hardcoded in app/page.tsx. Renaming or unpublishing either post left the Journal
-- section rendering its heading above an empty grid.
-- Now: Admin → Blog → "Feature on homepage" checkbox. The homepage tops up from the most recent
-- posts if fewer than two are ticked, so the section can no longer render short.

UPDATE blog_posts
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"featuredOnHome": true}'::jsonb
WHERE slug IN (
  'designed-to-change-how-you-experience-life',
  'twin-flames-one-soul-in-two-bodies'
);


-- ─── 3. Product SEO ───────────────────────────────────────────────────────────
-- All five products had meta_title and meta_description NULL, so search results fell back to the
-- product name and tagline. These titles are used verbatim (the page sets `absolute`, bypassing the
-- root layout's "%s | Everly White" template), which is why each one carries the brand itself.
-- Edit freely in Admin → Products → SEO; this migration only fills the blanks.

UPDATE products SET
  meta_title = 'Twin Flames Mirror Plate Set | Everly White',
  meta_description = 'One soul in two bodies — a hand-carved pair set with mirror inlay, completing a shared motif only when displayed side by side. Handmade in India.'
WHERE slug = 'twin-flames';

UPDATE products SET
  meta_title = 'Lunar Bond Mirror Plate Set | Everly White',
  meta_description = 'A radiating lunar motif across two hand-finished mirror-inlay plates, made to orbit each other on their brass stands. Over 100 hours of craft per piece.'
WHERE slug = 'lunar-bond';

UPDATE products SET
  meta_title = 'Star Crossed Lovers Mirror Plate Set | Everly White',
  meta_description = 'A star-motif carving spanning two hand-finished plates on brass stands — no two pairs ever catch the light quite the same way. Handmade in India.'
WHERE slug = 'star-crossed-lovers';

UPDATE products SET
  meta_title = 'Butterfly Effect Mirror Plate Set | Everly White',
  meta_description = 'A floral, wing-like carving across two hand-finished plates, each mirror set by hand — the quiet motion its name suggests. Handmade in India.'
WHERE slug = 'butterfly-effect';

UPDATE products SET
  meta_title = 'String of Fate Mirror Plate Set | Everly White',
  meta_description = 'A fine lattice carving that lets an invisible thread of light run through the pair. Hand-finished mirror inlay, made to be displayed together.'
WHERE slug = 'string-of-fate';


-- ─── 4. Blog SEO ──────────────────────────────────────────────────────────────
-- Same story: all eight posts had both fields NULL. Descriptions are drawn from each post's own
-- excerpt, trimmed to sit inside the ~160 characters Google renders.

UPDATE blog_posts SET
  meta_title = 'How Our Studio Is Designed to Change How You Live | Everly White',
  meta_description = 'Every piece begins as a question about how a room should feel, not just how it should look — a look inside the philosophy behind the studio.'
WHERE slug = 'designed-to-change-how-you-experience-life';

UPDATE blog_posts SET
  meta_title = 'The Slow Morning Ritual: Setting Your Altar | Everly White',
  meta_description = 'A quiet practice for the first ten minutes of the day — light, water, and a single object chosen with intention.'
WHERE slug = 'slow-morning-ritual';

UPDATE blog_posts SET
  meta_title = 'Behind the Kiln: How Each Piece Is Hand-Finished | Everly White',
  meta_description = 'No two glazes fire the same way twice. A morning with our ceramicists on why that is the point, not the flaw.'
WHERE slug = 'behind-the-kiln-hand-finished';

UPDATE blog_posts SET
  meta_title = 'A Guide to Gifting Across Life''s Thresholds | Everly White',
  meta_description = 'Housewarmings, new chapters, quiet goodbyes — how to choose a piece that says more than a card can.'
WHERE slug = 'gifting-across-the-threshold-of-change';

UPDATE blog_posts SET
  meta_title = 'Living in Cosmic Time: Designing Around the Moon | Everly White',
  meta_description = 'Our collections follow lunar phases, not seasons. What that means for the way a piece is meant to be lived with.'
WHERE slug = 'living-in-cosmic-time';

UPDATE blog_posts SET
  meta_title = 'Caring for Glazework: A Small Ritual of Its Own | Everly White',
  meta_description = 'How to clean, store and live daily with hand-glazed ceramics — so the finish only gets better with age.'
WHERE slug = 'caring-for-glazework';

UPDATE blog_posts SET
  meta_title = 'Twin Flames: One Soul in Two Bodies | Everly White',
  meta_description = 'On the collection that started it all — two vessels, always sold and always seen as one.'
WHERE slug = 'twin-flames-one-soul-in-two-bodies';

UPDATE blog_posts SET
  meta_title = 'The Space Between Us: On String of Fate | Everly White',
  meta_description = 'A note on the thread that connects people who are far apart, and the piece we made to hold that feeling.'
WHERE slug = 'the-space-between-us-string-of-fate';
