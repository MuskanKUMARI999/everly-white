"use client";

import { useActionState } from "react";
import {
  createCollection,
  updateCollection,
  deleteCollection,
} from "@/lib/admin/actions";
import type { AdminCollection, AdminCategory } from "@/lib/data/admin";
import { ImageUrlField } from "@/components/admin/ImageUrlField";

interface AdminCollectionsProps {
  collections: AdminCollection[];
  categories: AdminCategory[];
}

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses =
  "font-heading text-[13px] uppercase tracking-widest text-neutral-500";
const hintClasses = "font-body text-sm text-neutral-400";
const groupClasses = "flex flex-col gap-4 border-t border-neutral-100 pt-5 sm:col-span-2";
const groupTitleClasses =
  "font-heading text-[13px] uppercase tracking-widest text-brown";

// Everything this collection shows beyond its own columns lives in `collections.metadata`. These
// used to be editable only as raw JSON in the Supabase dashboard.
type CollectionMetadata = {
  eyebrow?: string;
  heroImageAlt?: string;
  navImage?: string;
  navImageAlt?: string;
  navTagline?: string;
  tileImage?: string;
  intro?: { heading?: string; paragraphs?: string[] };
  stats?: { value?: string; label?: string }[];
  founderNote?: { heading?: string; quote?: string; attribution?: string };
};

function readMetadata(collection?: AdminCollection): CollectionMetadata {
  const raw = collection?.metadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as CollectionMetadata;
}

/**
 * The metadata-backed fields, shared by the create and edit forms so the two can't drift apart.
 * Every one is optional — leaving it empty removes the key and the storefront falls back to its
 * default (eyebrow → subtitle, nav/tile image → hero image, intro → title + description).
 */
function CollectionContentFields({ collection }: { collection?: AdminCollection }) {
  const metadata = readMetadata(collection);
  const introParagraphs = (metadata.intro?.paragraphs ?? []).join("\n\n");
  const stats = (metadata.stats ?? [])
    .map((stat) => `${stat.value ?? ""} | ${stat.label ?? ""}`)
    .join("\n");

  return (
    <>
      <div className={groupClasses}>
        <p className={groupTitleClasses}>Collection Page</p>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Eyebrow</label>
          <input
            name="eyebrow"
            type="text"
            defaultValue={metadata.eyebrow ?? ""}
            placeholder="e.g. The Debut Collection"
            className={inputClasses}
          />
          <p className={hintClasses}>
            Small caps line above the title. Leave empty to reuse the subtitle.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Hero Image Alt Text</label>
          <input
            name="heroImageAlt"
            type="text"
            defaultValue={metadata.heroImageAlt ?? ""}
            className={inputClasses}
          />
          <p className={hintClasses}>
            Describes the banner photo for screen readers. Leave empty to use the title.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Intro Heading</label>
          <input
            name="introHeading"
            type="text"
            defaultValue={metadata.intro?.heading ?? ""}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Intro Paragraphs</label>
          <textarea
            name="introParagraphs"
            rows={6}
            defaultValue={introParagraphs}
            className={inputClasses}
          />
          <p className={hintClasses}>
            Leave a blank line between paragraphs. Leave empty to use the description above.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Stats Strip</label>
          <textarea
            name="stats"
            rows={4}
            defaultValue={stats}
            placeholder={"100+ | Hours of Hand Craft, Per Piece\n500+ | Hand-Set Mirrors"}
            className={inputClasses}
          />
          <p className={hintClasses}>
            One per line, written as <code>value | label</code>. Leave empty to hide the strip.
          </p>
        </div>
      </div>

      <div className={groupClasses}>
        <p className={groupTitleClasses}>Founder&apos;s Note</p>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Heading</label>
          <input
            name="founderHeading"
            type="text"
            defaultValue={metadata.founderNote?.heading ?? ""}
            placeholder="Founder's Note"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Quote</label>
          <textarea
            name="founderQuote"
            rows={3}
            defaultValue={metadata.founderNote?.quote ?? ""}
            className={inputClasses}
          />
          <p className={hintClasses}>The note only appears when there is a quote.</p>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Attribution</label>
          <input
            name="founderAttribution"
            type="text"
            defaultValue={metadata.founderNote?.attribution ?? ""}
            placeholder="Everly White Studios"
            className={inputClasses}
          />
        </div>
      </div>

      <div className={groupClasses}>
        <p className={groupTitleClasses}>Header Menu &amp; Homepage Tile</p>

        <ImageUrlField
          name="navImage"
          label="Header Menu Image"
          folder="collections"
          defaultValue={metadata.navImage ?? null}
        />
        <p className={hintClasses}>
          Tall photo in the header&apos;s Collection dropdown. The wide hero banner crops badly
          there, so it gets its own image. Leave empty to fall back to the hero image.
        </p>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Header Menu Image Alt Text</label>
          <input
            name="navImageAlt"
            type="text"
            defaultValue={metadata.navImageAlt ?? ""}
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Header Menu Tagline</label>
          <input
            name="navTagline"
            type="text"
            defaultValue={metadata.navTagline ?? ""}
            className={inputClasses}
          />
          <p className={hintClasses}>
            One short line in the dropdown. Leave empty for “Discover {"{title}"} Collection”.
          </p>
        </div>

        <ImageUrlField
          name="tileImage"
          label="Homepage Tile Image"
          folder="collections"
          defaultValue={metadata.tileImage ?? null}
        />
        <p className={hintClasses}>
          Used by the homepage “Shop By Category” tile. Leave empty to fall back to the hero image.
        </p>
      </div>
    </>
  );
}

function CreateCollectionForm({ categories }: { categories: AdminCategory[] }) {
  const [state, action, isPending] = useActionState(createCollection, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Add Collection
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Title</label>
          <input name="title" type="text" required placeholder="e.g. The Bloom Edit" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Slug</label>
          <input name="slug" type="text" placeholder="auto-generated if empty" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Subtitle</label>
          <input name="subtitle" type="text" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Category</label>
          <select name="categoryId" className={inputClasses}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClasses}>Description</label>
          <textarea name="description" rows={2} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <ImageUrlField name="heroImage" label="Hero Image" folder="collections" />
        </div>
        <CollectionContentFields />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4 accent-brown" />
          Published
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Creating…" : "Create Collection"}
        </button>
        {state && (
          <p className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function CollectionRow({
  collection,
  categories,
}: {
  collection: AdminCollection;
  categories: AdminCategory[];
}) {
  const [updateState, updateAction, updatePending] = useActionState(updateCollection, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCollection, null);

  return (
    <div className="border border-neutral-100 bg-white p-6 transition-colors hover:border-brown/30">
      <form action={updateAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="collectionId" value={collection.id} />
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Title</label>
          <input name="title" type="text" required defaultValue={collection.title} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Slug</label>
          <input name="slug" type="text" required defaultValue={collection.slug} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Subtitle</label>
          <input name="subtitle" type="text" defaultValue={collection.subtitle ?? ""} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Category</label>
          <select name="categoryId" defaultValue={collection.category_id ?? ""} className={inputClasses}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className={labelClasses}>Description</label>
          <textarea name="description" rows={2} defaultValue={collection.description ?? ""} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <ImageUrlField
            name="heroImage"
            label="Hero Image"
            folder="collections"
            defaultValue={collection.hero_image}
          />
        </div>
        <CollectionContentFields collection={collection} />
        <div className="flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-5 sm:col-span-2">
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input type="checkbox" name="isPublished" defaultChecked={collection.is_published} className="h-4 w-4 accent-brown" />
            Published
          </label>
          <button
            type="submit"
            disabled={updatePending}
            className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
          >
            {updatePending ? "Saving…" : "Save"}
          </button>
          {updateState && (
            <p className={`font-body font-medium text-lg ${updateState.success ? "text-green-600" : "text-terracotta"}`}>
              {updateState.message}
            </p>
          )}
        </div>
      </form>
      <form
        action={deleteAction}
        className="mt-4 inline-flex items-center gap-3"
        onSubmit={(e) => {
          if (!confirm(`Delete collection "${collection.title}"? This cannot be undone.`)) e.preventDefault();
        }}
      >
        <input type="hidden" name="collectionId" value={collection.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
        >
          {deletePending ? "Deleting…" : "Delete"}
        </button>
        {deleteState && (
          <p className={`font-body font-medium text-lg ${deleteState.success ? "text-green-600" : "text-terracotta"}`}>
            {deleteState.message}
          </p>
        )}
      </form>
    </div>
  );
}

export function AdminCollections({ collections, categories }: AdminCollectionsProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-2xl font-light text-neutral-500">Collections</h2>
      <CreateCollectionForm categories={categories} />
      {collections.length === 0 ? (
        <p className="font-body font-medium text-neutral-500">No collections yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {collections.map((c) => (
            <CollectionRow key={c.id} collection={c} categories={categories} />
          ))}
        </div>
      )}
    </div>
  );
}
