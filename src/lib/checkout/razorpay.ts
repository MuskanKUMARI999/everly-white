import { createHmac, timingSafeEqual } from "crypto";

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

// The webhook secret is configured separately from the API keys, in the Razorpay dashboard when
// you register the webhook endpoint. It signs the raw webhook body (not the key secret).
export function getRazorpayWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET || null;
}

export async function createRazorpayOrder(
  amountInPaisa: number,
  receipt: string,
  notes: Record<string, string> = {},
) {
  const config = getRazorpayConfig();
  if (!config) return null;

  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountInPaisa,
      currency: "INR",
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const error = (await res.json()) as { error?: { description?: string } };
    console.error("Razorpay order creation failed:", error);
    throw new Error(error.error?.description || "Razorpay order creation failed");
  }

  return (await res.json()) as {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
}

// Refund a captured payment. Pass amountInPaisa for an exact (full) refund; omit for Razorpay's
// default full refund. Returns the refund record (its id is stored on the order for reconciliation).
export async function refundRazorpayPayment(paymentId: string, amountInPaisa?: number) {
  const config = getRazorpayConfig();
  if (!config) return null;

  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");

  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(amountInPaisa ? { amount: amountInPaisa } : {}),
  });

  if (!res.ok) {
    const error = (await res.json()) as { error?: { description?: string } };
    console.error("Razorpay refund failed:", error);
    throw new Error(error.error?.description || "Razorpay refund failed");
  }

  return (await res.json()) as { id: string; status: string; amount: number };
}

// What the gateway knows about how a payment was actually made. `payment_method` on the order only
// ever says 'razorpay' — the gateway, not the instrument — so the invoice's "paid by" line comes
// from here instead.
export interface RazorpayPaymentDetails {
  /** 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi' | 'paylater' */
  method: string | null;
  /** 'credit' | 'debit' | 'prepaid' — cards only. */
  cardType: string | null;
  /** 'Visa', 'MasterCard', … */
  cardNetwork: string | null;
  last4: string | null;
  /** Issuing bank, for net banking. */
  bank: string | null;
  wallet: string | null;
  /** UPI handle. */
  vpa: string | null;
}

// Reads back how a captured payment was made. Returns null rather than throwing on any failure:
// this runs inside order fulfilment, and a gateway hiccup must never cost a customer their
// confirmed order. A missing result just means the invoice says "Online Payment".
//
// Cardholder name and the card id are intentionally not carried over — the invoice does not need
// them, and there is no reason to store card data that will never be read.
export async function fetchRazorpayPaymentDetails(
  paymentId: string,
): Promise<RazorpayPaymentDetails | null> {
  const config = getRazorpayConfig();
  if (!config) return null;

  // Simulated checkouts mint their own ids; there is nothing at the gateway to look up.
  if (!paymentId.startsWith("pay_")) return null;

  try {
    const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
      console.error(`Razorpay payment lookup failed for ${paymentId}: HTTP ${res.status}`);
      return null;
    }

    const body = (await res.json()) as {
      method?: string;
      bank?: string | null;
      wallet?: string | null;
      vpa?: string | null;
      card?: { type?: string | null; network?: string | null; last4?: string | null } | null;
    };

    return {
      method: body.method ?? null,
      cardType: body.card?.type ?? null,
      cardNetwork: body.card?.network ?? null,
      last4: body.card?.last4 ?? null,
      bank: body.bank ?? null,
      wallet: body.wallet ?? null,
      vpa: body.vpa ?? null,
    };
  } catch (error) {
    console.error(`Razorpay payment lookup errored for ${paymentId}:`, error);
    return null;
  }
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string,
) {
  const hmac = createHmac("sha256", keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  const expected = hmac.digest("hex");
  return expected === signature;
}

// Razorpay signs the webhook with HMAC-SHA256 over the exact raw request body, using the webhook
// secret. Compared timing-safely since the signature is attacker-supplied.
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string,
) {
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  let signatureBuf: Buffer;
  try {
    signatureBuf = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}
