import { submittedText, wasCleared } from "@/lib/admin/formValues";
import type { Json } from "@/lib/supabase/database.types";

// Pure helpers for the metadata-backed half of a collection: the copy that has no column of its own
// and lives in `collections.metadata` (put there by migrations 024/025) — eyebrow, hero alt text,
// intro, stats strip, section eyebrows, plus the header-menu and homepage-tile images.
//
// Kept out of actions.ts deliberately: that file carries "use server", which may only export async
// functions, so nothing in it can be exercised directly. These are the parts worth checking, since
// a mistake here silently overwrites the client's collection copy.

/** Paragraphs are separated by a blank line, so a paragraph may itself span several lines. */
export function parseParagraphs(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim().replace(/\s*\n\s*/g, " "))
    .filter(Boolean);
}

/** One stat per line, written as `value | label` — e.g. `100+ | Hours of Hand Craft, Per Piece`. */
export function parseStats(raw: string | null): { value: string; label: string }[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split("|");
      return { value: value.trim(), label: rest.join("|").trim() };
    })
    .filter((stat) => stat.value || stat.label);
}

/** The intro already stored on the row, so an untouched intro box can fall back to it. */
function storedIntro(existing: Record<string, Json | undefined>): {
  heading: string;
  paragraphs: string[];
} {
  const intro = existing.intro;
  if (!intro || typeof intro !== "object" || Array.isArray(intro)) {
    return { heading: "", paragraphs: [] };
  }
  const record = intro as Record<string, Json | undefined>;
  return {
    heading: typeof record.heading === "string" ? record.heading : "",
    paragraphs: Array.isArray(record.paragraphs)
      ? record.paragraphs.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

/**
 * Merge the form's content fields into the metadata already stored on the row.
 *
 * Two rules matter here:
 *  - Start from `existing`, so keys this form does not render survive untouched.
 *  - An emptied field keeps whatever is stored under its key rather than deleting it. The form
 *    arrives pre-filled, so a blank box is the client saving a page they only partly edited — see
 *    formValues.ts. The exception is an image, which has a Clear button: that posts
 *    `<name>__cleared` beside the empty field and does remove the key, after which each reader
 *    falls back to its default again (navImage → hero_image).
 */
export function buildCollectionMetadata(
  existing: Record<string, Json | undefined>,
  formData: FormData,
): Record<string, Json | undefined> {
  const metadata: Record<string, Json | undefined> = { ...existing };

  const setOrKeep = (key: string, field: string, value: Json | null) => {
    if (value !== null) metadata[key] = value;
    else if (wasCleared(formData, field)) delete metadata[key];
  };

  setOrKeep("eyebrow", "eyebrow", submittedText(formData.get("eyebrow")));
  setOrKeep("heroImageAlt", "heroImageAlt", submittedText(formData.get("heroImageAlt")));
  setOrKeep("navImage", "navImage", submittedText(formData.get("navImage")));
  setOrKeep("navImageAlt", "navImageAlt", submittedText(formData.get("navImageAlt")));
  setOrKeep("navTagline", "navTagline", submittedText(formData.get("navTagline")));
  setOrKeep("tileImage", "tileImage", submittedText(formData.get("tileImage")));

  // The small-caps lines above the page's two bands.
  setOrKeep("storyEyebrow", "storyEyebrow", submittedText(formData.get("storyEyebrow")));
  setOrKeep("shopEyebrow", "shopEyebrow", submittedText(formData.get("shopEyebrow")));

  // Heading and paragraphs are read together, so an intro half-filled in the form is completed
  // from the stored one rather than saved with the other half missing.
  const stored = storedIntro(existing);
  const introHeading = submittedText(formData.get("introHeading"));
  const introParagraphs = parseParagraphs(formData.get("introParagraphs") as string | null);
  if (introHeading !== null || introParagraphs.length) {
    metadata.intro = {
      heading: introHeading ?? stored.heading,
      paragraphs: introParagraphs.length ? introParagraphs : stored.paragraphs,
    };
  }

  const stats = parseStats(formData.get("stats") as string | null);
  if (stats.length) metadata.stats = stats;

  // A `founderNote` key is deliberately not written or read any more: the collection page has no
  // founder band, and the founder's story is edited on Admin → About Us instead. Any leftover key
  // on an existing row is simply ignored — this merge starts from `existing`, so it is left alone
  // rather than destructively stripped.

  return metadata;
}

/**
 * The `description` column, derived from the intro the form actually shows.
 *
 * The two were separate fields that said the same thing: `description` is only ever read as the
 * fallback when `metadata.intro` is absent, so once the admin filled in Intro Paragraphs the
 * description became invisible — and could quietly contradict what the page displayed. The form now
 * has one intro field, and the column follows it. An empty intro box keeps the stored description,
 * which is `current` on an edit and null on a collection being created.
 */
export function collectionDescriptionFromForm(
  formData: FormData,
  current: string | null,
): string | null {
  const paragraphs = parseParagraphs(formData.get("introParagraphs") as string | null);
  return paragraphs.length ? paragraphs.join("\n\n") : current;
}
