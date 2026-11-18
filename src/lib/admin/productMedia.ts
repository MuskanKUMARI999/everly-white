import type { createServiceClient } from "@/lib/supabase/service";
import type { FormResult } from "@/lib/cart/types";
import { orderProductMedia, type OrderedMedia, type ProductMediaKind } from "@/lib/data/productMedia";

// Gallery ordering across both media tables.
//
// Kept out of actions.ts for the same reason productImages.ts is: that file carries "use server"
// and may only export async server actions, so nothing in it can be exercised directly.
//
// Every write here renumbers the whole merged gallery to a clean 0..n-1 rather than swapping two
// values. Positions can carry gaps (from deletes) or duplicates (from rows written before photos
// and videos shared one sequence), and a straight swap preserves both; writing the index outright
// repairs the sequence as a side effect of any move or upload.

type Client = ReturnType<typeof createServiceClient>;
type OrderRow = { id: string; position: number; created_at: string };
type Entry = OrderedMedia<OrderRow, OrderRow>;

async function loadMediaOrder(
  supabase: Client,
  productId: string,
): Promise<{ ordered: Entry[] } | { error: string }> {
  const [images, videos] = await Promise.all([
    supabase
      .from("product_images")
      .select("id, position, created_at")
      .eq("product_id", productId),
    supabase
      .from("product_videos")
      .select("id, position, created_at")
      .eq("product_id", productId),
  ]);

  if (images.error) return { error: images.error.message };
  if (videos.error) return { error: videos.error.message };

  return { ordered: orderProductMedia(images.data ?? [], videos.data ?? []) };
}

/** Writes `offset + index` back to whichever table each entry came from. */
async function writeMediaOrder(
  supabase: Client,
  productId: string,
  ordered: Entry[],
  offset = 0,
): Promise<string | null> {
  for (const [index, entry] of ordered.entries()) {
    const position = index + offset;
    // Branched rather than parameterised on the table name: the two tables are separate types to
    // supabase-js, and a union of them has no shared update signature.
    const { error } =
      entry.kind === "image"
        ? await supabase
            .from("product_images")
            .update({ position })
            .eq("id", entry.item.id)
            .eq("product_id", productId)
        : await supabase
            .from("product_videos")
            .update({ position })
            .eq("id", entry.item.id)
            .eq("product_id", productId);
    if (error) return error.message;
  }
  return null;
}

/**
 * Slide everything the product already has down by `count` slots, freeing 0..count-1 for a batch
 * about to be inserted.
 *
 * New uploads lead the gallery rather than trailing it. Uploading is the one moment the admin has
 * the new file in mind, and a product with a dozen photos put it out of sight at the bottom of the
 * grid — several arrow presses away from wherever it was actually wanted. Landing at the top costs
 * nothing when it belongs last (the arrows move it) and saves the walk when it belongs first.
 *
 * Legacy numbering is repaired in the same pass, so the batch's 0..count-1 merges cleanly.
 */
export async function makeRoomAtTop(
  supabase: Client,
  productId: string,
  count: number,
): Promise<string | null> {
  if (count <= 0) return null;

  const loaded = await loadMediaOrder(supabase, productId);
  if ("error" in loaded) return loaded.error;
  if (!loaded.ordered.length) return null;

  return writeMediaOrder(supabase, productId, loaded.ordered, count);
}

/** Shift one photo or video one slot earlier or later, past whichever kind is next to it. */
export async function reorderProductMedia(
  supabase: Client,
  productId: string,
  mediaId: string,
  kind: ProductMediaKind,
  direction: "up" | "down",
): Promise<FormResult> {
  const loaded = await loadMediaOrder(supabase, productId);
  if ("error" in loaded) return { success: false, message: loaded.error };

  const { ordered } = loaded;
  if (!ordered.length) return { success: false, message: "Nothing to reorder." };

  const index = ordered.findIndex((entry) => entry.kind === kind && entry.item.id === mediaId);
  if (index === -1) return { success: false, message: "That item could not be found." };

  const target = index + (direction === "down" ? 1 : -1);
  // Already at the end it is being moved toward — nothing to do, and not an error worth showing.
  if (target < 0 || target >= ordered.length) return { success: true, message: "" };

  const next = [...ordered];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);

  const error = await writeMediaOrder(supabase, productId, next);
  if (error) return { success: false, message: error };

  return { success: true, message: "Order updated." };
}
