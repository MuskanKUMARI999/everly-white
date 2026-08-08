-- Re-tag four posts onto "Spiritual meanings".
--
-- 020_blog_category_rename.sql mapped the old "Rituals" category onto "Conscious lifestyle", but
-- all three posts that landed there are about spiritual meaning rather than lifestyle: an altar
-- ritual before sunrise, twin flames as one soul in two bodies, and the thread of fate between
-- people who are apart. "Spiritual meanings" had no old equivalent to map from, so it sat empty
-- while these three sat under the wrong name.
--
-- "Living in Cosmic Time" moves across too. It was tagged "Craftsmanship & Care", but it is about
-- designing around lunar phases rather than about how a piece is made or cared for.
--
-- Resulting /blog tabs (the newest post is the Editor's Pick above the tab strip and is excluded
-- from the grid, so a tab shows one fewer than the database holds for that category):
--   Spiritual meanings   4     Meaningful gifts     1     Styling              0
--   Craftsmanship & Care 2     Conscious lifestyle  0
--
-- Matched on slug rather than on the old category name, so this stays correct even if a post is
-- re-categorised in Admin → Blog before this runs.

update blog_posts
set metadata = jsonb_set(
  coalesce(metadata, '{}'::jsonb),
  '{category}',
  '"Spiritual meanings"'::jsonb,
  true
)
where slug in (
  'slow-morning-ritual',
  'twin-flames-one-soul-in-two-bodies',
  'the-space-between-us-string-of-fate',
  'living-in-cosmic-time'
);
