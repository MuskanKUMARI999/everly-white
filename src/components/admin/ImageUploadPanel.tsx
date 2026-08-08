"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Upload, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  registerProductImages,
  deleteProductImage,
  setFeaturedProductImage,
  moveProductImage,
  updateProductImageAlt,
} from "@/lib/admin/actions";
import { uploadFiles } from "@/lib/admin/uploadClient";
import { MEDIA_RULES } from "@/lib/admin/mediaTypes";
import type { AdminProduct } from "@/lib/data/admin";

interface ImageUploadPanelProps {
  product: AdminProduct;
}

const labelClasses = "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

function DeleteImageButton({
  imageId,
  productId,
  storagePath,
}: {
  imageId: string;
  productId: string;
  storagePath: string;
}) {
  const [, action, isPending] = useActionState(deleteProductImage, null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this image?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="storagePath" value={storagePath} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-white/80 text-terracotta backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
        title="Remove image"
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

function MoveButton({
  imageId,
  productId,
  direction,
  disabled,
}: {
  imageId: string;
  productId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  const [, action, isPending] = useActionState(moveProductImage, null);
  const Icon = direction === "up" ? ChevronLeft : ChevronRight;
  return (
    <form action={action}>
      <input type="hidden" name="imageId" value={imageId} />
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
 * Alt text for one photo. Saved on demand rather than on every keystroke, and the Save control only
 * appears once the text differs from what is stored — so a row of tiles isn't a wall of buttons.
 */
function AltTextField({
  imageId,
  productId,
  alt,
}: {
  imageId: string;
  productId: string;
  alt: string | null;
}) {
  const stored = alt ?? "";
  const [value, setValue] = useState(stored);
  const [state, action, isPending] = useActionState(updateProductImageAlt, null);
  const dirty = value.trim() !== stored.trim();

  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="imageId" value={imageId} />
      <input type="hidden" name="productId" value={productId} />
      <input
        name="alt"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Describe this photo"
        title="Read aloud by screen readers and used by image search"
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

export function ImageUploadPanel({ product }: ImageUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [state, setState] = useState<{ success: boolean; message: string } | null>(null);

  // Sorted here rather than in place: product_images arrives as a prop, and sorting it directly
  // would mutate the array React was handed.
  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);

  async function handleUpload() {
    const files = Array.from(fileInputRef.current?.files ?? []);
    if (!files.length) {
      setState({ success: false, message: "No images selected." });
      return;
    }

    setBusy(true);
    setState(null);
    setProgress({ done: 0, total: files.length });

    // The product row already exists, so its own id is the storage folder.
    const { uploaded, errors } = await uploadFiles(
      "product-images",
      product.id,
      files,
      (done, total) => setProgress({ done, total }),
    );

    let message = "";
    let success = false;

    if (uploaded.length) {
      const result = await registerProductImages(product.id, uploaded);
      success = result.success;
      message = result.message;
    }
    if (errors.length) {
      success = false;
      message = [message, ...errors].filter(Boolean).join(" ");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
    setProgress(null);
    setBusy(false);
    setState({ success, message: message || "Nothing was uploaded." });

    // The new rows are on the server; pull the refreshed product back down.
    if (uploaded.length) startTransition(() => router.refresh());
  }

  // Extract storage path from a Supabase public URL
  function extractStoragePath(url: string): string {
    try {
      const u = new URL(url);
      // path is like /storage/v1/object/public/product-images/<path>
      const parts = u.pathname.split("/product-images/");
      return parts[1] ?? "";
    } catch {
      return "";
    }
  }

  return (
    <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Product Images
      </h3>

      {/* Existing images */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <div key={img.id} className="group flex flex-col gap-2">
              <div className="relative">
                <div className="relative aspect-square overflow-hidden border border-neutral-100 bg-pink-100/30">
                  <Image
                    src={img.url}
                    alt={img.alt ?? product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Reads the real flag rather than assuming the first tile — the storefront picks
                      the card photo by is_featured, so this has to show what it will actually use. */}
                  {img.is_featured && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-brown px-2 py-0.5 font-heading text-[12px] uppercase tracking-widest text-beige-light">
                      <Star size={10} strokeWidth={2} /> Main
                    </span>
                  )}
                </div>
                <DeleteImageButton
                  imageId={img.id}
                  productId={product.id}
                  storagePath={extractStoragePath(img.url)}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <MoveButton
                    imageId={img.id}
                    productId={product.id}
                    direction="up"
                    disabled={index === 0}
                  />
                  <MoveButton
                    imageId={img.id}
                    productId={product.id}
                    direction="down"
                    disabled={index === images.length - 1}
                  />
                </div>
                {!img.is_featured && (
                  <SetMainButton imageId={img.id} productId={product.id} />
                )}
              </div>

              <AltTextField imageId={img.id} productId={product.id} alt={img.alt} />
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body font-medium text-lg text-neutral-500">No images yet. Upload below.</p>
      )}

      {images.length > 0 && (
        <p className="font-body text-sm text-neutral-400">
          Arrows set the order photos appear in on the product page. “Main” is the one shown on
          product cards around the site — it does not have to be the first photo. The description is
          read aloud by screen readers and used by image search; leave it empty to fall back to the
          product name.
        </p>
      )}

      {/* Upload form — no <form action>, because the bytes go straight to Storage from here. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Upload New Images</label>
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 bg-neutral-50 py-8 transition-colors hover:border-brown/40 hover:bg-pink-100/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} strokeWidth={1.2} className="text-neutral-500" />
            <p className="font-body font-medium text-lg text-neutral-500">
              Click to select images{" "}
              <span className="text-neutral-500">({MEDIA_RULES["product-images"].label})</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={() => setState(null)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleUpload}
            disabled={busy}
            className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
          >
            {busy
              ? progress
                ? `Uploading ${progress.done}/${progress.total}…`
                : "Uploading…"
              : "Upload Images"}
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
