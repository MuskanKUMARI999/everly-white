"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";
import { uploadSingleFile } from "@/lib/admin/uploadClient";
import { MEDIA_RULES } from "@/lib/admin/mediaTypes";

/**
 * The image picker used inside the page-content editor.
 *
 * ImageUrlField is the equivalent for the banner and collection forms, but it owns its own value
 * and submits through a form field name. Section content is submitted as one JSON blob instead, so
 * this variant is fully controlled by the parent and reports changes upward. The upload path is the
 * same: bytes go straight to Storage on a server-signed token, and only the resulting URL is held.
 */

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-base text-neutral-500 outline-none transition-colors focus:border-neutral-500";

// next.config.ts only optimises images from Supabase Storage, so anything else renders broken with
// no explanation. Say so before the image breaks rather than after.
function isUnsupportedImageHost(value: string): boolean {
  if (!value.trim() || value.startsWith("/")) return false;
  try {
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return new URL(value).hostname !== supabaseHost;
  } catch {
    return false;
  }
}

interface ContentImageInputProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Pressing Clear has to be told apart from a box that was simply left empty: an empty field
   * keeps the picture already on the page, so only this reports a deliberate removal.
   */
  onClear?: () => void;
}

export function ContentImageInput({ value, onChange, onClear }: ContentImageInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsupportedHost = isUnsupportedImageHost(value);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);

    const result = await uploadSingleFile("site-images", "content", file);
    if ("error" in result) setError(result.error);
    else onChange(result.url);

    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Upload a file, or paste an image URL"
          className={`${inputClasses} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer disabled:cursor-not-allowed flex shrink-0 items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Upload size={14} strokeWidth={1.6} />
          )}
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p className="font-body text-sm text-neutral-400">
        {MEDIA_RULES["site-images"].label}. Paths starting with &ldquo;/&rdquo; are images already
        shipped with the site.
      </p>
      {error && <p className="font-body text-sm text-terracotta">{error}</p>}
      {unsupportedHost && (
        <p className="font-body text-sm text-terracotta">
          This address is not on the site&apos;s image host, so it will show as a broken image.
          Upload the file instead.
        </p>
      )}

      {value && (
        <div className="group relative h-28 w-28 overflow-hidden border border-neutral-100 bg-pink-100/30">
          {unsupportedHost ? (
            <div className="flex h-full w-full items-center justify-center px-2 text-center font-body text-xs text-neutral-400">
              No preview
            </div>
          ) : (
            <Image src={value} alt="" fill className="object-cover" sizes="112px" />
          )}
          <button
            type="button"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="cursor-pointer absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-white/80 text-terracotta backdrop-blur-sm transition-colors hover:bg-white"
            title="Clear image"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
