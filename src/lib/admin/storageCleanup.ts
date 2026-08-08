import type { createServiceClient } from "@/lib/supabase/service";
import type { MediaBucket } from "@/lib/admin/mediaTypes";

// Deleting a product, collection, blog post or banner used to remove only the database row, leaving
// its uploaded files in Storage with nothing pointing at them — unreachable, unlistable and still
// billed for. These helpers take the URLs a record was holding and remove the matching objects.
//
// Everything here is deliberately conservative about what it will touch. Most image URLs in this
// project are NOT in Storage at all: the seeded catalogue references local files under `public/`
// (e.g. `/images/products/twin-flames/1-pair.jpg`), and an admin may paste an external URL. Only a
// URL that parses as one of our own public bucket objects is ever acted on; anything else is
// ignored rather than guessed at.

const KNOWN_BUCKETS: MediaBucket[] = ["product-images", "product-videos", "site-images"];

// Supabase public object URLs look like:
//   https://<ref>.supabase.co/storage/v1/object/public/<bucket>/<path...>
const PUBLIC_OBJECT_PREFIX = "/storage/v1/object/public/";

type ParsedObject = { bucket: MediaBucket; path: string };

/**
 * Origin of this project's Supabase instance. A URL is only ever treated as one of our objects when
 * it actually lives there — without this check a URL merely *shaped* like a Storage path but hosted
 * anywhere else (`https://example.com/storage/v1/object/public/site-images/other.jpg`) would be
 * parsed into a bucket + path and then deleted from OUR bucket. Image URLs are admin-editable free
 * text, so that is reachable input, not a hypothetical.
 */
function projectOrigin(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
}

export function parseStorageUrl(url: string | null | undefined): ParsedObject | null {
  if (!url || typeof url !== "string") return null;

  const origin = projectOrigin();
  // Unable to tell what our own host is — decline to delete rather than guess. The cost is an
  // orphaned file, which is exactly the behaviour that existed before this module.
  if (!origin) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    // Relative paths (`/images/...`) are local files in `public/`, not Storage objects.
    return null;
  }

  if (parsedUrl.origin !== origin) return null;
  const pathname = parsedUrl.pathname;

  const index = pathname.indexOf(PUBLIC_OBJECT_PREFIX);
  if (index === -1) return null;

  const remainder = pathname.slice(index + PUBLIC_OBJECT_PREFIX.length);
  const slash = remainder.indexOf("/");
  if (slash <= 0) return null;

  const bucket = remainder.slice(0, slash);
  // decodeURIComponent because the path is URL-encoded in the public URL but not in the API.
  const path = decodeURIComponent(remainder.slice(slash + 1));
  if (!path || !KNOWN_BUCKETS.includes(bucket as MediaBucket)) return null;

  return { bucket: bucket as MediaBucket, path };
}

/**
 * Best-effort removal of the Storage objects behind a set of URLs.
 *
 * Never throws and never reports failure upward: the caller has already deleted the record, which
 * is the action the admin actually asked for. A failure here leaves an orphaned file — the exact
 * situation that existed before this module — so it is logged and swallowed rather than surfaced
 * as a scary error on an operation that in fact succeeded.
 */
export async function removeStorageObjectsByUrl(
  supabase: ReturnType<typeof createServiceClient>,
  urls: (string | null | undefined)[],
): Promise<void> {
  const byBucket = new Map<MediaBucket, Set<string>>();

  for (const url of urls) {
    const parsed = parseStorageUrl(url);
    if (!parsed) continue;
    const paths = byBucket.get(parsed.bucket) ?? new Set<string>();
    paths.add(parsed.path);
    byBucket.set(parsed.bucket, paths);
  }

  if (byBucket.size === 0) return;

  await Promise.all(
    Array.from(byBucket, async ([bucket, paths]) => {
      try {
        const { error } = await supabase.storage.from(bucket).remove(Array.from(paths));
        if (error) {
          console.error(`Could not remove orphaned files from ${bucket}:`, error.message);
        }
      } catch (error) {
        console.error(`Could not remove orphaned files from ${bucket}:`, error);
      }
    }),
  );
}

/**
 * Image URLs referenced inside a blog post's body.
 *
 * The body is a serialised block array (see BlogContentEditor), but this scans the raw string
 * rather than parsing it: a post written before the block editor existed, or one that fails to
 * parse for any reason, would otherwise silently leak every image it contains.
 */
export function extractContentImageUrls(content: string | null): string[] {
  if (!content) return [];
  const matches = content.match(/https?:\/\/[^"'\s\\]+/g) ?? [];
  return matches.filter((url) => parseStorageUrl(url) !== null);
}
