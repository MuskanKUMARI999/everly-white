/**
 * The canonical blog category list — shared by the public filter tabs and the admin post form
 * so the two can't drift apart. Adding a category here makes it selectable in the admin panel
 * and filterable on /blog in one step.
 *
 * Stored per-post in `blog_posts.metadata.category`. Changing a name here without migrating
 * existing rows will orphan any post still tagged with the old spelling.
 */
export const BLOG_CATEGORIES = [
  "Styling",
  "Conscious lifestyle",
  "Meaningful gifts",
  "Spiritual meanings",
  "Craftsmanship & Care",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** Applied to posts saved before categories were selectable in the admin panel. */
export const DEFAULT_BLOG_CATEGORY: BlogCategory = "Craftsmanship & Care";

/** The public /blog filter tabs — the categories, preceded by an "All" option. */
export const BLOG_FILTER_TABS = ["All", ...BLOG_CATEGORIES] as const;
