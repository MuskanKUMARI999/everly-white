import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

export interface ReversalResult {
  /** False when the order had already been reversed by another path — nothing was restored. */
  reversed: boolean;
  restoredLines: number;
  couponReleased: boolean;
}

/**
 * Undo the side effects that confirming a paid order applied: stock drawn down per line and the
 * coupon use counted at fulfilment. Callers own the money (Razorpay) and the status fields; this
 * function owns only the reversible inventory/coupon bookkeeping.
 *
 * `cancelled_at` doubles as the claim. The conditional UPDATE (`cancelled_at IS NULL`) is atomic
 * at the row level, so if the customer cancels at the same moment an admin flips the status — or
 * an admin simply saves the form twice — only the first caller restores anything. Without that
 * guard, stock would be handed back once per save and the catalogue would drift upward.
 *
 * Mirrors the claim pattern fulfillPaidOrder() uses on the way in.
 */
export async function reverseOrderSideEffects(
  supabase: Client,
  orderId: string,
): Promise<ReversalResult> {
  const idle: ReversalResult = { reversed: false, restoredLines: 0, couponReleased: false };

  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("id, coupon_code, cancelled_at, order_items (product_id, quantity)")
    .eq("id", orderId)
    .single();

  if (loadError || !order) {
    console.error("Reversal: could not load order", orderId, loadError);
    return idle;
  }
  if (order.cancelled_at) return idle;

  // Claim it. If another path got there first this matches zero rows and we do nothing.
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("orders")
    .update({ cancelled_at: now, updated_at: now })
    .eq("id", orderId)
    .is("cancelled_at", null)
    .select("id");

  if (claimError) {
    console.error("Reversal: claim failed for order", orderId, claimError);
    return idle;
  }
  if (!claimed || claimed.length === 0) return idle;

  // Stock back, line by line. A failure here is logged rather than thrown: the claim is already
  // committed, and leaving the order un-cancelled would be worse than a stock count needing a
  // manual nudge.
  let restoredLines = 0;
  for (const item of order.order_items) {
    if (!item.product_id) continue;
    const { error } = await supabase.rpc("increment_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (error) console.error("Reversal: failed to restore stock", item.product_id, error);
    else restoredLines++;
  }

  // Release the coupon use counted when the order was paid.
  let couponReleased = false;
  if (order.coupon_code) {
    const { error } = await supabase.rpc("decrement_coupon_usage", { p_code: order.coupon_code });
    if (error) console.error("Reversal: failed to release coupon", order.coupon_code, error);
    else couponReleased = true;
  }

  return { reversed: true, restoredLines, couponReleased };
}
