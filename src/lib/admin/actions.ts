"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/data/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_BLOG_CATEGORY } from "@/components/blog/blogCategories";
import { reverseOrderSideEffects } from "@/lib/orders/reversal";
import { buildCollectionMetadata } from "@/lib/admin/collectionMetadata";
import {
  ensureFeaturedImage,
  promoteFeaturedImage,
  reorderProductImage,
} from "@/lib/admin/productImages";
import {
  extractContentImageUrls,
  removeStorageObjectsByUrl,
} from "@/lib/admin/storageCleanup";
import { detectOrderEmail, sendOrderStatusEmail } from "@/lib/email/orderStatus";
import { resolveOrderRecipient } from "@/lib/email/recipient";
import { MEDIA_RULES } from "@/lib/admin/mediaTypes";
import type { MediaBucket, SignedUpload, UploadedMedia } from "@/lib/admin/mediaTypes";
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

const SITE_IMAGE_FOLDERS = new Set<string>(["collections", "blog", "banners"]);
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

// ─── Product Images ───────────────────────────────────────────────────────────

// Ordering and main-photo rules live in productImages.ts so they can be exercised directly; these
// are the thin server-action wrappers that add the admin gate and cache invalidation.

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

// Alt text describes the photo for screen readers and image search. It was only ever set from the
// uploaded filename, with no way to correct it — migration 026 had to write the real descriptions
// in SQL. Blank clears it, and the storefront falls back to the product name.
export async function updateProductImageAlt(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;
  if (!imageId || !productId) {
    return { success: false, message: "Image ID is missing." };
  }

  const alt = toNullableString(formData.get("alt") as string);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_images")
    // Scoped by product too, so an image can only be edited through its own product's page.
    .update({ alt })
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id");

  if (error) return { success: false, message: error.message };
  if (!data?.length) return { success: false, message: "That image could not be found." };

  revalidateProductImagery(productId);
  return { success: true, message: alt ? "Description saved." : "Description cleared." };
}

export async function moveProductImage(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };

  const imageId = formData.get("imageId") as string;
  const productId = formData.get("productId") as string;
  const direction = formData.get("direction") === "down" ? "down" : "up";
  if (!imageId || !productId) {
    return { success: false, message: "Image ID is missing." };
  }

  const result = await reorderProductImage(createServiceClient(), productId, imageId, direction);
  if (result.success) revalidateProductImagery(productId);
  return result;
}

async function insertProductImages(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  media: UploadedMedia[],
  startPosition: number,
) {
  if (!media.length) return null;

  let position = startPosition;
  const rows = media.map((item) => {
    const { data } = supabase.storage.from("product-images").getPublicUrl(item.path);
    return {
      product_id: productId,
      url: data.publicUrl,
      alt: item.alt?.trim() || null,
      position: position++,
      is_featured: false,
    };
  });

  const { error } = await supabase.from("product_images").insert(rows);
  if (error) return error.message;

  await ensureFeaturedImage(supabase, productId);
  return null;
}

export async function registerProductImages(
  productId: string,
  media: UploadedMedia[],
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };
  if (!productId) return { success: false, message: "Product ID is missing." };
  if (!media?.length) return { success: false, message: "No images to save." };

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);
  const startPosition = (existing?.[0]?.position ?? -1) + 1;

  const error = await insertProductImages(supabase, productId, media, startPosition);
  if (error) return { success: false, message: error };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return {
    success: true,
    message: `${media.length} image${media.length === 1 ? "" : "s"} added.`,
  };
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

// ─── Product Videos ───────────────────────────────────────────────────────────

async function insertProductVideos(
  supabase: ReturnType<typeof createServiceClient>,
  productId: string,
  media: UploadedMedia[],
  startPosition: number,
) {
  if (!media.length) return null;

  let position = startPosition;
  const rows = media.map((item) => {
    const { data } = supabase.storage.from("product-videos").getPublicUrl(item.path);
    return { product_id: productId, url: data.publicUrl, position: position++ };
  });

  const { error } = await supabase.from("product_videos").insert(rows);
  return error?.message ?? null;
}

export async function registerProductVideos(
  productId: string,
  media: UploadedMedia[],
): Promise<FormResult> {
  if (!(await requireAdmin())) return { success: false, message: "Unauthorized." };
  if (!productId) return { success: false, message: "Product ID is missing." };
  if (!media?.length) return { success: false, message: "No videos to save." };

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("product_videos")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1);
  const startPosition = (existing?.[0]?.position ?? -1) + 1;

  const error = await insertProductVideos(supabase, productId, media, startPosition);
  if (error) return { success: false, message: error };

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return {
    success: true,
    message: `${media.length} video${media.length === 1 ? "" : "s"} added.`,
  };
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
  const imageError = await insertProductImages(
    supabase,
    inserted.id,
    parseUploadedMedia(formData.get("imageUploads")),
    0,
  );
  if (imageError) console.error("Some product images could not be recorded:", imageError);

  const videoError = await insertProductVideos(
    supabase,
    inserted.id,
    parseUploadedMedia(formData.get("videoUploads")),
    0,
  );
  if (videoError) console.error("Some product videos could not be recorded:", videoError);

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

  if (!id) {
    return { success: false, message: "Product ID is missing." };
  }
  if (!name) {
    return { success: false, message: "Product name is required." };
  }
  if (!slug) {
    return { success: false, message: "Product slug is required." };
  }
  if (price === null || price < 0) {
    return { success: false, message: "A valid price is required." };
  }
  if (gstRate !== null && (gstRate < 0 || gstRate > 100)) {
    return { success: false, message: "GST rate must be between 0 and 100." };
  }

  const supabase = createServiceClient();

  // metadata holds more than the menu blurb, so it has to be read and merged rather than replaced;
  // clearing the field drops just that key, and the mega-menu falls back to the tagline again.
  const { data: current } = await supabase
    .from("products")
    .select("metadata, sort_order")
    .eq("id", id)
    .single();

  const metadata: Record<string, Json | undefined> = {
    ...((current?.metadata as Record<string, Json | undefined>) ?? {}),
  };
  if (navDescription) {
    metadata.navDescription = navDescription;
  } else {
    delete metadata.navDescription;
  }
  // Unticking the box removes the key entirely rather than storing `false`, so metadata stays
  // clean and the storefront's `=== true` check has only one shape to deal with.
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
      sort_order: sortOrder ?? current?.sort_order ?? 0,
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
      // Clearing either box is a real instruction — it means "fall back to the shop default" —
      // so these write null rather than preserving the old value the way sort_order does.
      hsn_code: hsnCode,
      gst_rate: gstRate,
      meta_title: metaTitle,
      meta_description: metaDescription,
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
  const label = (formData.get("label") as string)?.trim();
  const key = (formData.get("key") as string)?.trim() || slugifyKey(label || "");

  if (!id) {
    return { success: false, message: "Category ID is missing." };
  }
  if (!label) {
    return { success: false, message: "Category label is required." };
  }
  if (!key) {
    return { success: false, message: "Category key is required." };
  }

  const supabase = createServiceClient();
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
  const description = toNullableString(formData.get("description") as string);
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
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || slugify(title || "");
  const subtitle = toNullableString(formData.get("subtitle") as string);
  const description = toNullableString(formData.get("description") as string);
  const categoryId = toNullableString(formData.get("categoryId") as string);
  const heroImage = toNullableString(formData.get("heroImage") as string);
  const isPublished = formData.get("isPublished") === "on";

  if (!id) return { success: false, message: "Collection ID is missing." };
  if (!title) return { success: false, message: "Title is required." };

  const supabase = createServiceClient();

  // Read the stored metadata first and merge into it, exactly as updateProduct does — a blind write
  // would drop any key this form does not render.
  const { data: current } = await supabase
    .from("collections")
    .select("metadata")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("collections").update({
    title, slug, subtitle, description, category_id: categoryId,
    hero_image: heroImage, is_published: isPublished,
    metadata: buildCollectionMetadata(
      (current?.metadata as Record<string, Json | undefined>) ?? {},
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
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || slugify(title || "");
  const excerpt = toNullableString(formData.get("excerpt") as string);
  const content = (formData.get("content") as string)?.trim() || "";
  const coverImage = toNullableString(formData.get("coverImage") as string);
  const author = toNullableString(formData.get("author") as string);
  const isPublished = formData.get("isPublished") === "on";
  const metaTitle = toNullableString(formData.get("metaTitle") as string);
  const metaDescription = toNullableString(formData.get("metaDescription") as string);
  const category = (formData.get("category") as string)?.trim() || DEFAULT_BLOG_CATEGORY;
  const featuredOnHome = formData.get("featuredOnHome") === "on";

  if (!id) return { success: false, message: "Post ID is missing." };
  if (!title) return { success: false, message: "Title is required." };

  const supabase = createServiceClient();

  // Fetch current published_at to avoid overwriting it, and the existing metadata so that
  // setting the category doesn't drop the other keys stored alongside it (date, readTime,
  // authorRole) — the form only edits category, so the rest must be carried through.
  const { data: existing } = await supabase
    .from("blog_posts").select("published_at, is_published, metadata").eq("id", id).single();

  let publishedAt = existing?.published_at ?? null;
  if (isPublished && !existing?.is_published) {
    publishedAt = new Date().toISOString();
  }

  const existingMetadata =
    existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

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

  // Only the fields actually present in the submission are updated — the
  // activate/deactivate form only sends couponId + isActive, and must not
  // clobber the coupon's discount fields with null.
  const updates: Database["public"]["Tables"]["coupons"]["Update"] = {
    is_active: formData.get("isActive") === "on",
  };

  const rawDiscountType = formData.get("discountType");
  if (rawDiscountType !== null) {
    updates.discount_type =
      rawDiscountType as Database["public"]["Tables"]["coupons"]["Row"]["discount_type"];
  }

  const rawDiscountValue = formData.get("discountValue");
  if (rawDiscountValue !== null) {
    const discountValue = toNullableNumber(rawDiscountValue as string);
    if (discountValue === null || discountValue <= 0) {
      return { success: false, message: "Discount value must be positive." };
    }
    updates.discount_value = discountValue;
  }

  if (formData.get("minOrderAmount") !== null) {
    updates.min_order_amount = toNullableNumber(formData.get("minOrderAmount") as string);
  }
  if (formData.get("maxUses") !== null) {
    updates.max_uses = toNullableNumber(formData.get("maxUses") as string);
  }
  if (formData.get("expiresAt") !== null) {
    updates.expires_at = toNullableString(formData.get("expiresAt") as string);
  }

  const supabase = createServiceClient();
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
  const stockQuantity = toNullableNumber(formData.get("stockQuantity") as string) ?? 0;

  if (!productId) return { success: false, message: "Product ID is missing." };

  const supabase = createServiceClient();
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

  const updates: Database["public"]["Tables"]["banners"]["Update"] = {
    is_active: formData.get("isActive") === "on",
  };

  const rawImageUrl = formData.get("imageUrl");
  if (rawImageUrl !== null && (rawImageUrl as string).trim()) {
    updates.image_url = (rawImageUrl as string).trim();
  }
  if (formData.get("placement") !== null) {
    updates.placement = (formData.get("placement") as string)?.trim() || "homepage_hero";
  }
  if (formData.get("linkUrl") !== null) {
    updates.link_url = toNullableString(formData.get("linkUrl") as string);
  }
  if (formData.get("alt") !== null) {
    updates.alt = toNullableString(formData.get("alt") as string);
  }
  if (formData.get("position") !== null) {
    updates.position = toNullableNumber(formData.get("position") as string) ?? 0;
  }

  const supabase = createServiceClient();
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
