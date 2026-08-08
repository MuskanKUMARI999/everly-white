"use client";

import { createClient } from "@/lib/supabase/client";
import { createMediaUploadUrl } from "@/lib/admin/actions";
import { checkFileAgainstRules, type MediaBucket, type UploadedMedia } from "@/lib/admin/mediaTypes";

// Browser half of the direct-to-Storage upload. The server mints a signed upload token (behind
// requireAdmin, on the service-role key) and the bytes then go from here straight to Supabase,
// never through a Server Action or a serverless function — which is the only way a file larger than
// the 1MB Server Action body cap, or the platform's own request payload ceiling, can get through.
//
// The anon browser client is only the transport: the token in the signed URL is what authorises the
// write, so the buckets keep their existing "no INSERT for anon/authenticated" policy.

export type UploadOutcome = {
  uploaded: UploadedMedia[];
  errors: string[];
};

/**
 * Storage folder for media chosen before its product row exists. The server only accepts a UUID
 * here, so the fallback has to produce the same shape — `crypto.randomUUID` needs a secure context
 * and is absent over plain HTTP, which would otherwise throw mid-upload rather than degrade.
 */
export function newBatchFolder(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function uploadFiles(
  bucket: MediaBucket,
  folder: string,
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<UploadOutcome> {
  const supabase = createClient();
  const uploaded: UploadedMedia[] = [];
  const errors: string[] = [];
  let done = 0;

  for (const file of files) {
    // Fail obvious cases before spending a round trip on them; the server checks again anyway.
    const localProblem = checkFileAgainstRules(bucket, file);
    if (localProblem) {
      errors.push(localProblem);
      onProgress?.(++done, files.length);
      continue;
    }

    const signed = await createMediaUploadUrl({
      bucket,
      folder,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });

    if (!signed.success) {
      errors.push(`"${file.name}": ${signed.message}`);
      onProgress?.(++done, files.length);
      continue;
    }

    const { error } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });

    if (error) {
      errors.push(`"${file.name}": ${error.message}`);
    } else {
      uploaded.push({ path: signed.path, alt: file.name.replace(/\.[^.]+$/, "") });
    }

    onProgress?.(++done, files.length);
  }

  return { uploaded, errors };
}

/** Convenience wrapper for the single-file fields that only need a public URL back. */
export async function uploadSingleFile(
  bucket: MediaBucket,
  folder: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const localProblem = checkFileAgainstRules(bucket, file);
  if (localProblem) return { error: localProblem };

  const signed = await createMediaUploadUrl({
    bucket,
    folder,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  });
  if (!signed.success) return { error: signed.message };

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });

  if (error) return { error: error.message };
  return { url: signed.publicUrl };
}
