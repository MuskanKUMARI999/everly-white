import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { normaliseValues, SECTIONS_BY_KEY, type SectionValues } from "@/lib/content/sections";

/**
 * Editable copy for the homepage and FAQ sections, as saved in Admin → Home Page / Admin → FAQs.
 *
 * The whole table is read in one query (it holds one small row per section) and handed to the page
 * as a lookup, so a homepage with a dozen sections still costs a single round trip.
 *
 * A section with no row yet — a fresh database, or one that has simply never been edited — is not a
 * failure case: `normaliseValues` falls back to the schema defaults, which reproduce the copy the
 * components used to hardcode. The same applies field by field, so a section saved before a new
 * field existed keeps rendering that field's default rather than a blank.
 */
export interface PageContent {
  values(key: string): SectionValues;
  isVisible(key: string): boolean;
}

type StoredRow = { content: unknown; is_visible: boolean };

function buildPageContent(rows: Map<string, StoredRow>): PageContent {
  // Normalising is cheap but not free, and a section is often read twice (visibility, then values).
  const cache = new Map<string, SectionValues>();

  return {
    values(key) {
      const cached = cache.get(key);
      if (cached) return cached;

      const schema = SECTIONS_BY_KEY[key];
      if (!schema) {
        console.error(`Unknown site content section: ${key}`);
        return {};
      }

      const normalised = normaliseValues(schema, rows.get(key)?.content ?? {});
      cache.set(key, normalised);
      return normalised;
    },
    isVisible(key) {
      const schema = SECTIONS_BY_KEY[key];
      // A section that cannot be hidden always renders, whatever the column says.
      if (schema && !schema.canHide) return true;
      return rows.get(key)?.is_visible ?? true;
    },
  };
}

/**
 * Deduplicated per request: the homepage reads it once for its own sections, and the shared trust
 * bar reads it again for itself rather than taking a prop from three different pages. React's
 * cache() collapses those into a single query.
 */
export const getPageContent = cache(async function getPageContent(): Promise<PageContent> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("site_content").select("key, content, is_visible");

  if (error) {
    // The page still renders its default copy rather than 500ing on a content read.
    console.error("Error fetching site content:", error);
    return buildPageContent(new Map());
  }

  return buildPageContent(
    new Map((data ?? []).map((row) => [row.key, { content: row.content, is_visible: row.is_visible }])),
  );
});
