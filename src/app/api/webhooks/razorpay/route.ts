import { NextResponse, type NextRequest } from "next/server";
import {
  getRazorpayWebhookSecret,
  verifyRazorpayWebhookSignature,
} from "@/lib/checkout/razorpay";
import { fulfillPaidOrder } from "@/lib/checkout/fulfillment";

interface RazorpayEntity {
  id?: string;
  notes?: Record<string, string> | null;
}

interface RazorpayWebhookEvent {
  event?: string;
  payload?: {
    order?: { entity?: RazorpayEntity };
    payment?: { entity?: RazorpayEntity };
  };
}

// Server-side payment reconciliation. Without this, a confirmed order relies entirely on the
// browser handler running verifyPayment — if the buyer closes the tab after paying, the order is
// stranded as `pending`. Razorpay posts here independently, so the order still gets confirmed.
export async function POST(request: NextRequest) {
  const secret = getRazorpayWebhookSecret();
  if (!secret) {
    // No webhook secret configured — we can't authenticate the caller, so refuse.
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("x-razorpay-signature");
  // The signature covers the exact bytes, so verify against the raw text before parsing.
  const rawBody = await request.text();

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // order.paid carries our notes on the order entity; payment.captured is handled as a fallback.
  if (event.event !== "order.paid" && event.event !== "payment.captured") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const orderEntity = event.payload?.order?.entity;
  const paymentEntity = event.payload?.payment?.entity;
  // We stamped our internal order id into the Razorpay order's notes at creation time.
  const internalOrderId = orderEntity?.notes?.order_id ?? paymentEntity?.notes?.order_id ?? null;
  const paymentId = paymentEntity?.id ?? null;

  if (!internalOrderId) {
    console.error("Razorpay webhook: no internal order id in notes for", event.event);
    // Nothing to retry against — ack so Razorpay stops resending.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const result = await fulfillPaidOrder(internalOrderId, paymentId);
  if (!result.ok) {
    console.error("Razorpay webhook fulfillment failed:", result.message);
    // 500 lets Razorpay retry transient/DB failures; 200 acks non-retryable ones (e.g. not found).
    return NextResponse.json(
      { error: result.message },
      { status: result.retryable ? 500 : 200 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
