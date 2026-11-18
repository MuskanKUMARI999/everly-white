import type { createServiceClient } from "@/lib/supabase/service";
import type { FormResult } from "@/lib/cart/types";

// Main-photo selection for a product's gallery. Ordering spans photos *and* videos, so it lives
// in productMedia.ts alongside the merge rule it depends on.
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
