import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveOrderRecipient } from "@/lib/email/recipient";
import { issueInvoiceForOrder } from "@/lib/invoices/issue";
import { renderInvoicePdf, invoiceFileName } from "@/lib/invoices/render";

// PDF generation is Node-only (it reads the font file from disk and uses Node Buffers), so this
// must not be moved to the Edge runtime.
export const runtime = "nodejs";

/**
 * Downloads the tax invoice for an order.
 *
 * Two ways in, because two kinds of buyer need one:
 *
 *   GET  — the signed-in customer the order belongs to, or an admin.
 *   POST — a guest, proving themselves with the order number and the email the
 *          order was placed under. That is the same proof the Track Order page
 *          already requires, and it is submitted as a form rather than a query
 *          string so the address does not end up in browser history or server
 *          access logs.
 *
 * Both answer an identical 404 for "no such order" and for "not yours", so
 * neither can be used to discover which order numbers exist — the same
 * reasoning as trackOrder().
 *
 * The invoice is normally raised the moment payment is confirmed. Issuing it
 * here as well covers orders that predate the feature and any order where
 * issuance failed at fulfilment; the underlying database function is idempotent,
 * so this can never allocate a second number.
 */

const notFound = () => new Response("Not found", { status: 404 });

type OrderLookup = {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  former_account_email: string | null;
  order_number: string;
  payment_status: string;
};

async function findOrder(orderNumber: string): Promise<OrderLookup | null> {
  const service = createServiceClient();
  const { data } = await service
    .from("orders")
    .select("id, user_id, guest_email, former_account_email, order_number, payment_status")
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();
  return data;
}

/** Builds the response once the caller has been shown to be entitled to it. */
async function deliverInvoice(order: OrderLookup): Promise<Response> {
  // An invoice records a payment received; there is nothing to bill for an order
  // that was never paid. Refunded orders keep theirs — the sale did happen, and
  // reversing it is a separate credit note.
  if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
    return new Response("This order has no invoice yet — it has not been paid.", { status: 409 });
  }

  const issued = await issueInvoiceForOrder(order.id);
  if (!issued.ok || !issued.invoice) {
    console.error(`Invoice unavailable for ${order.order_number}: ${issued.message}`);
    return new Response("The invoice could not be prepared. Please contact us.", { status: 500 });
  }

  const pdf = await renderInvoicePdf(issued.invoice);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFileName(issued.invoice.invoice_number)}"`,
      "Content-Length": String(pdf.length),
      // A tax invoice is personal data and must never be held by a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}

/** The signed-in route: the order's own customer, or an admin. */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/invoices/[orderNumber]">,
) {
  const { orderNumber } = await ctx.params;

  const order = await findOrder(orderNumber);
  if (!order) return notFound();

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  let allowed = Boolean(userId && order.user_id && userId === order.user_id);

  if (!allowed && userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    allowed = Boolean(profile?.is_admin);
  }

  if (!allowed) return notFound();

  return deliverInvoice(order);
}

/**
 * The guest route: order number in the path, email in the form body.
 *
 * POST is used for a read on purpose — it keeps the email out of the URL. There
 * is no CSRF concern in doing so: nothing here changes state that a third party
 * could exploit, and a cross-origin form post would deliver the PDF to the
 * visitor's own browser, which the other site cannot read.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/invoices/[orderNumber]">,
) {
  const { orderNumber } = await ctx.params;

  let email: string;
  try {
    const form = await request.formData();
    email = ((form.get("email") as string) ?? "").trim().toLowerCase();
  } catch {
    return notFound();
  }

  if (!email) return notFound();

  const order = await findOrder(orderNumber);
  if (!order) return notFound();

  // Resolves the address whether the order was placed as a guest or by an
  // account holder who is not currently signed in.
  const service = createServiceClient();
  const orderEmail = (await resolveOrderRecipient(service, order))?.toLowerCase() ?? null;

  if (!orderEmail || orderEmail !== email) return notFound();

  return deliverInvoice(order);
}
