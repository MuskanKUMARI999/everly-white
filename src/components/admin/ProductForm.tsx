"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/admin/actions";
import { uploadFiles, newBatchFolder } from "@/lib/admin/uploadClient";
import { MEDIA_RULES, type MediaBucket, type UploadedMedia } from "@/lib/admin/mediaTypes";
import type { AdminProduct } from "@/lib/data/admin";
import type { Tables } from "@/lib/supabase/database.types";

interface ProductFormProps {
  product?: AdminProduct;
  categories: Tables<"categories">[];
  collections: Tables<"collections">[];
}

const inputClasses =
  "border border-neutral-200 bg-white px-3 py-2 font-body font-medium text-lg text-neutral-500 outline-none transition-colors focus:border-neutral-500";

const labelClasses = "font-heading text-[13px] uppercase tracking-widest text-neutral-500";

// Media picked while creating a product has nowhere to be filed yet — the product row does not
// exist, so there is no id to use as a storage folder. Rather than hold the bytes in memory and
// post them with the form (which is exactly what the 1MB Server Action cap forbids), the files go
// to Storage immediately under a batch id, and only their object paths ride along with the submit.
function NewProductMediaPicker({
  bucket,
  fieldName,
  title,
  accept,
  noun,
}: {
  bucket: MediaBucket;
  fieldName: string;
  title: string;
  accept: string;
  noun: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const batchFolder = useMemo(() => newBatchFolder(), []);
  const [uploaded, setUploaded] = useState<UploadedMedia[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    setErrors([]);
    setProgress({ done: 0, total: files.length });

    const result = await uploadFiles(bucket, batchFolder, files, (done, total) =>
      setProgress({ done, total }),
    );

    setProgress(null);
    setUploaded((current) => [...current, ...result.uploaded]);
    setErrors(result.errors);
  }

  const busy = progress !== null;

  return (
    <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
      <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
        {title}
      </h3>
      <p className="font-body text-sm text-neutral-500">
        Optional — you can add {noun} now or upload them later from the product&apos;s edit page.
      </p>

      {/* What actually reaches createProduct: paths, not bytes. */}
      <input type="hidden" name={fieldName} value={JSON.stringify(uploaded)} />

      <div
        className={`flex flex-col items-center justify-center gap-2 border border-dashed border-neutral-200 bg-neutral-50 py-8 transition-colors ${
          busy ? "cursor-wait opacity-60" : "cursor-pointer hover:border-brown/40 hover:bg-pink-100/20"
        }`}
        onClick={() => !busy && inputRef.current?.click()}
      >
        <Upload size={20} strokeWidth={1.2} className="text-neutral-300" />
        <p className="font-body text-base text-neutral-500">
          {busy
            ? `Uploading ${progress.done}/${progress.total}…`
            : uploaded.length > 0
              ? `${uploaded.length} ${noun} ready — click to add more`
              : `Click to select ${noun}`}{" "}
          <span className="text-neutral-300">({MEDIA_RULES[bucket].label})</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>

      {uploaded.length > 0 && (
        <p className="font-body text-sm text-green-600">
          {uploaded.length} {noun} uploaded. They are attached when you create the product.
        </p>
      )}
      {errors.map((error) => (
        <p key={error} className="font-body text-sm text-terracotta">
          {error}
        </p>
      ))}
    </div>
  );
}

export function ProductForm({ product, categories, collections }: ProductFormProps) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState(action, null);

  // The header mega-menu's one-liner has no column of its own — it lives in metadata alongside
  // anything else stored there, so it has to be picked out by hand rather than read off the row.
  const productMetadata = (product?.metadata as Record<string, unknown> | undefined) ?? {};
  const navDescription =
    typeof productMetadata.navDescription === "string" ? productMetadata.navDescription : "";

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {product && <input type="hidden" name="productId" value={product.id} />}

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Product Name</label>
            <input
              name="name"
              type="text"
              defaultValue={product?.name}
              required
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Slug</label>
            <input
              name="slug"
              type="text"
              defaultValue={product?.slug}
              placeholder="auto-generated from name if empty"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Tagline</label>
            <input
              name="tagline"
              type="text"
              defaultValue={product?.tagline ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Menu Blurb</label>
            <input
              name="navDescription"
              type="text"
              defaultValue={navDescription}
              className={inputClasses}
            />
            <p className="font-body text-sm text-neutral-400">
              One short line, shown only in the header&apos;s Collection dropdown. Leave empty to use
              the tagline there.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={product?.description ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Story</label>
            <textarea
              name="story"
              rows={4}
              defaultValue={product?.story ?? ""}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {!product && (
        <NewProductMediaPicker
          bucket="product-images"
          fieldName="imageUploads"
          title="Product Images"
          accept="image/jpeg,image/png,image/webp"
          noun="images"
        />
      )}

      {!product && (
        <NewProductMediaPicker
          bucket="product-videos"
          fieldName="videoUploads"
          title="Product Videos"
          accept="video/mp4,video/webm,video/quicktime"
          noun="videos"
        />
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Pricing & Stock
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Price (₹)</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.price}
                required
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Compare-at Price (₹)</label>
              <input
                name="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.compare_at_price ?? ""}
                className={inputClasses}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Stock Quantity</label>
              <input
                name="stockQuantity"
                type="number"
                min="0"
                defaultValue={product?.stock_quantity ?? 0}
                className={inputClasses}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Categorization
          </h3>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Category</label>
              <select
                name="categoryId"
                defaultValue={product?.category_id ?? ""}
                className={inputClasses}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Collection</label>
              <select
                name="collectionId"
                defaultValue={product?.collection_id ?? ""}
                className={inputClasses}
              >
                <option value="">None</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClasses}>Display Order</label>
              <input
                name="sortOrder"
                type="number"
                step="1"
                defaultValue={product?.sort_order ?? ""}
                placeholder={product ? "" : "added to the end of the shop"}
                className={inputClasses}
              />
              <p className="font-body text-sm text-neutral-400">
                Lowest number shows first, on the Products page, the collection page and the
                header&apos;s Collection dropdown. Leave empty to keep the current position.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
            Tax (GST)
          </h3>
          <p className="font-body text-sm text-neutral-500">
            Printed on the customer&apos;s tax invoice. The price above is treated as{" "}
            <strong className="font-medium">including GST</strong>, so filling these in does not
            change what anyone pays &mdash; it only decides how the tax is shown and reported. Leave
            either box empty to use the shop&apos;s default.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>HSN Code</label>
            <input
              name="hsnCode"
              type="text"
              defaultValue={product?.hsn_code ?? ""}
              placeholder="e.g. 4420"
              className={inputClasses}
            />
            <p className="font-body text-sm text-neutral-400">
              The government&apos;s classification code for this item. Ask your accountant &mdash;
              it must match what you file.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>GST Rate (%)</label>
            <input
              name="gstRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={product?.gst_rate ?? ""}
              placeholder="uses the shop default"
              className={inputClasses}
            />
            <p className="font-body text-sm text-neutral-400">
              Just the number, e.g. 18 for 18%. Enter 0 only if this item is genuinely tax-exempt.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          Product Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Material</label>
            <input
              name="material"
              type="text"
              defaultValue={product?.material ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Dimensions</label>
            <input
              name="dimensions"
              type="text"
              defaultValue={product?.dimensions ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Weight</label>
            <input
              name="weight"
              type="text"
              defaultValue={product?.weight ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClasses}>Making Time</label>
            <input
              name="makingTime"
              type="text"
              defaultValue={product?.making_time ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Composition &amp; Care</label>
            <textarea
              name="composition"
              rows={4}
              defaultValue={product?.composition ?? ""}
              className={inputClasses}
            />
            <p className="font-body text-xs text-neutral-300">
              Shown on the product page accordion. Leave empty to use the standard collection text.
            </p>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Care Instructions</label>
            <textarea
              name="careInstructions"
              rows={3}
              defaultValue={product?.care_instructions ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Shipping Info</label>
            <textarea
              name="shippingInfo"
              rows={3}
              defaultValue={product?.shipping_info ?? ""}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          SEO
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Meta Title</label>
            <input
              name="metaTitle"
              type="text"
              defaultValue={product?.meta_title ?? ""}
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className={labelClasses}>Meta Description</label>
            <textarea
              name="metaDescription"
              rows={3}
              defaultValue={product?.meta_description ?? ""}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border border-neutral-100 bg-white p-6">
        <h3 className="font-heading text-lg font-light uppercase tracking-widest text-neutral-500">
          Visibility
        </h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input
              type="checkbox"
              name="isAvailable"
              defaultChecked={product ? product.is_available : true}
              className="h-4 w-4 border-neutral-200 accent-brown"
            />
            Available
          </label>
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input
              type="checkbox"
              name="isBestseller"
              defaultChecked={product?.is_bestseller ?? false}
              className="h-4 w-4 border-neutral-200 accent-brown"
            />
            Bestseller
          </label>
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input
              type="checkbox"
              name="isNewArrival"
              defaultChecked={product?.is_new_arrival ?? false}
              className="h-4 w-4 border-neutral-200 accent-brown"
            />
            New Arrival
          </label>
          {/* Drives the pink "Flagship" badge on the storefront product card. Lives in metadata
              rather than its own column so no migration is needed; see navDescription. */}
          <label className="flex items-center gap-2 font-body font-medium text-lg text-neutral-500">
            <input
              type="checkbox"
              name="isFlagship"
              defaultChecked={
                ((product?.metadata as Record<string, unknown> | null)?.isFlagship ?? false) === true
              }
              className="h-4 w-4 border-neutral-200 accent-brown"
            />
            Flagship
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer disabled:cursor-not-allowed bg-brown px-6 py-3 font-heading text-[13px] uppercase tracking-widest text-beige-light transition-colors hover:bg-neutral-500 disabled:bg-neutral-300"
        >
          {isPending ? "Saving…" : product ? "Update Product" : "Create Product"}
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
