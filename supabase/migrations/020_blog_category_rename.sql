-- Re-tag existing blog posts onto the new category names used by the redesigned /blog filter tabs.
--
-- Categories live in blog_posts.metadata->>'category' (added in 003_add_blog_metadata.sql).
-- The redesign replaced the old set entirely, so every existing post would otherwise be orphaned:
-- the tab strip would render, but every tab except "All" would read "No posts in this category yet".
--
-- Old set: Rituals · Studio Notes · Care & Craft · Gifting
-- New set: Styling · Conscious lifestyle · Meaningful gifts · Spiritual meanings · Craftsmanship & Care
--
-- "Styling" and "Spiritual meanings" have no old equivalent, so no post maps onto them here —
-- re-tag those by hand in Admin → Blog once this has run.

update blog_posts
set metadata = jsonb_set(
  coalesce(metadata, '{}'::jsonb),
  '{category}',
  to_jsonb(
    case metadata->>'category'
      when 'Rituals'      then 'Conscious lifestyle'
      when 'Studio Notes' then 'Craftsmanship & Care'
      when 'Care & Craft' then 'Craftsmanship & Care'
      when 'Gifting'      then 'Meaningful gifts'
      -- Posts saved before categories existed have no category key at all. They previously fell
      -- back to "Studio Notes" when read, so land them on that name's new equivalent.
      else 'Craftsmanship & Care'
    end
  ),
  true
)
where metadata->>'category' is null
   or metadata->>'category' in ('Rituals', 'Studio Notes', 'Care & Craft', 'Gifting');
