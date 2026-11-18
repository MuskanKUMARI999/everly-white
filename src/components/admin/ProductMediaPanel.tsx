"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload, Star, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import {
  registerProductMedia,
  deleteProductImage,
  deleteProductVideo,
  setFeaturedProductImage,
  moveProductMedia,
  updateProductMediaAlt,
} from "@/lib/admin/actions";
import { uploadFiles } from "@/lib/admin/uploadClient";
import {
  SelectedMediaList,
  fileKey,
  mergeFiles,
  withItemState,
  type MediaItem,
} from "@/components/admin/SelectedMedia";
import {
  MEDIA_RULES,
  productMediaKind,
  type ProductMediaUpload,
  type UploadedMedia,
} from "@/lib/admin/mediaTypes";
import { orderProductMedia, type ProductMediaKind } from "@/lib/data/productMedia";
import type { AdminProduct } from "@/lib/data/admin";

interface ProductMediaPanelProps {
  product: AdminProduct;
}

const labelClasses = "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

const ACCEPT = [...MEDIA_RULES["product-images"].types, ...MEDIA_RULES["product-videos"].types].join(
  ",",
);

/** Deletes a photo or a clip. The two tables have their own actions, so the tile picks one. */
function DeleteMediaButton({
  kind,
  mediaId,
  productId,
  storagePath,
}: {
  kind: ProductMediaKind;
  mediaId: string;
  productId: string;
  storagePath: string;
}) {
  const [, action, isPending] = useActionState(
    kind === "video" ? deleteProductVideo : deleteProductImage,
    null,
  );
  const noun = kind === "video" ? "video" : "image";
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Remove this ${noun}?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name={kind === "video" ? "videoId" : "imageId"} value={mediaId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="storagePath" value={storagePath} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-white/80 text-terracotta backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
        title={`Remove this ${noun}`}
      >
        <X size={12} strokeWidth={2} />
      </button>
    </form>
  );
}

/** Promotes one photo to the product's card image. Hidden on the one that already is. */
function SetMainButton({ imageId, productId }: { imageId: string; productId: string }) {
  const [, action, isPending] = useActionState(setFeaturedProductImage, null);
  return (
    <form action={action}>
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed font-heading text-[11px] uppercase tracking-widest text-neutral-500 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-brown"
        title="Use this as the product's main photo"
      >
        {isPending ? "Setting…" : "Set as Main"}
      </button>
    </form>
  );
}

/** Moves one item one slot along the gallery — past a photo or a video, whichever is next to it. */
function MoveButton({
  kind,
  mediaId,
  productId,
  direction,
  disabled,
}: {
  kind: ProductMediaKind;
  mediaId: string;
  productId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  const [, action, isPending] = useActionState(moveProductMedia, null);
  const Icon = direction === "up" ? ChevronLeft : ChevronRight;
  return (
    <form action={action}>
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled || isPending}
        className="cursor-pointer disabled:cursor-not-allowed flex h-6 w-6 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-30"
        title={direction === "up" ? "Move earlier" : "Move later"}
      >
        <Icon size={12} strokeWidth={2} />
      </button>
    </form>
  );
}

/**
 * The description under one tile. Saved on demand rather than on every keystroke, and the Save
 * control only appears once the text differs from what is stored — so a row of tiles isn't a wall
 * of buttons.
 */
function AltTextField({
  kind,
  mediaId,
  productId,
  alt,
}: {
  kind: ProductMediaKind;
  mediaId: string;
  productId: string;
  alt: string | null;
}) {
  const stored = alt ?? "";
  const [value, setValue] = useState(stored);
  const [state, action, isPending] = useActionState(updateProductMediaAlt, null);
  const dirty = value.trim() !== stored.trim();

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="productId" value={productId} />
      <input
        name="alt"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={kind === "video" ? "Describe this video" : "Describe this photo"}
        title={
          kind === "video"
            ? "Read aloud by screen readers in place of the clip"
            : "Read aloud by screen readers and used by image search"
        }
        className="w-full border border-neutral-200 bg-white px-2 py-1 font-body text-sm text-neutral-500 outline-none transition-colors focus:border-brown"
      />
      {dirty && (
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed self-start font-heading text-[11px] uppercase tracking-widest text-brown underline decoration-brown/30 underline-offset-4 hover:text-neutral-500"
        >
          {isPending ? "Saving…" : "Save description"}
        </button>
      )}
      {state && !dirty && (
        <span
          className={`font-body text-xs ${state.success ? "text-green-600" : "text-terracotta"}`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}

/** Storage path out of a Supabase public URL, so deleting a row also deletes the object. */
function extractStoragePath(url: string, bucket: string): string {
  try {
    // path is like /storage/v1/object/public/<bucket>/<path>
    return new URL(url).pathname.split(`/${bucket}/`)[1] ?? "";
  } catch {
    return "";
  }
}

/**
 * `uploadFiles` reports failures through its progress callback and returns only the successes, in
 * input order — so the successes line up with the picked files once the failures are dropped. That
 * pairing is what lets a mixed batch be registered in the order it was actually picked.
 */
function pairUploads(files: File[], uploaded: UploadedMedia[], failed: Set<string>) {
  const pairs = new Map<string, UploadedMedia>();
  files
    .filter((file) => !failed.has(fileKey(file)))
    .forEach((file, index) => {
      const result = uploaded[index];
      if (result) pairs.set(fileKey(file), result);
    });
  return pairs;
}

export function ProductMediaPanel({ product }: ProductMediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Picked files are held here rather than read off the input at upload time: the input knows what
  // it holds but shows none of it, so the panel keeps its own list to draw.
  const [items, setItems] = useState<MediaItem[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [state, setState] = useState<{ success: boolean; message: string } | null>(null);

  // Merged here rather than in place: the two arrays arrive as props, and sorting them directly
  // would mutate what React was handed.
  const media = orderProductMedia(product.product_images, product.product_videos);

  function addFiles(picked: File[]) {
    if (!picked.length) return;
    setItems((current) => mergeFiles(current, picked));
    setState(null);
  }

  function removeFile(file: File) {
    const key = fileKey(file);
    setItems((current) => current.filter((item) => fileKey(item.file) !== key));
  }

  async function handleUpload() {
    if (!items.length) {
      setState({ success: false, message: "Nothing selected yet — click the box above first." });
      return;
    }

    const files = items.map((item) => item.file);
    setBusy(true);
    setState(null);
    setProgress({ done: 0, total: files.length });
    setItems((current) =>
      current.map((item) => ({ ...item, state: "pending" as const, message: undefined })),
    );

    // Tracked here as well as on the tiles: those states live in React state, which cannot be read
    // back in time to decide what stays staged.
    const failed = new Set<string>();

    // The two buckets have their own type and size rules, so a mixed batch is uploaded in two
    // passes — but registered as one list, in the order the admin picked, so that is the order the
    // gallery ends up in.
    const photos = files.filter((file) => productMediaKind(file) === "image");
    const clips = files.filter((file) => productMediaKind(file) === "video");
    const errors: string[] = [];
    const pairs = new Map<string, UploadedMedia>();
    let settled = 0;

    for (const [bucket, batch] of [
      ["product-images", photos],
      ["product-videos", clips],
    ] as const) {
      if (!batch.length) continue;

      // The product row already exists, so its own id is the storage folder.
      const result = await uploadFiles(bucket, product.id, batch, (event) => {
        setProgress({ done: settled + event.done, total: files.length });
        if (event.phase === "error") failed.add(fileKey(event.file));
        setItems((current) =>
          withItemState(
            current,
            event.file,
            event.phase === "start" ? "uploading" : event.phase === "done" ? "done" : "error",
            event.message,
          ),
        );
      });

      settled += batch.length;
      errors.push(...result.errors);
      for (const [key, value] of pairUploads(batch, result.uploaded, failed)) {
        pairs.set(key, value);
      }
    }

    const ordered: ProductMediaUpload[] = files.flatMap((file) => {
      const uploaded = pairs.get(fileKey(file));
      return uploaded ? [{ ...uploaded, kind: productMediaKind(file) }] : [];
    });

    let message = "";
    let success = false;

    if (ordered.length) {
      const result = await registerProductMedia(product.id, ordered);
      success = result.success;
      message = result.message;
    }
    if (errors.length) {
      success = false;
      message = [message, ...errors].filter(Boolean).join(" ");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    // Whatever landed is now in the grid above, so only failures stay staged — pressing Upload
    // again retries those instead of uploading the successes a second time.
    setItems((current) => current.filter((item) => failed.has(fileKey(item.file))));
    setProgress(null);
    setBusy(false);
    setState({ success, message: message || "Nothing was uploaded." });

    // The new rows are on the server; pull the refreshed product back down.
    if (ordered.length) startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Product Media
      </h3>

      {/* Photos and videos in one grid, in the exact order the product page will show them. */}
      {media.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((entry, index) => {
            const isVideo = entry.kind === "video";
            const bucket = isVideo ? "product-videos" : "product-images";
            return (
              <div key={`${entry.kind}:${entry.item.id}`} className="group flex flex-col gap-2">
                <div className="relative">
                  <div className="relative aspect-square overflow-hidden border border-neutral-100 bg-pink-100/30">
                    {isVideo ? (
                      <>
                        <video
                          src={entry.item.url}
                          className="h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <PlayCircle
                          size={28}
                          strokeWidth={1.4}
                          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                        />
                      </>
                    ) : (
                      <Image
                        src={entry.item.url}
                        alt={entry.item.alt ?? product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    )}

                    {/* The slot this holds on the product page — the number the arrows change. */}
                    <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center bg-white/85 px-1.5 font-heading text-[11px] tracking-widest text-neutral-500 backdrop-blur-sm">
                      {index + 1}
                    </span>

                    {isVideo && (
                      <span className="absolute bottom-2 left-2 bg-neutral-500 px-2 py-0.5 font-heading text-[11px] uppercase tracking-widest text-white">
                        Video
                      </span>
                    )}
                    {/* Reads the real flag rather than assuming the first tile — the storefront
                        picks the card photo by is_featured, so this has to show what it will use. */}
                    {!isVideo && entry.item.is_featured && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-brown px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-beige-light">
                        <Star size={10} strokeWidth={2} /> Main
                      </span>
                    )}
                  </div>
                  <DeleteMediaButton
                    kind={entry.kind}
                    mediaId={entry.item.id}
                    productId={product.id}
                    storagePath={extractStoragePath(entry.item.url, bucket)}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <MoveButton
                      kind={entry.kind}
                      mediaId={entry.item.id}
                      productId={product.id}
                      direction="up"
                      disabled={index === 0}
                    />
                    <MoveButton
                      kind={entry.kind}
                      mediaId={entry.item.id}
                      productId={product.id}
                      direction="down"
                      disabled={index === media.length - 1}
                    />
                  </div>
                  {!isVideo && !entry.item.is_featured && (
                    <SetMainButton imageId={entry.item.id} productId={product.id} />
                  )}
                </div>

                <AltTextField
                  kind={entry.kind}
                  mediaId={entry.item.id}
                  productId={product.id}
                  alt={entry.item.alt}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body font-medium text-lg text-neutral-500">
          No photos or videos yet. Upload below.
        </p>
      )}

      {media.length > 0 && (
        <p className="font-body text-sm text-neutral-400">
          Photos and videos share one order — the numbers are the slots on the product page, and the
          arrows move an item past whatever is beside it, so a video can be first. “Main” is the
          photo shown on product cards around the site; it does not have to be the first slot, and
          only a photo can be it. The description under each tile is read aloud by screen readers —
          and, for photos, used by image search; leave it empty to fall back to the product name.
        </p>
      )}

      {/* Upload form — no <form action>, because the bytes go straight to Storage from here. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Upload New Photos or Videos</label>
          <div
            role="button"
            tabIndex={0}
            className={`flex flex-col items-center justify-center gap-2 border border-dashed py-8 transition-colors ${
              busy
                ? "cursor-wait border-neutral-200 bg-neutral-50 opacity-60"
                : dragging
                  ? "cursor-pointer border-brown bg-pink-100/30"
                  : "cursor-pointer border-neutral-200 bg-neutral-50 hover:border-brown/40 hover:bg-pink-100/20"
            }`}
            onClick={() => !busy && fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!busy) fileInputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!busy) addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <Upload size={20} strokeWidth={1.2} className="text-neutral-500" />
            <p className="font-body font-medium text-lg text-neutral-500">
              {items.length > 0 ? "Add more" : "Click to select photos or videos"}, or drop them here
            </p>
            <p className="font-body text-sm text-neutral-400">
              {MEDIA_RULES["product-images"].label} · {MEDIA_RULES["product-videos"].label}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                // Read before clearing: the state updater runs later, by which point the input has
                // no files left to read.
                const picked = Array.from(event.target.files ?? []);
                event.target.value = "";
                addFiles(picked);
              }}
            />
          </div>
          <p className="font-body text-sm text-neutral-400">
            New uploads land at the top of the gallery, in the order picked, so they are easy to
            arrange from there. Large videos upload straight to storage and can take a while on a
            slow connection — keep this tab open until it finishes.
          </p>
        </div>

        {/* What was picked, before anything is sent — filename, size and thumbnail, plus each
            file's own state once Upload is pressed. */}
        <SelectedMediaList items={items} onRemove={removeFile} busy={busy} />
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={busy || items.length === 0}
            title={items.length === 0 ? "Select files first" : undefined}
            className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
          >
            {busy
              ? progress
                ? `Uploading ${progress.done}/${progress.total}…`
                : "Uploading…"
              : items.length > 0
                ? `Upload ${items.length} File${items.length === 1 ? "" : "s"}`
                : "Upload"}
          </button>
          {state && (
            <p
              className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}
            >
              {state.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
