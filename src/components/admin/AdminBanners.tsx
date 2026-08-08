"use client";

import { useActionState } from "react";
import { createBanner, updateBanner, deleteBanner } from "@/lib/admin/actions";
import type { AdminBanner } from "@/lib/data/admin";
import { ImageUrlField } from "@/components/admin/ImageUrlField";

interface AdminBannersProps {
  banners: AdminBanner[];
}

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";
const labelClasses = "font-heading text-sm uppercase tracking-widest text-neutral-500";

const PLACEMENTS = [
  { key: "homepage_hero", label: "Homepage Hero Slider" },
  { key: "products_hero", label: "Products Page Hero" },
  { key: "blog_hero", label: "Blog Page Hero" },
  { key: "contact_hero", label: "Contact Page Hero" },
  { key: "faq_hero", label: "FAQ Page Hero" },
  { key: "gifts_hero", label: "Gifts Page Hero" },
  { key: "reviews_hero", label: "Reviews Page Hero" },
  { key: "about_hero", label: "About Us Page Hero" },
  { key: "collection_hero", label: "Collection Page Hero" },
];

function CreateBannerForm() {
  const [state, action, isPending] = useActionState(createBanner, null);

  return (
    <form action={action} className="border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        Add Banner
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Placement</label>
          <select name="placement" defaultValue="homepage_hero" className={inputClasses}>
            {PLACEMENTS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Position (lower shows first)</label>
          <input name="position" type="number" min="0" defaultValue={0} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Link URL (optional)</label>
          <input name="linkUrl" type="text" placeholder="/products" className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Alt Text (optional)</label>
          <input name="alt" type="text" className={inputClasses} />
        </div>
        <div className="sm:col-span-2">
          <ImageUrlField name="imageUrl" label="Banner Image" folder="banners" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
          <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-brown" />
          Active
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Creating…" : "Create Banner"}
        </button>
        {state && (
          <p className={`font-body text-base ${state.success ? "text-green-600" : "text-terracotta"}`}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

function BannerRow({ banner }: { banner: AdminBanner }) {
  const [updateState, updateAction, updatePending] = useActionState(updateBanner, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteBanner, null);

  return (
    <div className={`border bg-white p-6 transition-colors ${banner.is_active ? "border-neutral-100 hover:border-brown/30" : "border-neutral-100 opacity-60"}`}>
      <form action={updateAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="bannerId" value={banner.id} />
        <div className="sm:col-span-2">
          <ImageUrlField
            name="imageUrl"
            label="Banner Image"
            folder="banners"
            defaultValue={banner.image_url}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Placement</label>
          <select name="placement" defaultValue={banner.placement} className={inputClasses}>
            {PLACEMENTS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Position</label>
          <input name="position" type="number" min="0" defaultValue={banner.position} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Link URL</label>
          <input name="linkUrl" type="text" defaultValue={banner.link_url ?? ""} className={inputClasses} />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelClasses}>Alt Text</label>
          <input name="alt" type="text" defaultValue={banner.alt ?? ""} className={inputClasses} />
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input type="checkbox" name="isActive" defaultChecked={banner.is_active} className="h-4 w-4 accent-brown" />
            Active
          </label>
          <button
            type="submit"
            disabled={updatePending}
            className="cursor-pointer disabled:cursor-not-allowed bg-brown px-4 py-2 font-heading text-sm uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
          >
            {updatePending ? "Saving…" : "Save"}
          </button>
          {updateState && (
            <span className={`font-body text-base ${updateState.success ? "text-green-600" : "text-terracotta"}`}>
              {updateState.message}
            </span>
          )}
        </div>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("Delete this banner? This cannot be undone.")) e.preventDefault();
        }}
        className="mt-4 inline-flex items-center gap-3"
      >
        <input type="hidden" name="bannerId" value={banner.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="cursor-pointer disabled:cursor-not-allowed font-body font-medium text-lg text-terracotta underline decoration-terracotta/30 underline-offset-4 transition-colors hover:text-terracotta/80"
        >
          {deletePending ? "Deleting…" : "Delete"}
        </button>
        {deleteState && (
          <span className={`font-body text-sm ${deleteState.success ? "text-green-600" : "text-terracotta"}`}>
            {deleteState.message}
          </span>
        )}
      </form>
    </div>
  );
}

export function AdminBanners({ banners }: AdminBannersProps) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-heading text-2xl font-light text-neutral-500">
        Banners
        <span className="ml-2 font-body text-lg font-normal text-neutral-500">
          ({banners.length})
        </span>
      </h2>

      <CreateBannerForm />

      {banners.length === 0 ? (
        <p className="font-body text-base text-neutral-500">No banners yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {banners.map((banner) => (
            <BannerRow key={banner.id} banner={banner} />
          ))}
        </div>
      )}
    </div>
  );
}
