import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { sendOrderConfirmationEmail } from "@/lib/email/orderConfirmation";
import { resolveOrderRecipient } from "@/lib/email/recipient";
import { sendNewOrderAlert } from "@/lib/email/adminAlerts";
import { incrementCouponUsage } from "@/lib/coupons/validate";
import { fetchRazorpayPaymentDetails } from "@/lib/checkout/razorpay";
import { issueInvoiceForOrder } from "@/lib/invoices/issue";
import type { Json } from "@/lib/supabase/database.types";

export interface FulfillResult {
  ok: boolean;
  message: string;
  /** Whether a caller (e.g. a webhook) should retry — true only for transient/DB failures. */
  retryable?: boolean;
}

// Transitions an order to paid/confirmed exactly once, then decrements stock and sends the
// confirmation email. Shared by the browser verify flow and the Razorpay webhook so a payment is
// reconciled regardless of which reports it first (e.g. the buyer closes the tab before the
// browser callback runs — the webhook still confirms the order server-side).
//
// The "mark paid" step is an atomic conditional UPDATE (only rows not already paid), which acts as
// a claim: if the browser callback and the webhook fire concurrently, exactly one wins the claim
// and runs the side effects (stock decrement, email); the other sees zero rows and no-ops. This is
// what prevents double-decrementing stock or sending two confirmation emails.
export async function fulfillPaidOrder(
  orderId: string,
  paymentId: string | null,
): Promise<FulfillResult> {
  const supabase = createServiceClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    // Not found isn't transient — a webhook shouldn't keep retrying it.
    return { ok: false, message: "Order not found.", retryable: false };
  }

  const { data: claimed, error: claimError } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      payment_id: paymentId,
      status: "confirmed",
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id");

  if (claimError) {
    return { ok: false, message: claimError.message, retryable: true };
  }

  // Lost the race (or already paid on a prior call) — the winner handled the side effects.
  if (!claimed || claimed.length === 0) {
    return { ok: true, message: "Order already confirmed." };
  }

  // Ask the gateway how the customer actually paid, so the invoice can say "Debit Card — Visa
  // ••••1111" rather than the useless "razorpay" that payment_method holds. Best-effort: the helper
  // swallows its own failures and returns null, and a null simply prints as "Online Payment".
  let paymentDetails: Json | null = null;
  if (paymentId) {
    const details = await fetchRazorpayPaymentDetails(paymentId);
    if (details) {
      paymentDetails = details as unknown as Json;
      const { error: detailsError } = await supabase
        .from("orders")
        .update({ payment_details: paymentDetails })
        .eq("id", orderId);
      if (detailsError) {
        console.error(`Failed to store payment details for order ${orderId}:`, detailsError);
      }
    }
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  // Draw down stock now that payment is confirmed. Atomic per-row via RPC so concurrent orders
  // can't oversell; a failure here shouldn't unwind an already-confirmed order, so we log on.
  for (const item of orderItems ?? []) {
    if (!item.product_id) continue;
    const { data: newStock, error: stockError } = await supabase.rpc("decrement_product_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
    if (stockError) {
      console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError);
    } else if (newStock === 0) {
      console.warn(`Product ${item.product_id} is now out of stock.`);
    }
  }

  // Count the coupon only now that payment is confirmed (never for abandoned orders). Runs exactly
  // once because the atomic claim above lets only one caller reach this point per order.
  if (order.coupon_code) {
    await incrementCouponUsage(order.coupon_code);
  }

  const recipientEmail = await resolveOrderRecipient(supabase, order);

  const paidOrder = {
    ...order,
    payment_status: "paid" as const,
    status: "confirmed" as const,
    payment_details: paymentDetails,
  };

  // Raise the tax invoice. This sits inside the same one-time claim as everything else above, so
  // the invoice number is allocated exactly once per order however many times payment is reported.
  //
  // Failure is logged, not propagated: the payment has already been taken and the order confirmed,
  // and unwinding that over an invoice would be far worse than issuing it late. Anything not
  // invoiced here is picked up on first download instead.
  await issueInvoiceForOrder(orderId).catch((e) => {
    console.error(`Failed to issue invoice for order ${orderId}:`, e);
  });

  if (recipientEmail) {
    await sendOrderConfirmationEmail({
      to: recipientEmail,
      order: paidOrder,
      items: orderItems ?? [],
    }).catch((e) => {
      console.error("Failed to send order confirmation email:", e);
    });
  }

  // Owner notification. Runs inside the same one-time claim as the customer email above, so a
  // concurrent webhook and browser callback cannot produce two alerts for one order.
  await sendNewOrderAlert({
    order: paidOrder,
    items: orderItems ?? [],
    customerEmail: recipientEmail,
  }).catch((e) => {
    console.error("Failed to send new order admin alert:", e);
  });

  return { ok: true, message: "Payment successful. Order confirmed." };
}
