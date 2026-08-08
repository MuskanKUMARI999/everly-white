import type { createServiceClient } from "@/lib/supabase/service";
import type { FormResult } from "@/lib/cart/types";

// Ordering and main-photo selection for a product's gallery.
//
// Kept out of actions.ts on purpose: that file carries "use server" and may only export async
// server actions, so nothing in it can be exercised directly. The rules here are subtle enough to
// be worth checking — particularly that repairing the "exactly one main photo" invariant must never
// override a choice the admin made deliberately.

type Client = ReturnType<typeof createServiceClient>;

/**
 * Guarantee that a product with any images has exactly one marked as its main photo.
 *
 * The storefront reads `product_images.find(is_featured)` and only falls back to array order, which
 * PostgREST makes no promise about — so "no image flagged" means an arbitrary card photo.
 *
 * Crucially this only ever *repairs*. An earlier version forced the flag onto whichever image sat
 * lowest, which was fine while position was the only way to choose one; now that the admin can pick
 * explicitly, that would silently undo their pick on the next upload. A product already holding
 * exactly one featured image is left untouched, wherever that image sits in the order.
 */
export async function ensureFeaturedImage(supabase: Client, productId: string) {
  const { data: images } = await supabase
    .from("product_images")
    .select("id, is_featured")
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (!images?.length) return;

  const featured = images.filter((img) => img.is_featured);
  if (featured.length === 1) return;

  // None (a first upload, or the featured image was just deleted) → the first in display order.
  // More than one (only reachable from older data) → keep the earliest and clear the rest.
  const keep = featured[0] ?? images[0];

  await supabase
    .from("product_images")
    .update({ is_featured: false })
    .eq("product_id", productId)
    .neq("id", keep.id);
  await supabase.from("product_images").update({ is_featured: true }).eq("id", keep.id);
}

/** Make one image the product's card photo. */
export async function promoteFeaturedImage(
  supabase: Client,
  productId: string,
  imageId: string,
): Promise<FormResult> {
  // Promote first, demote second — the other order would leave the product with no main photo at
  // all if the promotion then failed, and the storefront would fall back to an arbitrary image.
  // Scoped by product_id as well as id so an image can only be promoted within its own product.
  const { data: promoted, error } = await supabase
    .from("product_images")
    .update({ is_featured: true })
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id");

  if (error) return { success: false, message: error.message };
  if (!promoted?.length) return { success: false, message: "That image could not be found." };

  await supabase
    .from("product_images")
    .update({ is_featured: false })
    .eq("product_id", productId)
    .neq("id", imageId);

  return { success: true, message: "Main photo updated." };
}

/** Shift one image one slot earlier or later in the gallery. */
export async function reorderProductImage(
  supabase: Client,
  productId: string,
  imageId: string,
  direction: "up" | "down",
): Promise<FormResult> {
  const { data: images, error: loadError } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (loadError) return { success: false, message: loadError.message };
  if (!images?.length) return { success: false, message: "No images to reorder." };

  const index = images.findIndex((img) => img.id === imageId);
  if (index === -1) return { success: false, message: "That image could not be found." };

  const target = index + (direction === "down" ? 1 : -1);
  // Already at the end it is being moved toward — nothing to do, and not an error worth showing.
  if (target < 0 || target >= images.length) return { success: true, message: "" };

  const ordered = [...images];
  const [moved] = ordered.splice(index, 1);
  ordered.splice(target, 0, moved);

  // Renumber the whole list rather than swapping two values. Positions can carry gaps (from
  // deletes) or duplicates (from older rows), and a straight swap preserves both; writing the index
  // outright leaves a clean 0..n-1 sequence every time.
  for (const [position, image] of ordered.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ position })
      .eq("id", image.id)
      .eq("product_id", productId);
    if (error) return { success: false, message: error.message };
  }

  return { success: true, message: "Order updated." };
}
