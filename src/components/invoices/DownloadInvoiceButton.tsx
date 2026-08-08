/**
 * Link to an order's tax invoice PDF.
 *
 * A plain anchor rather than a fetch-and-save button: the route already sends
 * `Content-Disposition: attachment` with the right filename, so the browser
 * handles the download natively — no JavaScript needed, and it still works if
 * the page's scripts fail. Authorisation is checked server-side on every
 * request, so rendering this link is never what grants access.
 *
 * Shared by the admin order panel and the customer's own order pages.
 */

type Tone = "solid" | "outline";

const TONES: Record<Tone, string> = {
  solid:
    "bg-brown text-beige-light hover:bg-neutral-500",
  outline:
    "border border-neutral-200 text-neutral-500 hover:border-brown hover:text-brown",
};

export function DownloadInvoiceButton({
  orderNumber,
  paymentStatus,
  tone = "outline",
  label = "Download Invoice",
  className = "",
}: {
  orderNumber: string;
  /** From orders.payment_status. */
  paymentStatus: string;
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  // An invoice records money received, so there is nothing to issue until the
  // payment lands. Refunded orders keep theirs — the sale did happen.
  const available = paymentStatus === "paid" || paymentStatus === "refunded";

  if (!available) {
    return (
      <p className={`font-body text-sm text-neutral-400 ${className}`}>
        The invoice will be available once payment is confirmed.
      </p>
    );
  }

  return (
    <a
      href={`/api/invoices/${encodeURIComponent(orderNumber)}`}
      className={`inline-block px-4 py-2 font-heading text-[13px] uppercase tracking-widest transition-colors ${TONES[tone]} ${className}`}
    >
      {label}
    </a>
  );
}
