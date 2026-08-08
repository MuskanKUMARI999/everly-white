-- Seed data for Everly White
-- Run this after `001_initial_schema.sql` to populate the database with the
-- static content currently used in the Next.js app.

-- ---------------------------------------------------------------------------
-- Collections
-- ---------------------------------------------------------------------------
INSERT INTO collections (
  slug, name, category, eyebrow, subtitle, hero_image, hero_image_alt,
  intro_heading, intro_paragraphs, stats,
  founder_note_heading, founder_note_quote, founder_note_attribution,
  sort_order
) VALUES (
  'center-of-the-universe',
  'Center of the Universe',
  'center-pieces',
  'The Debut Collection',
  'Luxe designs that are loud in the eyes, quiet in the essence.',
  '/images/instagram/insta-chair.jpg',
  'Everly White mirror-inlay plates styled in a sunlit living room',
  'Where two souls become one reflection.',
  ARRAY[
    'Center of the Universe is our founding collection — five hand-finished plates, each one a meditation on connection. The pull between twin flames, the quiet gravity of a lunar bond, a fate written in the stars: every piece carries its own quiet mythology, carved by hand and set with mirror.',
    'No two plates catch the light the same way. That isn''t a flaw to correct, but the entire point — a reminder that what is meant for you always finds its way home.'
  ],
  '[{"value": "5", "label": "Pieces in the Collection"}, {"value": "100+", "label": "Hours of Hand Craft, Per Piece"}]'::jsonb,
  'A reminder that what is meant for you has no clock.',
  'It waits. It finds you. Not even time can take it away. The Center of the Universe collection celebrates our never-ending desire and longing for a person to come home to — someone our soul calls home.',
  'Everly White Studios, Founder''s Note',
  0
);

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
WITH collection AS (
  SELECT id FROM collections WHERE slug = 'center-of-the-universe' LIMIT 1
)
INSERT INTO products (
  collection_id, slug, name, price, tagline, description, story, dimensions,
  main_image, hover_image, sort_order
)
SELECT
  c.id,
  p.slug,
  p.name,
  p.price,
  p.tagline,
  p.description,
  p.story,
  p.dimensions,
  p.main_image,
  p.hover_image,
  p.sort_order
FROM collection c, (VALUES
  ('twin-flames', 'Twin Flames', 8800, 'One soul, two bodies — the Divine Masculine and Divine Feminine, cast in mirror and light.', 'Two hand-carved plates, one large and one small, bound by a shared motif that only completes itself when they sit side by side. Each is finished by hand with set mirror inlay, so the light catches a little differently on every pair we make.', 'Long before they meet, twin flames are already bound — two halves of one soul, pulled toward each other across lifetimes. This piece holds that pull in wood and mirror: one plate large, one small, complete only when they stand together.', 'Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.', '/images/products/twin-flames-1.png', '/images/products/twin-flames-2.png', 0),
  ('lunar-bond', 'Lunar Bond', 8560, 'A quiet pull between moon and mirror, forever in orbit.', 'A large mirror-inlay plate paired with its smaller companion, carved in a radiating lunar motif. Finished entirely by hand, so the mirror settles into the wood a little differently on every piece we make.', 'The moon does not chase the tide — it simply waits, and the tide always comes home. Lunar Bond holds that same quiet gravity: two plates in orbit, never touching, never apart.', 'Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.', '/images/products/lunar-bond-1.png', '/images/products/lunar-bond-2.png', 1),
  ('star-crossed-lovers', 'Star Crossed Lovers', 7589, 'Written in the stars, held together against all odds.', 'A star-motif carving spans two hand-finished plates — one larger, one smaller — meant to be displayed together on their brass stands. No two pairs ever catch the light quite the same way.', 'Some loves are written in the stars long before two people ever meet — held together against every distance, every doubt. This piece carries that promise, its constellation carved by hand.', 'Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.', '/images/products/star-crossed-lovers-1.png', '/images/products/star-crossed-lovers-2.png', 2),
  ('butterfly-effect', 'Butterfly Effect', 7770, 'The smallest spark of beauty, rippling into transformation.', 'A floral, wing-like carving spans two hand-finished plates, each set with mirror by hand. Displayed together, they carry the quiet motion their name suggests.', 'The smallest gesture can ripple into everything that follows — a single beat of wings, reshaping the whole sky. Butterfly Effect holds that quiet transformation in mirror and hand-carved wood.', 'Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.', '/images/products/butterfly-effect/1-pair.png', '/images/products/butterfly-effect/2-lifestyle.png', 3),
  ('string-of-fate', 'String of Fate', 8100, 'An invisible thread connecting hearts across the universe.', 'A large mirror-inlay plate paired with its smaller companion, carved in a fine lattice that lets an invisible thread of light run through the piece. Hand-finished, and never quite the same twice.', 'An invisible thread ties together those who are destined to meet — stretching, tangling, but never breaking. The String of Fate is drawn from this promise: that some souls are bound long before they ever meet, pulled back to one another again and again, until they finally come home.', 'Large plate — approx. 20cm (8in) diameter · Small plate — approx. 12cm (5in) diameter. Includes 2 brass display stands, delivered in a branded gift box.', '/images/products/string-of-fate-1.png', NULL, 4)
) AS p(slug, name, price, tagline, description, story, dimensions, main_image, hover_image, sort_order);

-- ---------------------------------------------------------------------------
-- Product gallery images (Butterfly Effect)
-- ---------------------------------------------------------------------------
INSERT INTO product_images (product_id, src, alt, sort_order)
SELECT p.id, i.src, i.alt, i.sort_order
FROM products p
CROSS JOIN (VALUES
  ('butterfly-effect', '/images/products/butterfly-effect/1-pair.png', 'Butterfly Effect large and small mirror-inlay plates displayed on brass stands', 0),
  ('butterfly-effect', '/images/products/butterfly-effect/2-lifestyle.png', 'Butterfly Effect plates styled on a console table with pampas grass and candles', 1),
  ('butterfly-effect', '/images/products/butterfly-effect/3-detail.png', 'Close-up of the hand-set mirror inlay and carved floral detail on Butterfly Effect', 2),
  ('butterfly-effect', '/images/products/butterfly-effect/4-specifications.png', 'Butterfly Effect product specifications — dimensions, materials and care', 3)
) AS i(product_slug, src, alt, sort_order)
WHERE p.slug = i.product_slug;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
INSERT INTO reviews (quote, name, location, rating, photos, sort_order)
VALUES
  ('The moment I unboxed my Twin Flames set, my living room felt transformed. The mirror work catches the light through the whole day — it''s like the piece is alive.', 'Ananya Mehta', 'Mumbai', 5, ARRAY['/images/instagram/product-marble-counter.jpg','/images/instagram/insta-window.jpg','/images/instagram/product-coffee-table.jpg','/images/instagram/lifestyle-sofa.jpg'], 0),
  ('Exquisite craftsmanship. You can tell each plate is hand-set. It''s become the first thing every guest comments on when they walk in.', 'Rhea Kapoor', 'Bengaluru', 5, ARRAY['/images/instagram/insta-chair.jpg','/images/instagram/lifestyle-sofa.jpg'], 1),
  ('I gifted the Lunar Bond to my sister for her wedding. The packaging alone felt like a keepsake. Everly White has an eye for detail that''s genuinely rare.', 'Ishaan Verma', 'New Delhi', 5, '{}', 2),
  ('Star Crossed Lovers sits above our console table now and it''s the calmest, most grounding thing in the room. Worth every rupee.', 'Meher Chopra', 'Chandigarh', 5, ARRAY['/images/instagram/insta-card.jpg'], 3),
  ('The String of Fate arrived faster than expected and the finish is even richer in person. I keep finding new details in the carving.', 'Aditya Rao', 'Hyderabad', 4, '{}', 4),
  ('Ordered the Butterfly Effect on a whim and it''s genuinely become a conversation piece. Everyone assumes it''s a vintage find.', 'Kavya Nair', 'Kochi', 5, '{}', 5),
  ('Customer care helped me pick the right piece for a housewarming gift and it landed perfectly. Thoughtful from browsing to unboxing.', 'Sanya Malhotra', 'Pune', 5, '{}', 6),
  ('You can feel the difference between this and mass-produced décor the second you hold it. Heavier, warmer, made with actual hands.', 'Vivaan Sharma', 'Jaipur', 4, '{}', 7),
  ('This is my third Everly White piece and the quality has never once dipped. The Twin Flames remains my favorite thing I own.', 'Diya Iyer', 'Chennai', 5, '{}', 8);

-- Note: Blog posts can be seeded similarly; their full JSON content is large
-- so it is recommended to migrate them via a script or the Supabase dashboard.
