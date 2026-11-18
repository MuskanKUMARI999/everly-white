"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadSingleFile } from "@/lib/admin/uploadClient";
import { formatBytes } from "@/lib/admin/mediaTypes";
import {
  Check,
  Loader2,
  Upload,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Type,
  Heading,
  ImageIcon,
  List as ListIcon,
  Plus,
} from "lucide-react";

// ─── Block model ──────────────────────────────────────────────────────────────
// Serializes to the JSON array the storefront renderer already understands:
// src/app/blog/[slug]/page.tsx  →  { type, text?, src?, alt?, caption?, items? }

type Block =
  | { uid: number; type: "paragraph"; text: string }
  | { uid: number; type: "heading"; text: string }
  | { uid: number; type: "image"; src: string; alt: string; caption: string }
  | { uid: number; type: "list"; items: string[] };

let counter = 0;
const nextUid = () => ++counter;

interface StoredBlock {
  type?: string;
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  items?: string[];
}

/** Parse whatever is stored in `content` into editor blocks (backward compatible). */
function parseInitial(raw: string | null | undefined): Block[] {
  const value = (raw ?? "").trim();
  if (!value) return [{ uid: nextUid(), type: "paragraph", text: "" }];

  try {
    const parsed = JSON.parse(value) as StoredBlock[];
    if (Array.isArray(parsed)) {
      const blocks = parsed.map((b): Block => {
        switch (b.type) {
          case "heading":
            return { uid: nextUid(), type: "heading", text: b.text ?? "" };
          case "image":
            return {
              uid: nextUid(),
              type: "image",
              src: b.src ?? "",
              alt: b.alt ?? "",
              caption: b.caption ?? "",
            };
          case "list":
            return { uid: nextUid(), type: "list", items: b.items?.length ? b.items : [""] };
          default:
            return { uid: nextUid(), type: "paragraph", text: b.text ?? "" };
        }
      });
      return blocks.length ? blocks : [{ uid: nextUid(), type: "paragraph", text: "" }];
    }
  } catch {
    // Not JSON — treat legacy plain text as a single paragraph so nothing is lost.
  }
  return [{ uid: nextUid(), type: "paragraph", text: value }];
}

/** Serialize editor blocks back to the stored JSON shape, dropping empties. */
function serialize(blocks: Block[]): string {
  const cleaned = blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return b.text.trim() ? { type: "heading", text: b.text.trim() } : null;
        case "image":
          return b.src.trim()
            ? {
                type: "image",
                src: b.src.trim(),
                ...(b.alt.trim() ? { alt: b.alt.trim() } : {}),
                ...(b.caption.trim() ? { caption: b.caption.trim() } : {}),
              }
            : null;
        case "list": {
          const items = b.items.map((i) => i.trim()).filter(Boolean);
          return items.length ? { type: "list", items } : null;
        }
        default:
          return b.text.trim() ? { type: "paragraph", text: b.text.trim() } : null;
      }
    })
    .filter(Boolean);
  return JSON.stringify(cleaned);
}

// ─── Styling ──────────────────────────────────────────────────────────────────

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const iconBtn =
  "flex h-8 w-8 cursor-pointer items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:cursor-not-allowed disabled:opacity-30";

const BLOCK_LABELS: Record<Block["type"], string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  image: "Image",
  list: "Bullet List",
};

// ─── Image block uploader ─────────────────────────────────────────────────────

function ImageBlockField({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "image" }>;
  onChange: (patch: Partial<Extract<Block, { type: "image" }>>) => void;
}) {
  const [uploading, setUploading] = useState(false);
  // Same reason as the site-image field: without the filename on screen, choosing a file and
  // choosing nothing look identical until the upload happens to finish.
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    setPicked({ name: file.name, size: file.size });

    const result = await uploadSingleFile("site-images", "blog", file);
    if ("error" in result) {
      setError(result.error);
      setPicked(null);
    } else {
      onChange({ src: result.url });
    }

    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* min-w-0 on the field: an <input> defaults to min-width:auto, so flex-1 alone can't shrink
          it below ~20 characters and the Upload button gets pushed off a phone screen. */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="url"
          value={block.src}
          onChange={(e) => onChange({ src: e.target.value })}
          placeholder="https://… or upload a file"
          className={`${inputClasses} min-w-0 flex-1`}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="cursor-pointer disabled:cursor-not-allowed flex shrink-0 items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown disabled:opacity-50"
        >
          <Upload size={14} strokeWidth={1.6} />
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
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
      {error && <p className="font-body text-sm text-terracotta">{error}</p>}
      {block.src && (
        <div className="relative h-40 w-full max-w-md overflow-hidden border border-neutral-100 bg-pink-100/30">
          <Image src={block.src} alt="" fill className="object-cover" sizes="448px" />
          <button
            type="button"
            onClick={() => {
              onChange({ src: "" });
              setPicked(null);
            }}
            className="cursor-pointer absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-white/80 text-terracotta backdrop-blur-sm transition-colors hover:bg-white"
            title="Clear image"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      )}
      <input
        type="text"
        value={block.alt}
        onChange={(e) => onChange({ alt: e.target.value })}
        placeholder="Alt text (for accessibility & SEO)"
        className={inputClasses}
      />
      <input
        type="text"
        value={block.caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (optional, shown under the image)"
        className={inputClasses}
      />
    </div>
  );
}

// ─── List block editor ────────────────────────────────────────────────────────

function ListBlockField({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "list" }>;
  onChange: (items: string[]) => void;
}) {
  const setItem = (i: number, val: string) =>
    onChange(block.items.map((it, j) => (j === i ? val : it)));
  const addItem = () => onChange([...block.items, ""]);
  const removeItem = (i: number) =>
    onChange(block.items.length > 1 ? block.items.filter((_, j) => j !== i) : block.items);

  return (
    <div className="flex flex-col gap-2">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-brown">&bull;</span>
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(i, e.target.value)}
            placeholder={`List item ${i + 1}`}
            className={`${inputClasses} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            disabled={block.items.length === 1}
            className={iconBtn}
            title="Remove item"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="cursor-pointer mt-1 flex w-fit items-center gap-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:text-brown"
      >
        <Plus size={14} strokeWidth={1.8} />
        Add item
      </button>
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

const ADD_BUTTONS: { type: Block["type"]; label: string; Icon: typeof Type }[] = [
  { type: "paragraph", label: "Paragraph", Icon: Type },
  { type: "heading", label: "Heading", Icon: Heading },
  { type: "image", label: "Image", Icon: ImageIcon },
  { type: "list", label: "List", Icon: ListIcon },
];

export function BlogContentEditor({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseInitial(defaultValue));

  function newBlock(type: Block["type"]): Block {
    switch (type) {
      case "heading":
        return { uid: nextUid(), type: "heading", text: "" };
      case "image":
        return { uid: nextUid(), type: "image", src: "", alt: "", caption: "" };
      case "list":
        return { uid: nextUid(), type: "list", items: [""] };
      default:
        return { uid: nextUid(), type: "paragraph", text: "" };
    }
  }

  const addBlock = (type: Block["type"]) => setBlocks((b) => [...b, newBlock(type)]);
  const removeBlock = (uid: number) => setBlocks((b) => b.filter((x) => x.uid !== uid));
  const patchBlock = (uid: number, patch: Partial<Block>) =>
    setBlocks((b) => b.map((x) => (x.uid === uid ? ({ ...x, ...patch } as Block) : x)));

  function move(uid: number, dir: -1 | 1) {
    setBlocks((b) => {
      const i = b.findIndex((x) => x.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= b.length) return b;
      const copy = [...b];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden field carries the serialized JSON to the server action. */}
      <input type="hidden" name={name} value={serialize(blocks)} />

      <p className="font-body font-medium text-lg text-neutral-500">
        Build your article block by block — add a paragraph, drop in an image, add another paragraph,
        and reorder as you like. It appears on the site exactly in this order.
      </p>

      {blocks.map((block, i) => (
        <div key={block.uid} className="flex flex-col gap-3 border border-neutral-200 bg-neutral-50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="font-heading text-[12px] uppercase tracking-widest text-neutral-400">
              {BLOCK_LABELS[block.type]}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => move(block.uid, -1)}
                disabled={i === 0}
                className={iconBtn}
                title="Move up"
              >
                <ArrowUp size={14} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => move(block.uid, 1)}
                disabled={i === blocks.length - 1}
                className={iconBtn}
                title="Move down"
              >
                <ArrowDown size={14} strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={() => removeBlock(block.uid)}
                className={`cursor-pointer ${iconBtn} hover:border-terracotta hover:text-terracotta`}
                title="Delete block"
              >
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          {block.type === "paragraph" && (
            <textarea
              value={block.text}
              onChange={(e) => patchBlock(block.uid, { text: e.target.value })}
              rows={4}
              placeholder="Write a paragraph…"
              className={inputClasses}
            />
          )}

          {block.type === "heading" && (
            <input
              type="text"
              value={block.text}
              onChange={(e) => patchBlock(block.uid, { text: e.target.value })}
              placeholder="Section heading"
              className={`${inputClasses} font-semibold`}
            />
          )}

          {block.type === "image" && (
            <ImageBlockField
              block={block}
              onChange={(patch) => patchBlock(block.uid, patch)}
            />
          )}

          {block.type === "list" && (
            <ListBlockField
              block={block}
              onChange={(items) => patchBlock(block.uid, { items })}
            />
          )}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-dashed border-neutral-200 pt-4">
        <span className="font-heading text-[12px] uppercase tracking-widest text-neutral-400">
          Add block:
        </span>
        {ADD_BUTTONS.map(({ type, label, Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => addBlock(type)}
            className="cursor-pointer flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 font-heading text-sm uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
          >
            <Icon size={14} strokeWidth={1.6} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
