"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Upload, PlayCircle } from "lucide-react";
import { registerProductVideos, deleteProductVideo } from "@/lib/admin/actions";
import { uploadFiles } from "@/lib/admin/uploadClient";
import { MEDIA_RULES } from "@/lib/admin/mediaTypes";
import type { AdminProduct } from "@/lib/data/admin";

interface VideoUploadPanelProps {
  product: AdminProduct;
}

const labelClasses = "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

function DeleteVideoButton({
  videoId,
  productId,
  storagePath,
}: {
  videoId: string;
  productId: string;
  storagePath: string;
}) {
  const [, action, isPending] = useActionState(deleteProductVideo, null);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Remove this video?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="videoId" value={videoId} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="storagePath" value={storagePath} />
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-white/80 text-terracotta backdrop-blur-sm transition-colors hover:bg-white disabled:opacity-50"
        title="Remove video"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </form>
  );
}

export function VideoUploadPanel({ product }: VideoUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [state, setState] = useState<{ success: boolean; message: string } | null>(null);

  const videos = [...(product.product_videos ?? [])].sort((a, b) => a.position - b.position);

  async function handleUpload() {
    const files = Array.from(fileInputRef.current?.files ?? []);
    if (!files.length) {
      setState({ success: false, message: "No videos selected." });
      return;
    }

    setBusy(true);
    setState(null);
    setProgress({ done: 0, total: files.length });

    const { uploaded, errors } = await uploadFiles(
      "product-videos",
      product.id,
      files,
      (done, total) => setProgress({ done, total }),
    );

    let message = "";
    let success = false;

    if (uploaded.length) {
      const result = await registerProductVideos(product.id, uploaded);
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

    if (uploaded.length) startTransition(() => router.refresh());
  }

  // Extract storage path from a Supabase public URL
  function extractStoragePath(url: string): string {
    try {
      const u = new URL(url);
      const parts = u.pathname.split("/product-videos/");
      return parts[1] ?? "";
    } catch {
      return "";
    }
  }

  return (
    <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Product Videos
      </h3>

      {/* Existing videos */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <div key={video.id} className="group relative">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-neutral-100 bg-pink-100/30">
                <video src={video.url} className="h-full w-full object-cover" muted />
                <PlayCircle
                  size={28}
                  strokeWidth={1.4}
                  className="pointer-events-none absolute text-white drop-shadow"
                />
              </div>
              <DeleteVideoButton
                videoId={video.id}
                productId={product.id}
                storagePath={extractStoragePath(video.url)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body font-medium text-lg text-neutral-500">No videos yet. Upload below.</p>
      )}

      {/* Upload form — no <form action>, because the bytes go straight to Storage from here. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Upload New Videos</label>
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 bg-neutral-50 py-8 transition-colors hover:border-brown/40 hover:bg-pink-100/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={20} strokeWidth={1.2} className="text-neutral-500" />
            <p className="font-body font-medium text-lg text-neutral-500">
              Click to select videos{" "}
              <span className="text-neutral-500">({MEDIA_RULES["product-videos"].label})</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={() => setState(null)}
            />
          </div>
          <p className="font-body text-sm text-neutral-400">
            Large files upload straight to storage, so this can take a while on a slow connection —
            keep this tab open until it finishes.
          </p>
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
              : "Upload Videos"}
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
