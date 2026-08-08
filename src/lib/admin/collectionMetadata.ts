import type { Json } from "@/lib/supabase/database.types";

// Pure helpers for the metadata-backed half of a collection: the copy that has no column of its own
// and lives in `collections.metadata` (put there by migrations 024/025) — eyebrow, hero alt text,
// intro, stats strip, founder note, plus the header-menu and homepage-tile images.
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

function trimmedOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Merge the form's content fields into the metadata already stored on the row.
 *
 * Two rules matter here:
 *  - Start from `existing`, so keys this form does not render survive untouched.
 *  - An emptied field deletes its key rather than storing "", which is what lets each reader fall
 *    back to its default (eyebrow → subtitle, navImage → hero_image, intro → title + description).
 */
export function buildCollectionMetadata(
  existing: Record<string, Json | undefined>,
  formData: FormData,
): Record<string, Json | undefined> {
  const metadata: Record<string, Json | undefined> = { ...existing };

  const setOrClear = (key: string, value: Json | null) => {
    if (value === null) delete metadata[key];
    else metadata[key] = value;
  };

  setOrClear("eyebrow", trimmedOrNull(formData.get("eyebrow")));
  setOrClear("heroImageAlt", trimmedOrNull(formData.get("heroImageAlt")));
  setOrClear("navImage", trimmedOrNull(formData.get("navImage")));
  setOrClear("navImageAlt", trimmedOrNull(formData.get("navImageAlt")));
  setOrClear("navTagline", trimmedOrNull(formData.get("navTagline")));
  setOrClear("tileImage", trimmedOrNull(formData.get("tileImage")));

  const introHeading = trimmedOrNull(formData.get("introHeading"));
  const introParagraphs = parseParagraphs(formData.get("introParagraphs") as string | null);
  // The reader expects heading and paragraphs together, so an intro with neither is dropped whole.
  setOrClear(
    "intro",
    introHeading || introParagraphs.length
      ? { heading: introHeading ?? "", paragraphs: introParagraphs }
      : null,
  );

  const stats = parseStats(formData.get("stats") as string | null);
  setOrClear("stats", stats.length ? stats : null);

  const founderQuote = trimmedOrNull(formData.get("founderQuote"));
  setOrClear(
    "founderNote",
    founderQuote
      ? {
          heading: trimmedOrNull(formData.get("founderHeading")) ?? "Founder's Note",
          quote: founderQuote,
          attribution: trimmedOrNull(formData.get("founderAttribution")) ?? "Everly White Studios",
        }
      : null,
  );

  return metadata;
}
