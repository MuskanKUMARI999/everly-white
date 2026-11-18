"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Upload, X } from "lucide-react";
import { uploadSingleFile } from "@/lib/admin/uploadClient";
import { CLEARED_SUFFIX } from "@/lib/admin/formValues";
import { MEDIA_RULES, formatBytes, type SiteImageFolder } from "@/lib/admin/mediaTypes";

interface ImageUrlFieldProps {
  name: string;
  label: string;
  defaultValue?: string | null;
  folder: SiteImageFolder;
}

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-base text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses = "font-heading text-sm uppercase tracking-widest text-neutral-500";

// `next.config.ts` only allows images from the Supabase Storage host, so any other URL pasted here
// renders as a broken image with no explanation — the field looked like it accepted anything.
// Rather than widen remotePatterns (which would proxy arbitrary third-party hosts through the image
// optimiser), the field now says what it actually supports and warns before the image breaks.
function isUnsupportedImageHost(value: string): boolean {
  if (!value.trim()) return false;
  // A relative path is a local file in public/ and is always fine.
  if (value.startsWith("/")) return false;

  try {
    const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return new URL(value).hostname !== supabaseHost;
  } catch {
    // Still being typed, or not a URL at all — nothing useful to say yet.
    return false;
  }
}

export function ImageUrlField({ name, label, defaultValue, folder }: ImageUrlFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  // The file dialog closing was the only sign anything had been chosen. Naming the file — while it
  // uploads, and after it lands — is what tells you the click did something.
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // An empty field means "leave the saved picture alone" everywhere else in the panel, which would
  // make the Clear button below do nothing at all. Pressing it therefore posts this alongside the
  // empty field, and that — not the emptiness — is what removes the image.
  const [cleared, setCleared] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsupportedHost = isUnsupportedImageHost(url);

  function handleUrlChange(next: string) {
    setUrl(next);
    if (next.trim()) setCleared(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setPicked({ name: file.name, size: file.size });

    // Straight to Storage on a server-signed token — the old route handler forwarded the bytes
    // through the server, which put a hero photo at the mercy of the platform's payload ceiling.
    const result = await uploadSingleFile("site-images", folder, file);
    if ("error" in result) {
      setError(result.error);
      setPicked(null);
    } else {
      setUrl(result.url);
      setCleared(false);
    }

    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className={labelClasses}>{label}</label>
      {/* min-w-0 on the field: an <input> defaults to min-width:auto, so flex-1 alone can't shrink
          it below ~20 characters and the Upload button gets pushed off a phone screen. */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          name={name}
          type="url"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="Upload a file, or paste a Supabase Storage URL"
          className={`${inputClasses} min-w-0 flex-1`}
        />
        {cleared && <input type="hidden" name={`${name}${CLEARED_SUFFIX}`} value="1" />}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer disabled:cursor-not-allowed flex shrink-0 items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-50"
        >
          <Upload size={14} strokeWidth={1.6} />
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
      {picked && (
        <p
          className={`flex items-center gap-2 font-body text-sm ${
            uploading ? "text-brown" : "text-green-600"
          }`}
        >
          {uploading ? (
            <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
          ) : (
            <Check size={14} strokeWidth={2} />
          )}
          <span className="truncate" title={picked.name}>
            {picked.name}
          </span>
          <span className="shrink-0 text-neutral-400">{formatBytes(picked.size)}</span>
          <span className="shrink-0">{uploading ? "uploading…" : "uploaded"}</span>
        </p>
      )}
      <p className="font-body text-sm text-neutral-400">
        {MEDIA_RULES["site-images"].label}. Uploading is the reliable route — images hosted anywhere
        outside this site&apos;s own storage will not display.
      </p>
      {error && <p className="font-body text-sm text-terracotta">{error}</p>}
      {unsupportedHost && (
        <p className="font-body text-sm text-terracotta">
          This address is not on the site&apos;s image host, so it will show as a broken image.
          Upload the file instead.
        </p>
      )}
      {url && (
        <div className="group relative h-32 w-32 overflow-hidden border border-neutral-100 bg-pink-100/30">
          {/* An unsupported host is not handed to next/image at all — it would only produce a
              failed optimiser request. The tile still renders so the clear button stays reachable. */}
          {unsupportedHost ? (
            <div className="flex h-full w-full items-center justify-center px-2 text-center font-body text-xs text-neutral-400">
              No preview
            </div>
          ) : (
            <Image src={url} alt="" fill className="object-cover" sizes="128px" />
          )}
          <button
            type="button"
            onClick={() => {
              setUrl("");
              setPicked(null);
              setCleared(true);
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
