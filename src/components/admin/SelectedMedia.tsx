"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, PlayCircle, X } from "lucide-react";
import { formatBytes, productMediaKind } from "@/lib/admin/mediaTypes";

// Shared "what did I just pick?" strip for every admin uploader.
//
// The pickers used to give no sign at all between the file dialog closing and the upload
// finishing: no filename, no thumbnail, no spinner — so the only way to know whether a file had
// been chosen was to press Upload and see what happened. Everything visible about a chosen file
// lives here, so the product, video and new-product pickers all report the same way.

export type MediaItemState = "pending" | "uploading" | "done" | "error";

export type MediaItem = {
  file: File;
  state: MediaItemState;
  /** Failure reason, shown under the tile. */
  message?: string;
};

/** Stable identity for a File — the same object isn't handed back by a second file dialog. */
export function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

/**
 * Appends a picker's or a drop's files to what is already staged, skipping any that are already
 * there. Picking the same file twice is easy to do now that the list persists, and silently
 * stacking duplicates would upload it twice.
 */
export function mergeFiles(current: MediaItem[], incoming: FileList | File[] | null): MediaItem[] {
  if (!incoming) return current;
  const seen = new Set(current.map((item) => fileKey(item.file)));
  const next = [...current];
  for (const file of Array.from(incoming)) {
    const key = fileKey(file);
    if (seen.has(key)) continue;
    seen.add(key);
    next.push({ file, state: "pending" });
  }
  return next;
}

/** Sets one file's state without disturbing the others. */
export function withItemState(
  items: MediaItem[],
  file: File,
  state: MediaItemState,
  message?: string,
): MediaItem[] {
  const key = fileKey(file);
  return items.map((item) => (fileKey(item.file) === key ? { ...item, state, message } : item));
}

function StatusBadge({ item }: { item: MediaItem }) {
  if (item.state === "uploading") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/75">
        <Loader2 size={18} strokeWidth={1.6} className="animate-spin text-brown" />
        <span className="font-heading text-[10px] uppercase tracking-widest text-brown">
          Uploading
        </span>
      </div>
    );
  }
  if (item.state === "done") {
    return (
      <span className="absolute bottom-1 left-1 flex items-center gap-1 bg-green-600 px-1.5 py-0.5 font-heading text-[10px] uppercase tracking-widest text-white">
        <Check size={10} strokeWidth={2.5} /> Uploaded
      </span>
    );
  }
  if (item.state === "error") {
    return (
      <span className="absolute bottom-1 left-1 flex items-center gap-1 bg-terracotta px-1.5 py-0.5 font-heading text-[10px] uppercase tracking-widest text-white">
        <AlertCircle size={10} strokeWidth={2.5} /> Failed
      </span>
    );
  }
  return (
    <span className="absolute bottom-1 left-1 bg-white/85 px-1.5 py-0.5 font-heading text-[10px] uppercase tracking-widest text-neutral-500">
      Ready
    </span>
  );
}

/**
 * One picked file. The preview URL is made once, in state, and revoked when the tile unmounts —
 * tiles are keyed by file, so that lifetime is exactly the file's. Making it in an effect instead
 * would leave the tile blank on the render that matters most: the one right after the dialog
 * closes.
 */
function MediaTile({
  item,
  kind,
  onRemove,
  busy,
}: {
  item: MediaItem;
  kind: "image" | "video";
  onRemove?: (file: File) => void;
  busy: boolean;
}) {
  const [preview] = useState(() => URL.createObjectURL(item.file));

  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);

  return (
    <li className="flex flex-col gap-1">
      <div className="relative aspect-square overflow-hidden border border-neutral-200 bg-pink-100/30">
        {kind === "video" ? (
          <>
            <video
              src={preview}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <PlayCircle
              size={24}
              strokeWidth={1.4}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
            />
          </>
        ) : (
          // A local blob: URL has nothing for the image optimiser to fetch, so this one preview
          // stays a plain <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        )}

        <StatusBadge item={item} />

        {onRemove && !busy && (
          <button
            type="button"
            onClick={() => onRemove(item.file)}
            className="cursor-pointer absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-white/85 text-terracotta backdrop-blur-sm transition-colors hover:bg-white"
            title={`Remove ${item.file.name}`}
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      <p className="truncate font-body text-xs text-neutral-500" title={item.file.name}>
        {item.file.name}
      </p>
      <p className="font-body text-[11px] text-neutral-400">{formatBytes(item.file.size)}</p>
      {item.state === "error" && item.message && (
        <p className="font-body text-[11px] text-terracotta">{item.message}</p>
      )}
    </li>
  );
}

export function SelectedMediaList({
  items,
  kind,
  onRemove,
  busy = false,
}: {
  items: MediaItem[];
  /** Omit where one picker takes both — each tile then reads its own file's type. */
  kind?: "image" | "video";
  /** Omitted where a file cannot be taken back — it is already in Storage. */
  onRemove?: (file: File) => void;
  busy?: boolean;
}) {
  if (!items.length) return null;

  const kinds = new Set(items.map((item) => kind ?? productMediaKind(item.file)));
  // "3 files" once a batch mixes the two, rather than miscounting them all as images.
  const noun = kinds.size === 1 ? [...kinds][0] : "file";
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const uploadedCount = items.filter((item) => item.state === "done").length;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-heading text-[12px] uppercase tracking-widest text-neutral-500">
        {items.length} {noun}
        {items.length === 1 ? "" : "s"} selected · {formatBytes(totalBytes)}
        {uploadedCount > 0 && <span className="text-green-600"> · {uploadedCount} uploaded</span>}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <MediaTile
            key={fileKey(item.file)}
            item={item}
            kind={kind ?? productMediaKind(item.file)}
            onRemove={onRemove}
            busy={busy}
          />
        ))}
      </ul>
    </div>
  );
}
