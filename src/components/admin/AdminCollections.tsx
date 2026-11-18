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
const groupClasses = "flex flex-col gap-4 border-t border-neutral-100 pt-5";
const groupTitleClasses =
  "font-heading text-[13px] uppercase tracking-widest text-brown";
const twoUpClasses = "grid grid-cols-1 gap-4 sm:grid-cols-2";

// Everything this collection shows beyond its own columns lives in `collections.metadata`. These
// used to be editable only as raw JSON in the Supabase dashboard.
type CollectionMetadata = {
  eyebrow?: string;
  heroImageAlt?: string;
  storyEyebrow?: string;
  shopEyebrow?: string;
  navImage?: string;
  navImageAlt?: string;
  navTagline?: string;
  tileImage?: string;
  intro?: { heading?: string; paragraphs?: string[] };
  stats?: { value?: string; label?: string }[];
};

function readMetadata(collection?: AdminCollection): CollectionMetadata {
  const raw = collection?.metadata;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as CollectionMetadata;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={labelClasses}>{label}</label>
      {children}
      {hint && <p className={hintClasses}>{hint}</p>}
    </div>
  );
}

/**
 * The whole collection page, top to bottom, in the order a visitor reads it: the banner and the
 * text on it, then The Story, then the product grid.
 *
 * This form deliberately holds nothing that renders anywhere else — including the founder's story,
 * which is not on this page at all and is edited on Admin → About Us.
 *
 * The header mega-menu and
 * homepage tile images are per-collection too, but they belong to other pages, so they sit behind
 * a closed disclosure at the end rather than in the middle of the page's own copy — mixing them in
 * was what made this screen hard to read.
 *
 * Shared by the create and edit forms so the two cannot drift apart. Every metadata-backed field is
 * optional: emptying one removes the key and the page falls back to the wording it shipped with.
 */
function CollectionPageFields({
  collection,
  categories,
}: {
  collection?: AdminCollection;
  categories: AdminCategory[];
}) {
  const metadata = readMetadata(collection);
  // Mirrors the storefront's own fallback. A collection written before the intro moved into
  // metadata still shows its paragraphs here — without this the box would look empty and saving
  // would wipe the copy the page was actually displaying.
  const introParagraphs = metadata.intro?.paragraphs?.length
    ? metadata.intro.paragraphs.join("\n\n")
    : (collection?.description ?? "");
  const stats = (metadata.stats ?? [])
    .map((stat) => `${stat.value ?? ""} | ${stat.label ?? ""}`)
    .join("\n");

  return (
    <div className="flex flex-col gap-6">
      <div className={groupClasses}>
        <p className={groupTitleClasses}>1 &middot; Hero Banner</p>

        <ImageUrlField
          name="heroImage"
          label="Banner Image"
          folder="collections"
          defaultValue={collection?.hero_image ?? null}
        />
        <p className={hintClasses}>
          The full-width photo at the top of the page. An active &ldquo;Collection Page Hero&rdquo;
          banner in <strong>Banners</strong> overrides this for every collection, so clear that one
          if this image is not showing.
        </p>

        <Field
          label="Banner Alt Text"
          hint="Describes the photo for screen readers. With none saved, the title is used."
        >
          <input
            name="heroImageAlt"
            type="text"
            defaultValue={metadata.heroImageAlt ?? ""}
            className={inputClasses}
          />
        </Field>

        <Field
          label="Eyebrow"
          hint="Small caps line above the title, on the glass card. With none saved, the subtitle is reused."
        >
          <input
            name="eyebrow"
            type="text"
            defaultValue={metadata.eyebrow ?? ""}
            placeholder="e.g. The Debut Collection"
            className={inputClasses}
          />
        </Field>

        <Field
          label="Title"
          hint="The large heading on the banner. Also used in the breadcrumb and above the product grid."
        >
          <input
            name="title"
            type="text"
            // Only a new collection has to be titled here: on an edit an empty box keeps the
            // title it already has rather than refusing the save.
            required={!collection}
            defaultValue={collection?.title ?? ""}
            placeholder="e.g. The Bloom Edit"
            className={inputClasses}
          />
        </Field>

        <Field label="Subtitle" hint="The italic line under the title. Hidden on small phones.">
          <input
            name="subtitle"
            type="text"
            defaultValue={collection?.subtitle ?? ""}
            className={inputClasses}
          />
        </Field>
      </div>

      <div className={groupClasses}>
        <p className={groupTitleClasses}>2 &middot; The Story</p>

        <Field label="Section Eyebrow" hint="Small caps line above the heading.">
          <input
            name="storyEyebrow"
            type="text"
            defaultValue={metadata.storyEyebrow ?? ""}
            placeholder="The Story"
            className={inputClasses}
          />
        </Field>

        <Field label="Heading" hint="With none saved, the collection title is used.">
          <input
            name="introHeading"
            type="text"
            defaultValue={metadata.intro?.heading ?? ""}
            className={inputClasses}
          />
        </Field>

        <Field label="Paragraphs" hint="Leave a blank line between paragraphs.">
          <textarea
            name="introParagraphs"
            rows={6}
            defaultValue={introParagraphs}
            className={inputClasses}
          />
        </Field>

        <Field
          label="Stats Strip"
          hint={
            <>
              The bordered figures under the story. One per line, written as{" "}
              <code>value | label</code>. With none saved, the strip is hidden.
            </>
          }
        >
          <textarea
            name="stats"
            rows={4}
            defaultValue={stats}
            placeholder={"100+ | Hours of Hand Craft, Per Piece\n500+ | Hand-Set Mirrors"}
            className={inputClasses}
          />
        </Field>
      </div>

      <div className={groupClasses}>
        <p className={groupTitleClasses}>3 &middot; Shop the Collection</p>

        <Field label="Section Eyebrow" hint="Small caps line above the product grid.">
          <input
            name="shopEyebrow"
            type="text"
            defaultValue={metadata.shopEyebrow ?? ""}
            placeholder="Shop the Collection"
            className={inputClasses}
          />
        </Field>

        <p className={hintClasses}>
          The heading under it is the collection title above. Which pieces appear is set per product
          in <strong>Products</strong>, by assigning the product to this collection.
        </p>
      </div>

      <div className={groupClasses}>
        <p className={groupTitleClasses}>Settings</p>
        <p className={hintClasses}>Not shown on the page.</p>

        <div className={twoUpClasses}>
          <Field label="Slug" hint="The page address: /collection/your-slug">
            <input
              name="slug"
              type="text"
              defaultValue={collection?.slug ?? ""}
              placeholder={collection ? undefined : "auto-generated if empty"}
              className={inputClasses}
            />
          </Field>
          <Field
            label="Catalogue Category"
            hint="Which filter the products page opens on when someone arrives from this collection."
          >
            <select
              name="categoryId"
              defaultValue={collection?.category_id ?? ""}
              className={inputClasses}
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Closed by default: these two images belong to other pages, and having them inline was
          what made this form read as if the collection page contained them. */}
      <details className="border border-neutral-100 bg-pink-100/20">
        <summary className="cursor-pointer p-4 font-heading text-[13px] uppercase tracking-widest text-neutral-400">
          Not on this page &mdash; header menu &amp; homepage tile
        </summary>

        <div className="flex flex-col gap-4 border-t border-neutral-100 p-4">
          <p className={hintClasses}>
            The banner photo is a wide crop and looks wrong in both of these narrower slots, so each
            gets its own image. Leave either empty to fall back to the banner photo.
          </p>

          <ImageUrlField
            name="navImage"
            label="Header Menu Image"
            folder="collections"
            defaultValue={metadata.navImage ?? null}
          />
          <p className={hintClasses}>
            The tall photo in the site header&apos;s navigation panel.
          </p>

          <Field label="Header Menu Image Alt Text">
            <input
              name="navImageAlt"
              type="text"
              defaultValue={metadata.navImageAlt ?? ""}
              className={inputClasses}
            />
          </Field>

          <Field
            label="Header Menu Tagline"
            hint={`One short line in the navigation panel. With none saved, "Discover {title} Collection" is shown.`}
          >
            <input
              name="navTagline"
              type="text"
              defaultValue={metadata.navTagline ?? ""}
              className={inputClasses}
            />
          </Field>

          <ImageUrlField
            name="tileImage"
            label="Homepage Tile Image"
            folder="collections"
            defaultValue={metadata.tileImage ?? null}
          />
          <p className={hintClasses}>
            The squarer tile in the homepage &ldquo;Shop By Category&rdquo; grid.
          </p>
        </div>
      </details>
    </div>
  );
}

function PublishRow({
  defaultChecked,
  pending,
  label,
  state,
}: {
  defaultChecked: boolean;
  pending: boolean;
  label: string;
  state: { success: boolean; message: string } | null;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-neutral-100 pt-5">
      <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={defaultChecked}
          className="h-4 w-4 accent-brown"
        />
        Published
      </label>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
      >
        {pending ? "Saving…" : label}
      </button>
      {state && (
        <p
          className={`font-body font-medium text-lg ${state.success ? "text-green-600" : "text-terracotta"}`}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}

function CreateCollectionForm({ categories }: { categories: AdminCategory[] }) {
  const [state, action, isPending] = useActionState(createCollection, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Add Collection
      </h3>
      <div className="mt-4">
        <CollectionPageFields categories={categories} />
      </div>
      <PublishRow
        defaultChecked
        pending={isPending}
        label={isPending ? "Creating…" : "Create Collection"}
        state={state}
      />
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
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        {collection.title}
        {!collection.is_published && (
          <span className="ml-3 border border-neutral-200 px-2 py-0.5 font-heading text-xs uppercase tracking-widest text-neutral-400">
            Unpublished
          </span>
        )}
      </h3>

      <form action={updateAction} className="mt-4">
        <input type="hidden" name="collectionId" value={collection.id} />
        <p className="mb-4 border border-neutral-100 bg-pink-100/20 px-4 py-3 font-body text-base text-neutral-500">
          Change what you need and save &mdash; anything you leave empty keeps what is already
          saved for this collection.
        </p>
        <CollectionPageFields collection={collection} categories={categories} />
        <PublishRow
          defaultChecked={collection.is_published}
          pending={updatePending}
          label="Save"
          state={updateState}
        />
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
      <div className="border border-neutral-100 bg-pink-100/30 p-6">
        <p className="font-body text-base text-neutral-500">
          Each form below is one collection page, laid out in the order the page reads: the banner
          and the text on it, then The Story, then the product grid. The founder&apos;s story is not
          on this page &mdash; it is edited under <strong>About Us</strong>.
        </p>
      </div>
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
