import type { Json } from "@/lib/supabase/database.types";

/**
 * Turns the gateway's payment record into the "Paid by" line on the invoice.
 *
 * The client asked for the means of payment to be stated — "via credit / debit
 * card" — which orders.payment_method cannot supply, since it only ever holds
 * 'razorpay'. The real instrument is read back from the gateway at fulfilment
 * and stored on orders.payment_details; this renders it.
 *
 * Formatting lives here rather than in the stored data so the wording can be
 * revised without rewriting rows. Invoices already issued keep the wording they
 * were raised with, because they hold their own frozen copy.
 */

interface StoredPaymentDetails {
  method?: string | null;
  cardType?: string | null;
  cardNetwork?: string | null;
  last4?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
}

/** Sentence-cases a gateway value like 'debit' or 'paytm' for display. */
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

/**
 * Describes how an order was paid.
 *
 * Falls back to "Online Payment (Prepaid)" whenever the instrument is unknown —
 * true of every order placed before this was added, and of anything paid through
 * the simulated checkout. That is accurate rather than evasive: the money was
 * taken online and in advance, we simply cannot name the card.
 */
export function describePaymentMethod(details: Json | null | undefined): string {
  const fallback = "Online Payment (Prepaid)";

  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return fallback;
  }

  const d = details as StoredPaymentDetails;
  if (!d.method) return fallback;

  switch (d.method) {
    case "card": {
      // 'credit' / 'debit' is the part the client actually asked to see.
      const kind = d.cardType ? `${titleCase(d.cardType)} Card` : "Card";
      const trail = [d.cardNetwork, d.last4 ? `••••${d.last4}` : null]
        .filter(Boolean)
        .join(" ");
      return trail ? `${kind} — ${trail}` : kind;
    }

    case "upi":
      return d.vpa ? `UPI — ${d.vpa}` : "UPI";

    case "netbanking":
      return d.bank ? `Net Banking — ${d.bank}` : "Net Banking";

    case "wallet":
      return d.wallet ? `Wallet — ${titleCase(d.wallet)}` : "Wallet";

    case "emi":
      return "EMI";

    case "paylater":
      return "Pay Later";

    default:
      // An instrument Razorpay added after this was written. Showing the raw
      // value is more useful than pretending we do not know.
      return titleCase(d.method);
  }
}
