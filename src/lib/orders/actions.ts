"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getRazorpayConfig, refundRazorpayPayment } from "@/lib/checkout/razorpay";
import { getCancellationInfo } from "@/lib/orders/cancellation";
import { reverseOrderSideEffects } from "@/lib/orders/reversal";
import { ORDER_WITH_ITEMS_SELECT, type OrderWithItems } from "@/lib/data/orders";

export interface TrackOrderResult {
  success: boolean;
  message: string;
  order?: OrderWithItems;
}

// Public order lookup for guests (who have no account and thus no /orders history). Access is
// gated on knowing BOTH the order number AND the email on the order — the email acts as the
// access token. Guest orders have no session, so RLS can't identify the requester; the match is
// enforced here with the service client. The response is intentionally identical whether the
// order doesn't exist or the email doesn't match, so it can't be used to probe which order
// numbers are real.
export async function trackOrder(
  prevState: TrackOrderResult | null,
  formData: FormData,
): Promise<TrackOrderResult> {
  const orderNumber = (formData.get("orderNumber") as string)?.trim().toUpperCase();
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!orderNumber || !email) {
    return { success: false, message: "Please enter both your order number and email." };
  }

  const notFound: TrackOrderResult = {
    success: false,
    message: "We couldn't find an order matching those details. Please check and try again.",
  };

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return notFound;

  // Resolve the email on file: guest orders store guest_email; account orders resolve via the user.
  let orderEmail = order.guest_email?.toLowerCase() ?? null;
  if (!orderEmail && order.user_id) {
    const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
    orderEmail = userData.user?.email?.toLowerCase() ?? null;
  }
  // The customer has since deleted their account; the address they had is kept on the order.
  orderEmail ??= order.former_account_email?.toLowerCase() ?? null;

  if (!orderEmail || orderEmail !== email) return notFound;

  return { success: true, message: "", order: order as OrderWithItems };
}

export interface CancelOrderResult {
  success: boolean;
  message: string;
}

// Customer self-service cancellation, restricted to the order's own signed-in owner. Cancelling
// reverses everything confirming the order applied: refund (if paid), restock, and release the
// coupon use. Eligibility (window + not-yet-shipped) is re-checked here authoritatively — the UI
// check is only for what to render.
export async function cancelOrder(
  prevState: CancelOrderResult | null,
  formData: FormData,
): Promise<CancelOrderResult> {
  const orderId = (formData.get("orderId") as string)?.trim();
  if (!orderId) return { success: false, message: "Order is missing." };

  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { success: false, message: "Please sign in to cancel an order." };

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("id", orderId)
    .single();
  const order = data as OrderWithItems | null;

  // Only the signed-in owner may cancel (guest orders have no user_id and aren't cancellable here).
  if (!order || order.user_id !== userId) {
    return { success: false, message: "Order not found." };
  }

  const info = getCancellationInfo(order);
  if (!info.cancellable) {
    const message =
      info.reason === "shipped"
        ? "This order has already shipped and can no longer be cancelled."
        : info.reason === "terminal"
          ? "This order has already been cancelled."
          : "The cancellation window for this order has passed.";
    return { success: false, message };
  }

  // Refund first when paid — if the refund can't be issued, don't cancel (the money must come back).
  let refundId: string | null = null;
  const wasPaid = order.payment_status === "paid";
  if (wasPaid && order.payment_id && getRazorpayConfig()) {
    try {
      const refund = await refundRazorpayPayment(order.payment_id, Math.round(order.total * 100));
      refundId = refund?.id ?? null;
    } catch (e) {
      console.error("Refund failed during cancel:", e);
      return {
        success: false,
        message: "We couldn't process the refund automatically. Please contact us to cancel this order.",
      };
    }
  }

  // Stock and coupon restore, via the shared helper so this path and the admin one can never
  // drift apart again. It also stamps cancelled_at, which is the claim preventing a double
  // restore if an admin flips the status at the same moment.
  const reversal = await reverseOrderSideEffects(supabase, orderId);
  if (!reversal.reversed) {
    return { success: false, message: "This order has already been cancelled." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: wasPaid ? "refunded" : order.payment_status,
      refund_id: refundId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/account/orders");
  return {
    success: true,
    message: wasPaid
      ? "Your order has been cancelled and a refund has been initiated."
      : "Your order has been cancelled.",
  };
}
