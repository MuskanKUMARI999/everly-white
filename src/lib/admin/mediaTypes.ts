// Shared upload rules for the admin media pipeline.
//
// This file deliberately holds no "use server"/"use client" directive: both the server actions that
// mint signed upload URLs and the browser helper that performs the upload import from here, so the
// size and type limits are stated once. The browser copy is a courtesy — it fails a bad file fast
// instead of after a round trip — and the server re-checks every one of these before signing.

export type MediaBucket = "product-images" | "product-videos" | "site-images";

export type SiteImageFolder = "collections" | "blog" | "banners" | "content";

export const MEDIA_RULES: Record<MediaBucket, { types: string[]; maxBytes: number; label: string }> =
  {
    "product-images": {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 10 * 1024 * 1024,
      label: "JPG, PNG or WEBP up to 10MB",
    },
    "site-images": {
      types: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 10 * 1024 * 1024,
      label: "JPG, PNG or WEBP up to 10MB",
    },
    // 100MB matches the file_size_limit the product-videos bucket was created with in migration 008.
    "product-videos": {
      types: ["video/mp4", "video/webm", "video/quicktime"],
      maxBytes: 100 * 1024 * 1024,
      label: "MP4, WEBM or MOV up to 100MB",
    },
  };

/** A file that has already landed in Storage but has no database row yet. */
export type UploadedMedia = {
  /** Object path inside the bucket, e.g. "<uuid>/1712-abc.jpg". */
  path: string;
  /** Original filename minus its extension, used as default alt text. */
  alt?: string;
};

export type SignedUpload =
  | { success: true; path: string; token: string; publicUrl: string }
  | { success: false; message: string };

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** Client-side pre-check. The server repeats this before it will sign anything. */
export function checkFileAgainstRules(bucket: MediaBucket, file: File): string | null {
  const rules = MEDIA_RULES[bucket];
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (!rules.types.includes(file.type)) {
    return `"${file.name}" is not a supported format (${rules.label}).`;
  }
  if (file.size > rules.maxBytes) {
    return `"${file.name}" is ${formatBytes(file.size)} — the limit is ${formatBytes(rules.maxBytes)}.`;
  }
  return null;
}

/**
 * An uploaded product file plus which bucket it landed in. Photos and videos share one gallery
 * order, so a batch has to be registered as a single ordered list rather than one call per table —
 * otherwise the second call's rows would be stacked on top of the first call's.
 */
export type ProductMediaUpload = UploadedMedia & { kind: "image" | "video" };

/** Which of the two product buckets a picked file belongs in. */
export function productMediaKind(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

export function productMediaBucket(file: File): MediaBucket {
  return productMediaKind(file) === "video" ? "product-videos" : "product-images";
}
