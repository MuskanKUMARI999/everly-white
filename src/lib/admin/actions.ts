"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/data/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_BLOG_CATEGORY } from "@/components/blog/blogCategories";
import { reverseOrderSideEffects } from "@/lib/orders/reversal";
import {
  buildCollectionMetadata,
  collectionDescriptionFromForm,
} from "@/lib/admin/collectionMetadata";
import {
  keepNumber,
  keepRequiredNumber,
  keepRequiredText,
  keepText,
  selectedOption,
  submittedText,
} from "@/lib/admin/formValues";
import {
  mergeSectionValues,
  normaliseValues,
  SECTIONS_BY_KEY,
  type SectionSchema,
} from "@/lib/content/sections";
import { ensureFeaturedImage, promoteFeaturedImage } from "@/lib/admin/productImages";
import { makeRoomAtTop, reorderProductMedia } from "@/lib/admin/productMedia";
import {
  extractContentImageUrls,
  removeStorageObjectsByUrl,
} from "@/lib/admin/storageCleanup";
import { detectOrderEmail, sendOrderStatusEmail } from "@/lib/email/orderStatus";
import { resolveOrderRecipient } from "@/lib/email/recipient";
import { MEDIA_RULES } from "@/lib/admin/mediaTypes";
import type {
  MediaBucket,
  ProductMediaUpload,
  SignedUpload,
  UploadedMedia,
} from "@/lib/admin/mediaTypes";
import type { FormResult } from "@/lib/cart/types";
import type { Database, Json } from "@/lib/supabase/database.types";

// ─── Media Uploads ────────────────────────────────────────────────────────────
//
// File bytes never pass through a Server Action. Next caps Server Action request bodies at 1MB by
// default, and the hosting platform caps a function's whole request payload on top of that, so the
// old "post the File to the server and let it forward the bytes to Storage" flow could not carry a
// product photo — let alone the 100MB video the product-videos bucket is provisioned for.
//
// Instead the browser asks for a signed upload URL, PUTs the bytes straight to Supabase Storage,
// then calls back with just the resulting object path so the database row can be written. The
// signing step still runs here behind requireAdmin() on the service-role key, so the buckets keep
// the write policy they already had: no INSERT grant for anon or authenticated, uploads only ever
// via a short-lived token this module issued.

const SITE_IMAGE_FOLDERS = new Set<string>(["collections", "blog", "banners", "content"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// `folder` arrives from the client, so it is matched against a fixed shape rather than interpolated
// as given — otherwise it is a path-traversal handle into the bucket.
function isAllowedFolder(bucket: MediaBucket, folder: string) {
  if (bucket === "site-images") return SITE_IMAGE_FOLDERS.has(folder);
  // Product media is filed under a UUID: the product's own id once it exists, or a batch id minted
  // by the new-product form for photos chosen before the product row is written.
  return UUID_RE.test(folder);
}

function safeExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : "bin";
}

// The new-product form carries its already-uploaded media as one JSON hidden field. It is rebuilt
// element by element rather than trusted as-is: this is client-supplied text, and only a path and
// an alt string are ever wanted out of it.
function parseUploadedMedia(raw: FormDataEntryValue | null): UploadedMedia[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const { path, alt } = entry as { path?: unknown; alt?: unknown };
      if (typeof path !== "string" || !path) return [];
      return [{ path, alt: typeof alt === "string" ? alt : undefined }];
    });
  } catch {
    return [];
  }
}

export async function createMediaUploadUrl(input: {
  bucket: MediaBucket;
  folder: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<SignedUpload> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const rules = MEDIA_RULES[input.bucket];
  if (!rules) return { success: false, message: "Unknown upload target." };
  if (!isAllowedFolder(input.bucket, input.folder)) {
    return { success: false, message: "Invalid upload folder." };
  }
  if (!rules.types.includes(input.contentType)) {
    return {
      success: false,
      message: `Unsupported file type${input.contentType ? ` (${input.contentType})` : ""}. Allowed: ${rules.label}.`,
    };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { success: false, message: "That file is empty." };
  }
  if (input.size > rules.maxBytes) {
    return { success: false, message: `That file is too large. Allowed: ${rules.label}.` };
  }

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${input.folder}/${unique}.${safeExtension(input.fileName)}`;

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage.from(input.bucket).createSignedUploadUrl(path);
  if (error || !data) {
    return { success: false, message: error?.message ?? "Could not start the upload." };
  }

  const { data: urlData } = supabase.storage.from(input.bucket).getPublicUrl(data.path);
  return { success: true, path: data.path, token: data.token, publicUrl: urlData.publicUrl };
}

// ─── Product Media ────────────────────────────────────────────────────────────
//
// A product's photos and videos are one gallery in one order — `position` numbers the two tables
// as a single sequence, so a video can lead it. The merge rule lives in lib/data/productMedia.ts
// (the storefront reads it too); the ordering writes are in productMedia.ts and the main-photo
// rules in productImages.ts, both out here where they can be exercised directly. What follows are
// the thin server-action wrappers that add the admin gate and cache invalidation.

function revalidateProductImagery(productId: string) {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  // Product cards render in the header mega-menu and on the homepage, both under the root layout.
  revalidatePath("/", "layout");
}

export async function setFeaturedProductImage(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;
  if (!imageId || !productId) {
    return { success: false, message: "Image ID is missing." };
  }

  const result = await promoteFeaturedImage(createServiceClient(), productId, imageId);
  if (result.success) revalidateProductImagery(productId);
  return result;
}

// Alt text describes the photo or clip for screen readers and image search. It was only ever set
// from the uploaded filename, with no way to correct it — migration 026 had to write the real
// descriptions in SQL. Blank clears it, and the storefront falls back to the product name.
export async function updateProductMediaAlt(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const mediaId = formData.get("mediaId") as string;
  const productId = formData.get("productId") as string;
  const kind = formData.get("kind") === "video" ? "video" : "image";
  if (!mediaId || !productId) {
    return { success: false, message: "Media ID is missing." };
  }

  const alt = toNullableString(formData.get("alt") as string);

  const supabase = createServiceClient();
  // Scoped by product too, so an item can only be edited through its own product's page.
  const { data, error } =
    kind === "video"
      ? await supabase
          .from("product_videos")
          .update({ alt })
          .eq("id", mediaId)
          .eq("product_id", productId)
          .select("id")
      : await supabase
          .from("product_images")
          .update({ alt })
          .eq("id", mediaId)
          .eq("product_id", productId)
          .select("id");

  if (error) return { success: false, message: error.message };
  if (!data?.length) return { success: false, message: "That item could not be found." };

  revalidateProductImagery(productId);
  return { success: true, message: alt ? "Description saved." : "Description cleared." };
}

// One gallery, one order: a video can be moved above a photo and vice versa, so a move is
// addressed by id *and* kind rather than by an image id alone.
export async function moveProductMedia(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const mediaId = formData.get("mediaId") as string;
  const productId = formData.get("productId") as string;
  const kind = formData.get("kind") === "video" ? "video" : "image";
  const direction = formData.get("direction") === "down" ? "down" : "up";
  if (!mediaId || !productId) {
    return { success: false, message: "Media ID is missing." };
  }

  const result = await reorderProductMedia(
    createServiceClient(),
    productId,
    mediaId,
    kind,
    direction,
  );
  if (result.success) revalidateProductImagery(productId);
  return result;
}

/**
 * Writes the database rows for a batch that is already in Storage, numbering them from
 * `startPosition` in the order they were picked. Photos and videos come off the same counter,
 * which is what lets a clip hold slot 1 while a photo holds slot 2.
 */
async function insertProductMedia(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  media: ProductMediaUpload[],
  startPosition: number,
) {
  if (!media.length) return null;

  const imageRows: Database["public"]["Tables"]["product_images"]["Insert"][] = [];
  const videoRows: Database["public"]["Tables"]["product_videos"]["Insert"][] = [];

  media.forEach((item, index) => {
    const position = startPosition + index;
    if (item.kind === "video") {
      const { data } = supabase.storage.from("product-videos").getPublicUrl(item.path);
      videoRows.push({
        product_id: productId,
        url: data.publicUrl,
        alt: item.alt?.trim() || null,
        position,
      });
    } else {
      const { data } = supabase.storage.from("product-images").getPublicUrl(item.path);
      imageRows.push({
        product_id: productId,
        url: data.publicUrl,
        alt: item.alt?.trim() || null,
        position,
        is_featured: false,
      });
    }
  });

  if (imageRows.length) {
    const { error } = await supabase.from("product_images").insert(imageRows);
    if (error) return error.message;
  }
  if (videoRows.length) {
    const { error } = await supabase.from("product_videos").insert(videoRows);
    if (error) return error.message;
  }

  // Only a photo can be the card image, and a product's first upload has to acquire one.
  if (imageRows.length) await ensureFeaturedImage(supabase, productId);
  return null;
}

/**
 * Attach a freshly uploaded batch to a product that already exists — the edit page's uploader.
 *
 * The batch lands at the *top* of the gallery, keeping the order it was picked in. See
 * makeRoomAtTop for why.
 */
export async function registerProductMedia(
  productId: string,
  media: ProductMediaUpload[],
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };
  if (!productId) return { success: false, message: "Product ID is missing." };
  if (!media?.length) return { success: false, message: "Nothing to save." };

  const supabase = createServiceClient();

  const shiftError = await makeRoomAtTop(supabase, productId, media.length);
  if (shiftError) return { success: false, message: shiftError };

  const error = await insertProductMedia(supabase, productId, media, 0);
  if (error) return { success: false, message: error };

  revalidateProductImagery(productId);

  const images = media.filter((item) => item.kind === "image").length;
  const videos = media.length - images;
  const parts = [
    images ? `${images} image${images === 1 ? "" : "s"}` : "",
    videos ? `${videos} video${videos === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  return { success: true, message: `${parts.join(" and ")} added at the top.` };
}

export async function deleteProductImage(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const imageId = formData.get("imageId") as string;
  const storagePath = formData.get("storagePath") as string;
  const productId = formData.get("productId") as string;

  if (!imageId) return { success: false, message: "Image ID is missing." };

  const supabase = createServiceClient();

  if (storagePath) {
    await supabase.storage.from("product-images").remove([storagePath]);
  }

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { success: false, message: error.message };

  // Deleting the featured photo would otherwise leave the product with none.
  if (productId) await ensureFeaturedImage(supabase, productId);

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { success: true, message: "Image deleted." };
}

export async function deleteProductVideo(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const videoId = formData.get("videoId") as string;
  const storagePath = formData.get("storagePath") as string;
  const productId = formData.get("productId") as string;

  if (!videoId) return { success: false, message: "Video ID is missing." };

  const supabase = createServiceClient();

  if (storagePath) {
    await supabase.storage.from("product-videos").remove([storagePath]);
  }

  const { error } = await supabase.from("product_videos").delete().eq("id", videoId);
  if (error) return { success: false, message: error.message };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { success: true, message: "Video deleted." };
}

export async function updateOrderStatus(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const orderId = formData.get("orderId") as string;
  const status = formData.get("status") as Database["public"]["Enums"]["order_status"] | "";
  const paymentStatus = formData.get(
    "paymentStatus",
  ) as Database["public"]["Enums"]["payment_status"] | "";
  // Tracking fields are always present in the form; trim and treat blank as "clear".
  const courier = (formData.get("courier") as string | null)?.trim() ?? "";
  const trackingNumber = (formData.get("trackingNumber") as string | null)?.trim() ?? "";
  // Razorpay refund reference, pasted in by hand — refunds are issued from the Razorpay
  // dashboard, not from here, so this field only records what already happened.
  const refundId = (formData.get("refundId") as string | null)?.trim() ?? "";

  if (!orderId) {
    return { success: false, message: "Order ID is missing." };
  }

  const supabase = createServiceClient();

  // Read the current state first: whether this save is what moves the order into a terminal
  // state decides if stock and coupon usage have to be given back. The full row is selected
  // because the customer notification below needs the order's own details (number, total,
  // address) and its before/after comparison decides which email, if any, to send.
  const { data: current, error: loadError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (loadError || !current) {
    return { success: false, message: loadError?.message ?? "Order not found." };
  }

  const updates: {
    status?: Database["public"]["Enums"]["order_status"];
    payment_status?: Database["public"]["Enums"]["payment_status"];
    courier?: string | null;
    tracking_number?: string | null;
    refund_id?: string | null;
  } = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.payment_status = paymentStatus;
  // Always sync tracking fields (empty string clears them).
  updates.courier = courier || null;
  updates.tracking_number = trackingNumber || null;
  updates.refund_id = refundId || null;

  // Entering cancelled/refunded for the first time — cancelled_at is the sentinel, so an order
  // already reversed by the customer's own cancellation won't be restocked a second time.
  const isTerminal = status === "cancelled" || status === "refunded";
  const shouldReverse = isTerminal && !current.cancelled_at;

  // A paid order being cancelled should not stay "paid". Only fill this in when the admin left
  // the payment dropdown alone, so an explicit choice always wins.
  if (shouldReverse && !paymentStatus && current.payment_status === "paid") {
    updates.payment_status = "refunded";
  }

  const { error } = await supabase.from("orders").update(updates).eq("id", orderId);
  if (error) {
    return { success: false, message: error.message };
  }

  let note = "";
  if (shouldReverse) {
    const reversal = await reverseOrderSideEffects(supabase, orderId);
    if (reversal.reversed) {
      const parts = [`stock restored on ${reversal.restoredLines} item(s)`];
      if (reversal.couponReleased) parts.push("coupon use released");
      note = ` — ${parts.join(", ")}. Issue the refund in Razorpay if you haven't already.`;
    }
  }

  // Notify the customer if this save is what moved the order to shipped/delivered/cancelled/
  // refunded. Comparing before against after means re-saving an unchanged order (or correcting a
  // typo in a tracking number) sends nothing, so no "already emailed" flag has to be stored.
  // Email is strictly best-effort: a provider outage must never fail an admin's save.
  const after = { ...current, ...updates };
  const emailKind = detectOrderEmail(current, after);
  if (emailKind) {
    try {
      const recipient = await resolveOrderRecipient(supabase, current);
      if (recipient) {
        const sent = await sendOrderStatusEmail({ kind: emailKind, to: recipient, order: after });
        note += sent.success
          ? ` Customer notified by email (${emailKind}).`
          : ` Note: the ${emailKind} email could not be sent.`;
      } else {
        note += " Note: no email address on file, so the customer was not notified.";
      }
    } catch (e) {
      console.error(`Failed to send "${emailKind}" email for order ${orderId}:`, e);
      note += ` Note: the ${emailKind} email could not be sent.`;
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
  return { success: true, message: `Order updated.${note}` };
}

export async function updateProductAvailability(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const productId = formData.get("productId") as string;
  const isAvailable = formData.get("isAvailable") === "true";

  if (!productId) {
    return { success: false, message: "Product ID is missing." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", productId);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/products");
  return { success: true, message: "Product updated." };
}

export async function deleteProduct(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const productId = formData.get("productId") as string;
  if (!productId) {
    return { success: false, message: "Product ID is missing." };
  }

  const supabase = createServiceClient();

  // Collected before the delete: product_images and product_videos are ON DELETE CASCADE, so once
  // the product row goes these URLs are unrecoverable and the files would be stranded in Storage.
  const [{ data: images }, { data: videos }] = await Promise.all([
    supabase.from("product_images").select("url").eq("product_id", productId),
    supabase.from("product_videos").select("url").eq("product_id", productId),
  ]);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    return { success: false, message: error.message };
  }

  // Only after the record is definitely gone — a failure here leaves an orphaned file, whereas
  // clearing files first and then failing the delete would gut a product that still exists.
  await removeStorageObjectsByUrl(supabase, [
    ...(images ?? []).map((image) => image.url),
    ...(videos ?? []).map((video) => video.url),
  ]);

  revalidatePath("/admin/products");
  // The header mega-menu lists products and is rendered by the root layout, so a product change
  // has to invalidate the layout — revalidating /products alone left the menu stale everywhere else.
  revalidatePath("/", "layout");
  return { success: true, message: "Product deleted." };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function toNullableNumber(value: string | null): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n;
}

function toNullableString(value: string | null): string | null {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export async function createProduct(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || slugify(name || "");
  const description = toNullableString(formData.get("description") as string);
  const price = toNullableNumber(formData.get("price") as string);
  const compareAtPrice = toNullableNumber(formData.get("compareAtPrice") as string);
  const stockQuantity = toNullableNumber(formData.get("stockQuantity") as string) ?? 0;
  const categoryId = toNullableString(formData.get("categoryId") as string);
  const collectionId = toNullableString(formData.get("collectionId") as string);
  const material = toNullableString(formData.get("material") as string);
  const dimensions = toNullableString(formData.get("dimensions") as string);
  const composition = toNullableString(formData.get("composition") as string);
  const weight = toNullableString(formData.get("weight") as string);
  const careInstructions = toNullableString(formData.get("careInstructions") as string);
  const makingTime = toNullableString(formData.get("makingTime") as string);
  const shippingInfo = toNullableString(formData.get("shippingInfo") as string);
  const tagline = toNullableString(formData.get("tagline") as string);
  const story = toNullableString(formData.get("story") as string);
  const navDescription = toNullableString(formData.get("navDescription") as string);
  const sortOrder = toNullableNumber(formData.get("sortOrder") as string);
  const hsnCode = toNullableString(formData.get("hsnCode") as string);
  const gstRate = toNullableNumber(formData.get("gstRate") as string);
  const metaTitle = toNullableString(formData.get("metaTitle") as string);
  const metaDescription = toNullableString(formData.get("metaDescription") as string);
  const isAvailable = formData.get("isAvailable") === "on";
  const isBestseller = formData.get("isBestseller") === "on";
  const isNewArrival = formData.get("isNewArrival") === "on";
  const isFlagship = formData.get("isFlagship") === "on";

  if (!name) {
    return { success: false, message: "Product name is required." };
  }
  if (!slug) {
    return { success: false, message: "Product slug is required." };
  }
  if (price === null || price < 0) {
    return { success: false, message: "A valid price is required." };
  }
  // Blank is fine (the shop default applies), but a value out of range is not — it would print a
  // nonsense rate on a tax invoice, and the DB check constraint would reject it with a far less
  // helpful message.
  if (gstRate !== null && (gstRate < 0 || gstRate > 100)) {
    return { success: false, message: "GST rate must be between 0 and 100." };
  }

  const supabase = createServiceClient();

  // Left blank, a new product goes to the end of the shop. The column defaults to 0, which would
  // instead tie it with the first seeded product and wedge it into second place everywhere.
  let resolvedSortOrder = sortOrder;
  if (resolvedSortOrder === null) {
    const { data: last } = await supabase
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    resolvedSortOrder = (last?.sort_order ?? -1) + 1;
  }

  const { data: inserted, error } = await supabase
    .from("products")
    .insert({
      sort_order: resolvedSortOrder,
      metadata: {
        ...(navDescription ? { navDescription } : {}),
        ...(isFlagship ? { isFlagship: true } : {}),
      },
      name,
      slug,
      description,
      price,
      compare_at_price: compareAtPrice,
      stock_quantity: stockQuantity,
      category_id: categoryId,
      collection_id: collectionId,
      material,
      dimensions,
      composition,
      weight,
      care_instructions: careInstructions,
      making_time: makingTime,
      shipping_info: shippingInfo,
      tagline,
      story,
      hsn_code: hsnCode,
      gst_rate: gstRate,
      meta_title: metaTitle,
      meta_description: metaDescription,
      is_available: isAvailable,
      is_bestseller: isBestseller,
      is_new_arrival: isNewArrival,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  // Photos and videos picked on the new-product form were uploaded straight to Storage while the
  // form was being filled in, so all that arrives here are their object paths.
  // Numbered as one sequence so the gallery order means something from the very first save. There
  // is nothing to arrange around yet, so photos simply lead and videos follow; the edit page's
  // uploader is where a new batch starts at the top instead.
  const mediaError = await insertProductMedia(
    supabase,
    inserted.id,
    [
      ...parseUploadedMedia(formData.get("imageUploads")).map((item) => ({
        ...item,
        kind: "image" as const,
      })),
      ...parseUploadedMedia(formData.get("videoUploads")).map((item) => ({
        ...item,
        kind: "video" as const,
      })),
    ],
    0,
  );
  if (mediaError) console.error("Some product media could not be recorded:", mediaError);

  revalidatePath("/admin/products");
  // The header mega-menu lists products and is rendered by the root layout, so a product change
  // has to invalidate the layout — revalidating /products alone left the menu stale everywhere else.
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateProduct(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const id = formData.get("productId") as string;
  if (!id) {
    return { success: false, message: "Product ID is missing." };
  }

  const supabase = createServiceClient();

  // The stored row is read before anything is written, because every field below falls back to it:
  // a box left empty means "leave this as it is" rather than "erase it", so correcting one line no
  // longer costs a retype of the whole product. See formValues.ts for where the rule stops.
  const { data: current } = await supabase.from("products").select("*").eq("id", id).single();
  if (!current) {
    return { success: false, message: "That product could not be found." };
  }

  const name = keepRequiredText(formData, "name", current.name);
  const slug = keepRequiredText(formData, "slug", current.slug) || slugify(name);
  const price = keepRequiredNumber(formData, "price", current.price);
  const gstRate = keepNumber(formData, "gstRate", current.gst_rate);
  const isAvailable = formData.get("isAvailable") === "on";
  const isBestseller = formData.get("isBestseller") === "on";
  const isNewArrival = formData.get("isNewArrival") === "on";
  const isFlagship = formData.get("isFlagship") === "on";

  if (!name) {
    return { success: false, message: "Product name is required." };
  }
  if (!slug) {
    return { success: false, message: "Product slug is required." };
  }
  if (price < 0) {
    return { success: false, message: "A valid price is required." };
  }
  if (gstRate !== null && (gstRate < 0 || gstRate > 100)) {
    return { success: false, message: "GST rate must be between 0 and 100." };
  }

  // metadata holds more than the menu blurb, so it is merged rather than replaced; the blurb
  // itself follows the same blank rule as every column — empty leaves the stored one in place.
  const metadata: Record<string, Json | undefined> = {
    ...((current.metadata as Record<string, Json | undefined>) ?? {}),
  };
  const navDescription = keepText(
    formData,
    "navDescription",
    typeof metadata.navDescription === "string" ? metadata.navDescription : null,
  );
  if (navDescription) {
    metadata.navDescription = navDescription;
  } else {
    delete metadata.navDescription;
  }
  // A tickbox is never blank, so it still says exactly what it says. Unticking removes the key
  // entirely rather than storing `false`, so metadata stays clean and the storefront's `=== true`
  // check has only one shape to deal with.
  if (isFlagship) {
    metadata.isFlagship = true;
  } else {
    delete metadata.isFlagship;
  }

  const { error } = await supabase
    .from("products")
    .update({
      metadata,
      // Blank means "leave it where it is" rather than "send it to the front".
      sort_order: keepRequiredNumber(formData, "sortOrder", current.sort_order),
      name,
      slug,
      price,
      description: keepText(formData, "description", current.description),
      compare_at_price: keepNumber(formData, "compareAtPrice", current.compare_at_price),
      stock_quantity: keepRequiredNumber(formData, "stockQuantity", current.stock_quantity),
      // Dropdowns, not boxes: "None" is a choice the admin made, so it is written as given.
      category_id: selectedOption(formData, "categoryId", current.category_id),
      collection_id: selectedOption(formData, "collectionId", current.collection_id),
      material: keepText(formData, "material", current.material),
      dimensions: keepText(formData, "dimensions", current.dimensions),
      composition: keepText(formData, "composition", current.composition),
      weight: keepText(formData, "weight", current.weight),
      care_instructions: keepText(formData, "careInstructions", current.care_instructions),
      making_time: keepText(formData, "makingTime", current.making_time),
      shipping_info: keepText(formData, "shippingInfo", current.shipping_info),
      tagline: keepText(formData, "tagline", current.tagline),
      story: keepText(formData, "story", current.story),
      hsn_code: keepText(formData, "hsnCode", current.hsn_code),
      gst_rate: gstRate,
      meta_title: keepText(formData, "metaTitle", current.meta_title),
      meta_description: keepText(formData, "metaDescription", current.meta_description),
      is_available: isAvailable,
      is_bestseller: isBestseller,
      is_new_arrival: isNewArrival,
    })
    .eq("id", id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/products");
  // The header mega-menu lists products and is rendered by the root layout, so a product change
  // has to invalidate the layout — revalidating /products alone left the menu stale everywhere else.
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

function slugifyKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export async function createCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const label = (formData.get("label") as string)?.trim();
  const key = (formData.get("key") as string)?.trim() || slugifyKey(label || "");

  if (!label) {
    return { success: false, message: "Category label is required." };
  }
  if (!key) {
    return { success: false, message: "Category key is required." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").insert({ key, label });
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true, message: "Category created." };
}

export async function updateCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const id = formData.get("categoryId") as string;
  if (!id) {
    return { success: false, message: "Category ID is missing." };
  }

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from("categories")
    .select("key, label")
    .eq("id", id)
    .single();
  if (!current) {
    return { success: false, message: "That category could not be found." };
  }

  // Either box left empty keeps what is stored — including the key, which the storefront filters
  // by, so renaming a category no longer quietly rewrites the handle underneath it.
  const label = keepRequiredText(formData, "label", current.label);
  const key = keepRequiredText(formData, "key", current.key) || slugifyKey(label);

  const { error } = await supabase.from("categories").update({ key, label }).eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true, message: "Category updated." };
}

export async function deleteCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) {
    return { success: false, message: "Unauthorized." };
  }

  const id = formData.get("categoryId") as string;
  if (!id) {
    return { success: false, message: "Category ID is missing." };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/admin/categories");
  return { success: true, message: "Category deleted." };
}

// ─── Collections ──────────────────────────────────────────────────────────────

// A collection's page, its header mega-menu cell and its homepage tile all read copy that has no
// column of its own — it lives in `collections.metadata`, put there by migrations 024/025. Until
// now none of it was reachable from the admin panel, so changing the collection's eyebrow, intro,
// stats or founder note meant editing JSON in the Supabase dashboard. The merge logic itself lives
// in collectionMetadata.ts so it can be exercised directly; see the note there.

export async function createCollection(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || slugify(title || "");
  const subtitle = toNullableString(formData.get("subtitle") as string);
  // Derived from the intro rather than typed twice — see collectionDescriptionFromForm.
  const description = collectionDescriptionFromForm(formData, null);
  const categoryId = toNullableString(formData.get("categoryId") as string);
  const heroImage = toNullableString(formData.get("heroImage") as string);
  const isPublished = formData.get("isPublished") === "on";

  if (!title) return { success: false, message: "Title is required." };
  if (!slug) return { success: false, message: "Slug is required." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("collections").insert({
    title, slug, subtitle, description, category_id: categoryId,
    hero_image: heroImage, is_published: isPublished,
    metadata: buildCollectionMetadata({}, formData) as Json,
  });
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/collections");
  // The collection drives the header mega-menu and the homepage tiles, both rendered by the root
  // layout, so the whole tree has to be invalidated rather than just the collection's own page.
  revalidatePath("/", "layout");
  return { success: true, message: "Collection created." };
}

export async function updateCollection(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("collectionId") as string;
  if (!id) return { success: false, message: "Collection ID is missing." };

  const supabase = createServiceClient();

  // The whole row is read first: the metadata has to be merged rather than blindly written (a
  // blind write would drop any key this form does not render), and every column below falls back
  // to what is stored, so a box left empty leaves that part of the collection alone.
  const { data: current } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();
  if (!current) return { success: false, message: "That collection could not be found." };

  const title = keepRequiredText(formData, "title", current.title);
  const slug = keepRequiredText(formData, "slug", current.slug) || slugify(title);
  const subtitle = keepText(formData, "subtitle", current.subtitle);
  // Derived from the intro rather than typed twice — see collectionDescriptionFromForm.
  const description = collectionDescriptionFromForm(formData, current.description);
  const categoryId = selectedOption(formData, "categoryId", current.category_id);
  const heroImage = keepText(formData, "heroImage", current.hero_image);
  const isPublished = formData.get("isPublished") === "on";

  if (!title) return { success: false, message: "Title is required." };

  const { error } = await supabase.from("collections").update({
    title, slug, subtitle, description, category_id: categoryId,
    hero_image: heroImage, is_published: isPublished,
    metadata: buildCollectionMetadata(
      (current.metadata as Record<string, Json | undefined>) ?? {},
      formData,
    ) as Json,
  }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  return { success: true, message: "Collection updated." };
}

export async function deleteCollection(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("collectionId") as string;
  if (!id) return { success: false, message: "Collection ID is missing." };

  const supabase = createServiceClient();

  // A collection carries three images: the hero column plus the header-menu and homepage-tile
  // images stored in metadata.
  const { data: current } = await supabase
    .from("collections")
    .select("hero_image, metadata")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  const metadata = (current?.metadata ?? {}) as { navImage?: unknown; tileImage?: unknown };
  await removeStorageObjectsByUrl(supabase, [
    current?.hero_image,
    typeof metadata.navImage === "string" ? metadata.navImage : null,
    typeof metadata.tileImage === "string" ? metadata.tileImage : null,
  ]);

  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  return { success: true, message: "Collection deleted." };
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function approveReview(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("reviewId") as string;
  if (!id) return { success: false, message: "Review ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/reviews");
  return { success: true, message: "Review approved." };
}

export async function deleteReview(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("reviewId") as string;
  if (!id) return { success: false, message: "Review ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/reviews");
  return { success: true, message: "Review deleted." };
}

export async function approveAllReviews(
  _prevState: FormResult | null,
  _formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("is_approved", false);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/reviews");
  return { success: true, message: "All pending reviews approved." };
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function createBlogPost(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || slugify(title || "");
  const excerpt = toNullableString(formData.get("excerpt") as string);
  const content = (formData.get("content") as string)?.trim() || "";
  const coverImage = toNullableString(formData.get("coverImage") as string);
  const author = toNullableString(formData.get("author") as string);
  const isPublished = formData.get("isPublished") === "on";
  const publishedAt = isPublished ? new Date().toISOString() : null;
  const metaTitle = toNullableString(formData.get("metaTitle") as string);
  const metaDescription = toNullableString(formData.get("metaDescription") as string);
  const category = (formData.get("category") as string)?.trim() || DEFAULT_BLOG_CATEGORY;
  const featuredOnHome = formData.get("featuredOnHome") === "on";

  if (!title) return { success: false, message: "Title is required." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").insert({
    title, slug, excerpt, content, cover_image: coverImage,
    author, is_published: isPublished, published_at: publishedAt,
    meta_title: metaTitle, meta_description: metaDescription,
    metadata: { category, ...(featuredOnHome ? { featuredOnHome: true } : {}) },
  });
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("postId") as string;
  if (!id) return { success: false, message: "Post ID is missing." };

  const supabase = createServiceClient();

  // The whole row is read first: published_at must not be overwritten, the existing metadata has
  // to be merged so that setting the category doesn't drop the other keys stored alongside it
  // (date, readTime, authorRole), and every field below falls back to what is stored — an empty
  // box means the client left that part of the post alone, not that they want it gone.
  const { data: existing } = await supabase.from("blog_posts").select("*").eq("id", id).single();
  if (!existing) return { success: false, message: "That post could not be found." };

  const title = keepRequiredText(formData, "title", existing.title);
  const slug = keepRequiredText(formData, "slug", existing.slug) || slugify(title);
  const excerpt = keepText(formData, "excerpt", existing.excerpt);
  const content = keepRequiredText(formData, "content", existing.content);
  const coverImage = keepText(formData, "coverImage", existing.cover_image);
  const author = keepText(formData, "author", existing.author);
  const isPublished = formData.get("isPublished") === "on";
  const metaTitle = keepText(formData, "metaTitle", existing.meta_title);
  const metaDescription = keepText(formData, "metaDescription", existing.meta_description);
  const featuredOnHome = formData.get("featuredOnHome") === "on";

  if (!title) return { success: false, message: "Title is required." };

  let publishedAt = existing.published_at ?? null;
  if (isPublished && !existing.is_published) {
    publishedAt = new Date().toISOString();
  }

  const existingMetadata =
    existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};
  // A dropdown, so what it posts is what the client picked; only a submission without the field
  // at all falls back to the stored category.
  const category =
    submittedText(formData.get("category")) ??
    (typeof existingMetadata.category === "string"
      ? existingMetadata.category
      : DEFAULT_BLOG_CATEGORY);

  const { error } = await supabase.from("blog_posts").update({
    title, slug, excerpt, content, cover_image: coverImage,
    author, is_published: isPublished, published_at: publishedAt,
    meta_title: metaTitle, meta_description: metaDescription,
    // Unticking removes the key rather than storing `false`, matching the product Flagship flag.
    metadata: (() => {
      const next: Record<string, Json | undefined> = {
        ...(existingMetadata as Record<string, Json | undefined>),
        category,
      };
      if (featuredOnHome) next.featuredOnHome = true;
      else delete next.featuredOnHome;
      return next;
    })(),
  }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("postId") as string;
  if (!id) return { success: false, message: "Post ID is missing." };

  const supabase = createServiceClient();

  // Both the cover image and every image placed inside the post body.
  const { data: current } = await supabase
    .from("blog_posts")
    .select("cover_image, content")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  await removeStorageObjectsByUrl(supabase, [
    current?.cover_image,
    ...extractContentImageUrls(current?.content ?? null),
  ]);

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  return { success: true, message: "Post deleted." };
}

// ─── Contact Submissions ──────────────────────────────────────────────────────

export async function resolveContactSubmission(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("submissionId") as string;
  if (!id) return { success: false, message: "Submission ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("contact_submissions").update({ is_resolved: true }).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/contact");
  return { success: true, message: "Marked as resolved." };
}

// Marking resolved keeps a message in the list; this removes it outright. Needed for the spam and
// abuse that any public contact form attracts, and to honour a "delete what you hold on me"
// request — neither of which "resolved" covers. Previously only reachable via the Supabase dashboard.
export async function deleteContactSubmission(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("submissionId") as string;
  if (!id) return { success: false, message: "Submission ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/contact");
  // The unread badge in the admin sidebar counts unresolved messages, and the layout draws it.
  revalidatePath("/admin", "layout");
  return { success: true, message: "Message deleted." };
}

export async function resolveAllContactSubmissions(
  _prevState: FormResult | null,
  _formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("contact_submissions").update({ is_resolved: true }).eq("is_resolved", false);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/contact");
  return { success: true, message: "All messages marked resolved." };
}

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

// The table has no unsubscribed flag — a row's presence *is* the subscription — so removing someone
// means deleting the row. Until now the admin panel could only list and export subscribers, leaving
// no way to action an unsubscribe or removal request without opening the Supabase dashboard.
export async function deleteSubscriber(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("subscriberId") as string;
  if (!id) return { success: false, message: "Subscriber ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/newsletter");
  return { success: true, message: "Subscriber removed." };
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function createCoupon(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const discountType = formData.get("discountType") as Database["public"]["Tables"]["coupons"]["Row"]["discount_type"];
  const discountValue = toNullableNumber(formData.get("discountValue") as string);
  const minOrderAmount = toNullableNumber(formData.get("minOrderAmount") as string);
  const maxUses = toNullableNumber(formData.get("maxUses") as string);
  const expiresAt = toNullableString(formData.get("expiresAt") as string);
  const isActive = formData.get("isActive") === "on";

  if (!code) return { success: false, message: "Coupon code is required." };
  if (!discountValue || discountValue <= 0) return { success: false, message: "Discount value must be positive." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("coupons").insert({
    code, discount_type: discountType, discount_value: discountValue,
    min_order_amount: minOrderAmount, max_uses: maxUses,
    expires_at: expiresAt, is_active: isActive,
  });
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/coupons");
  return { success: true, message: "Coupon created." };
}

export async function updateCoupon(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("couponId") as string;
  if (!id) return { success: false, message: "Coupon ID is missing." };

  const supabase = createServiceClient();

  // Every field falls back to the stored coupon, which covers both halves of the problem: the
  // activate/deactivate button posts nothing but couponId + isActive and must not clobber the
  // discount, and an edit saved with a box left empty keeps the figure already in it.
  const { data: current } = await supabase.from("coupons").select("*").eq("id", id).single();
  if (!current) return { success: false, message: "That coupon could not be found." };

  const discountValue = keepRequiredNumber(formData, "discountValue", current.discount_value);
  if (discountValue <= 0) {
    return { success: false, message: "Discount value must be positive." };
  }

  const discountType = submittedText(formData.get("discountType")) ?? current.discount_type;
  const updates: Database["public"]["Tables"]["coupons"]["Update"] = {
    is_active: formData.get("isActive") === "on",
    discount_type:
      discountType as Database["public"]["Tables"]["coupons"]["Row"]["discount_type"],
    discount_value: discountValue,
    min_order_amount: keepNumber(formData, "minOrderAmount", current.min_order_amount),
    max_uses: keepNumber(formData, "maxUses", current.max_uses),
    expires_at: keepText(formData, "expiresAt", current.expires_at),
  };

  const { error } = await supabase.from("coupons").update(updates).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/coupons");
  return { success: true, message: "Coupon updated." };
}

export async function deleteCoupon(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("couponId") as string;
  if (!id) return { success: false, message: "Coupon ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/coupons");
  return { success: true, message: "Coupon deleted." };
}

export async function updateStockQuantity(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const productId = formData.get("productId") as string;
  if (!productId) return { success: false, message: "Product ID is missing." };

  const supabase = createServiceClient();

  // An emptied box is not "none left" — it is a row saved without that figure being retyped, so
  // the count stays where it is. Zero has to be typed to mean zero.
  const { data: current } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single();
  if (!current) return { success: false, message: "That product could not be found." };

  const stockQuantity = keepRequiredNumber(formData, "stockQuantity", current.stock_quantity);

  const { error } = await supabase
    .from("products").update({ stock_quantity: stockQuantity }).eq("id", productId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/products");
  return { success: true, message: "Stock updated." };
}

// ─── Banners ──────────────────────────────────────────────────────────────────

export async function createBanner(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const placement = (formData.get("placement") as string)?.trim() || "homepage_hero";
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const linkUrl = toNullableString(formData.get("linkUrl") as string);
  const alt = toNullableString(formData.get("alt") as string);
  const position = toNullableNumber(formData.get("position") as string) ?? 0;
  const isActive = formData.get("isActive") === "on";

  if (!imageUrl) return { success: false, message: "An image is required." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("banners").insert({
    placement,
    image_url: imageUrl,
    link_url: linkUrl,
    alt,
    position,
    is_active: isActive,
  });
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, message: "Banner created." };
}

export async function updateBanner(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("bannerId") as string;
  if (!id) return { success: false, message: "Banner ID is missing." };

  const supabase = createServiceClient();

  // Everything falls back to the stored banner, so the row survives both a partial submission and
  // a form saved with boxes left empty. The image is the one field with no way to remove it from
  // here: a banner with no picture has nothing to render, so clearing it keeps the current one.
  const { data: current } = await supabase.from("banners").select("*").eq("id", id).single();
  if (!current) return { success: false, message: "That banner could not be found." };

  const updates: Database["public"]["Tables"]["banners"]["Update"] = {
    is_active: formData.get("isActive") === "on",
    image_url: keepRequiredText(formData, "imageUrl", current.image_url),
    placement: submittedText(formData.get("placement")) ?? current.placement,
    link_url: keepText(formData, "linkUrl", current.link_url),
    alt: keepText(formData, "alt", current.alt),
    position: keepRequiredNumber(formData, "position", current.position),
  };

  const { error } = await supabase.from("banners").update(updates).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, message: "Banner updated." };
}

export async function deleteBanner(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("bannerId") as string;
  if (!id) return { success: false, message: "Banner ID is missing." };

  const supabase = createServiceClient();

  const { data: current } = await supabase
    .from("banners")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  await removeStorageObjectsByUrl(supabase, [current?.image_url]);

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return { success: true, message: "Banner deleted." };
}

// ─── Page content (Admin → Home Page / FAQs) ──────────────────────────────────
//
// One action serves every section on both pages: the form posts the section key plus its values as
// JSON, and the shape is validated against the declaration in @/lib/content/sections rather than
// trusted. normaliseValues drops anything the schema does not declare and coerces what is left to
// strings, so a hand-crafted post cannot store a key the storefront would then render.

const STOREFRONT_PATHS: Record<SectionSchema["page"], string> = {
  home: "/",
  faqs: "/faqs",
  about: "/about",
};

function revalidateSection(key: string) {
  const schema = SECTIONS_BY_KEY[key];
  revalidatePath("/admin/home");
  revalidatePath("/admin/faqs");
  revalidatePath("/admin/about");

  // Two bands reach beyond the page they are edited on: the trust bar also closes the products
  // page and every product page, and the Come Closer CTA also closes every collection page and the
  // reviews page. Revalidating the whole layout is cheaper than enumerating those routes.
  if (key === "site_trust_bar" || key === "site_come_closer") {
    revalidatePath("/", "layout");
    return;
  }
  revalidatePath(STOREFRONT_PATHS[schema?.page ?? "home"]);
}

export async function updateSectionContent(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const key = (formData.get("sectionKey") as string)?.trim();
  const schema = SECTIONS_BY_KEY[key];
  if (!schema) return { success: false, message: "Unknown section." };

  let parsed: unknown;
  try {
    parsed = JSON.parse((formData.get("values") as string) ?? "{}");
  } catch {
    return { success: false, message: "Could not read the submitted content." };
  }

  // The fields whose Clear button was pressed. Everything else that arrives empty is read as
  // "left alone" and keeps the copy already on the page — see mergeSectionValues.
  let cleared: string[] = [];
  try {
    const raw: unknown = JSON.parse((formData.get("clearedFields") as string) ?? "[]");
    if (Array.isArray(raw)) cleared = raw.filter((name): name is string => typeof name === "string");
  } catch {
    cleared = [];
  }

  // A section that must always render ignores the toggle rather than letting a stale or absent
  // checkbox hide something the page cannot do without.
  const isVisible = schema.canHide ? formData.get("isVisible") === "on" : true;

  const supabase = createServiceClient();

  const { data: stored } = await supabase
    .from("site_content")
    .select("content")
    .eq("key", key)
    .maybeSingle();

  const values = mergeSectionValues(
    schema,
    normaliseValues(schema, parsed),
    stored?.content,
    cleared,
  );

  const { error } = await supabase.from("site_content").upsert(
    {
      key,
      content: values as unknown as Json,
      is_visible: isVisible,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) return { success: false, message: error.message };

  revalidateSection(key);
  return { success: true, message: `${schema.label} saved.` };
}

// There is no "reset" action to match: restoring a section's shipped copy is a local refill of the
// form from the schema defaults (which the admin bundle already carries), so the client can read
// what they are about to restore before saving it.

// ─── FAQs ─────────────────────────────────────────────────────────────────────

function revalidateFaqs() {
  revalidatePath("/admin/faqs");
  revalidatePath("/faqs");
}

export async function createFaqCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { success: false, message: "A category name is required." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("faq_categories").insert({
    title,
    position: toNullableNumber(formData.get("position") as string) ?? 0,
    is_active: formData.get("isActive") === "on",
  });
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Category created." };
}

export async function updateFaqCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("categoryId") as string;
  if (!id) return { success: false, message: "Category ID is missing." };

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from("faq_categories")
    .select("title, position")
    .eq("id", id)
    .single();
  if (!current) return { success: false, message: "That category could not be found." };

  const { error } = await supabase
    .from("faq_categories")
    .update({
      // Blank keeps the stored name and place in the list; the tickbox is read as it stands.
      title: keepRequiredText(formData, "title", current.title),
      position: keepRequiredNumber(formData, "position", current.position),
      is_active: formData.get("isActive") === "on",
    })
    .eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Category saved." };
}

export async function deleteFaqCategory(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("categoryId") as string;
  if (!id) return { success: false, message: "Category ID is missing." };

  // faq_items cascades on delete, so the questions inside go with it — the admin form says so
  // before it asks for confirmation.
  const supabase = createServiceClient();
  const { error } = await supabase.from("faq_categories").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Category deleted." };
}

export async function createFaqItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const categoryId = formData.get("categoryId") as string;
  if (!categoryId) return { success: false, message: "Category ID is missing." };

  const question = (formData.get("question") as string)?.trim();
  const answer = (formData.get("answer") as string)?.trim();
  if (!question) return { success: false, message: "A question is required." };
  if (!answer) return { success: false, message: "An answer is required." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("faq_items").insert({
    category_id: categoryId,
    question,
    answer,
    position: toNullableNumber(formData.get("position") as string) ?? 0,
    is_active: formData.get("isActive") === "on",
  });
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Question added." };
}

export async function updateFaqItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("itemId") as string;
  if (!id) return { success: false, message: "Question ID is missing." };

  const supabase = createServiceClient();
  const { data: current } = await supabase
    .from("faq_items")
    .select("question, answer, position")
    .eq("id", id)
    .single();
  if (!current) return { success: false, message: "That question could not be found." };

  const updates: Database["public"]["Tables"]["faq_items"]["Update"] = {
    // Either box left empty keeps the wording that is already published.
    question: keepRequiredText(formData, "question", current.question),
    answer: keepRequiredText(formData, "answer", current.answer),
    position: keepRequiredNumber(formData, "position", current.position),
    is_active: formData.get("isActive") === "on",
  };

  // Moving a question to another category is a select on the row, so it is only applied when the
  // field was actually submitted.
  const categoryId = formData.get("categoryId");
  if (typeof categoryId === "string" && categoryId) updates.category_id = categoryId;

  const { error } = await supabase.from("faq_items").update(updates).eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Question saved." };
}

export async function deleteFaqItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const id = formData.get("itemId") as string;
  if (!id) return { success: false, message: "Question ID is missing." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("faq_items").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidateFaqs();
  return { success: true, message: "Question deleted." };
}
