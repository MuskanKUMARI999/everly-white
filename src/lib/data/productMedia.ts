/**
 * One order for a product's photos *and* videos.
 *
 * The gallery used to be two lists glued together — every photo, then every video — so a clip could
 * only ever be last. Admins wanted a video able to lead, or to sit second or third, which means
 * `position` has to number the two tables as a single sequence rather than restarting at 0 in each.
 *
 * Merging on `position` is only meaningful once that renumbering has happened (migration 040 does it
 * for existing rows; every admin write since keeps it that way). Rows written before it have
 * images at 0..n-1 *and* videos at 0..m-1, and merging those would deal videos into the middle of
 * the photos at random. A position shared across the two lists is the tell, and the fallback is
 * exactly what the storefront showed before: all photos, then all videos.
 */

export type ProductMediaKind = "image" | "video";

/** The ordering columns, so both the storefront rows and the admin's id-only rows fit. */
export interface MediaOrderRef {
  position: number;
  created_at: string;
}

export type OrderedMedia<I, V> =
  | { kind: "image"; item: I }
  | { kind: "video"; item: V };

function bySequence(a: MediaOrderRef, b: MediaOrderRef) {
  if (a.position !== b.position) return a.position - b.position;
  // Same slot: oldest first, so the result never depends on the order PostgREST happened to return
  // the embedded array in.
  return a.created_at.localeCompare(b.created_at);
}

export function orderProductMedia<I extends MediaOrderRef, V extends MediaOrderRef>(
  images: I[] | null | undefined,
  videos: V[] | null | undefined,
): OrderedMedia<I, V>[] {
  const photos = (images ?? []).map((item) => ({ kind: "image" as const, item }));
  const clips = (videos ?? []).map((item) => ({ kind: "video" as const, item }));
  photos.sort((a, b) => bySequence(a.item, b.item));
  clips.sort((a, b) => bySequence(a.item, b.item));

  const merged: OrderedMedia<I, V>[] = [...photos, ...clips];
  const slots = new Set(merged.map((entry) => entry.item.position));
  // Two rows claiming the same slot means the sequences were never unified — leave the legacy
  // photos-then-videos order alone rather than inventing an interleaving from meaningless numbers.
  if (slots.size !== merged.length) return merged;

  return merged.sort((a, b) => bySequence(a.item, b.item));
}
