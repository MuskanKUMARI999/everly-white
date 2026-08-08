import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getSellerDetails, sellerDetailsProblems } from "@/lib/invoices/sellerDetails";
import { resolveGstState, GST_STATES } from "@/lib/invoices/gstStates";
import { computeTaxBreakdown, type TaxInputItem } from "@/lib/invoices/tax";
import { describePaymentMethod } from "@/lib/invoices/paymentMethod";
import type { Json, Tables } from "@/lib/supabase/database.types";

/**
 * Raises the tax invoice for a paid order.
 *
 * Called from fulfilment the moment a payment is confirmed, and again — lazily —
 * the first time anyone downloads an invoice for an order that predates this
 * feature. Both routes end at the same atomic `issue_invoice` database function,
 * which allocates the serial number and writes the row in one transaction, so
 * calling this twice can never produce two invoices or waste a number.
 *
 * Everything the document says is frozen into the row here. Editing a product,
 * a price or the shop's own address afterwards changes nothing already issued.
 */

/** What gets snapshotted about the seller. */
interface SellerSnapshot {
  legalName: string;
  tradeName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pinCode: string;
  country: string;
  gstin: string;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  invoiceTerms: string | null;
  bankDetails: string | null;
}

/** What gets snapshotted about the buyer. */
interface BuyerSnapshot {
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  paymentReference: string | null;
  /** Coupon used, so the invoice can name the discount rather than just show a figure. */
  couponCode: string | null;
  /**
   * Rule 46(o): a tax invoice must state whether tax is payable on reverse
   * charge, even when the answer is no. It is always no here — reverse charge
   * shifts liability to the buyer in specific notified cases, none of which
   * cover a retail sale of decor to a consumer. Recorded per invoice rather
   * than printed as a constant so that if the client ever takes on a supply
   * where it does apply, past invoices still say what was true at the time.
   */
  reverseCharge: boolean;
}

export interface IssueResult {
  ok: boolean;
  invoice?: Tables<"invoices">;
  message: string;
}

interface ShippingAddress {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
  email?: string;
}

/**
 * The Indian financial year an invoice falls in: 1 April to 31 March, written
 * "2026-27". The serial number restarts each year, so this decides which
 * counter the invoice draws from.
 */
export function financialYearOf(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = January
  const startYear = month >= 3 ? year : year - 1; // April is month 3
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export async function issueInvoiceForOrder(orderId: string): Promise<IssueResult> {
  const supabase = createServiceClient();

  // Already issued? Return it without touching anything. Saves a pointless round
  // trip through the tax engine on every repeat download.
  const { data: existing } = await supabase
    .from("invoices")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) {
    return { ok: true, invoice: existing, message: "Invoice already issued." };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { ok: false, message: "Order not found." };
  }

  // An invoice is raised against a payment. Issuing one for an unpaid order
  // would put a number in the series for money never received.
  if (order.payment_status !== "paid" && order.payment_status !== "refunded") {
    return { ok: false, message: "An invoice is only issued once the order is paid." };
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError || !orderItems || orderItems.length === 0) {
    return { ok: false, message: "The order has no items to invoice." };
  }

  const seller = await getSellerDetails();

  // Logged rather than blocking. A customer should not be told "no invoice"
  // because the shop has not filled in its phone number.
  const sellerProblems = sellerDetailsProblems(seller);
  if (sellerProblems.length > 0) {
    console.warn(`Invoice for order ${order.order_number} — seller details: ${sellerProblems.join("; ")}`);
  }

  // ---------------------------------------------------------------------
  // Place of supply. This decides CGST+SGST against IGST, so it is never
  // guessed: an unrecognised state falls back to the seller's own, which is the
  // conservative choice (it charges CGST+SGST, the treatment for a local sale)
  // and is recorded in the problems log for an admin to correct.
  // ---------------------------------------------------------------------
  const address = (order.shipping_address as ShippingAddress | null) ?? {};
  const sellerState = resolveGstState(seller.state);
  const buyerState = resolveGstState(address.state);

  if (!sellerState) {
    // Cannot happen through the typed constant, but the settings table is free
    // text and could disagree.
    return { ok: false, message: `Seller state "${seller.state}" is not a recognised GST state.` };
  }

  const placeOfSupply = buyerState ?? sellerState;
  const interstate = placeOfSupply.code !== sellerState.code;

  if (!buyerState) {
    console.warn(
      `Invoice for order ${order.order_number} — could not recognise the delivery state ${JSON.stringify(address.state)}; treating the sale as local (${sellerState.name}).`,
    );
  }

  // ---------------------------------------------------------------------
  // Per-item tax classification: the product's own HSN and rate where set,
  // otherwise the shop default.
  // ---------------------------------------------------------------------
  const productIds = [...new Set(orderItems.map((i) => i.product_id).filter(Boolean))] as string[];

  const taxByProduct = new Map<string, { hsn: string | null; rate: number }>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, hsn_code, gst_rate")
      .in("id", productIds);

    for (const p of products ?? []) {
      taxByProduct.set(p.id, {
        hsn: p.hsn_code ?? seller.defaultHsnCode,
        // ?? not ||, so a deliberate 0% rate survives instead of becoming the default.
        rate: p.gst_rate ?? seller.defaultGstRate,
      });
    }
  }

  const taxItems: TaxInputItem[] = orderItems.map((item) => {
    // A product deleted since the order was placed still has to be invoiced —
    // order_items keeps its own copy of the name and price for exactly this
    // reason — so it falls back to the shop default classification.
    const classification = item.product_id ? taxByProduct.get(item.product_id) : undefined;
    return {
      description: item.product_name,
      hsnCode: classification?.hsn ?? seller.defaultHsnCode,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.total,
      gstRate: classification?.rate ?? seller.defaultGstRate,
    };
  });

  const breakdown = computeTaxBreakdown({
    items: taxItems,
    subtotal: order.subtotal,
    discount: order.discount_amount,
    shipping: order.shipping_amount,
    total: order.total,
    interstate,
  });

  if (breakdown.problems.length > 0) {
    console.warn(
      `Invoice for order ${order.order_number} — tax breakdown: ${breakdown.problems.join("; ")}`,
    );
  }

  // ---------------------------------------------------------------------
  // Snapshots.
  // ---------------------------------------------------------------------
  const sellerStateCode =
    GST_STATES.find((s) => s.name === sellerState.name)?.code ?? sellerState.code;

  const sellerSnapshot: SellerSnapshot = {
    legalName: seller.legalName,
    tradeName: seller.tradeName,
    addressLine1: seller.addressLine1,
    addressLine2: seller.addressLine2,
    city: seller.city,
    state: sellerState.name,
    stateCode: sellerStateCode,
    pinCode: seller.pinCode,
    country: seller.country,
    gstin: seller.gstin,
    pan: seller.pan,
    email: seller.email,
    phone: seller.phone,
    website: seller.website,
    logoUrl: seller.logoUrl,
    signatureUrl: seller.signatureUrl,
    invoiceTerms: seller.invoiceTerms,
    bankDetails: seller.bankDetails,
  };

  const buyerSnapshot: BuyerSnapshot = {
    name: address.full_name?.trim() || "Customer",
    addressLine1: address.line1 ?? null,
    addressLine2: address.line2 ?? null,
    city: address.city ?? null,
    // The state as the buyer wrote it, not the canonical name — the invoice
    // should reproduce the delivery address as given. The canonical name is
    // recorded separately as the place of supply.
    state: address.state ?? null,
    pinCode: address.pin_code ?? null,
    country: address.country ?? "India",
    phone: address.phone ?? null,
    email: order.guest_email ?? address.email ?? null,
    orderNumber: order.order_number,
    orderDate: order.created_at ?? new Date().toISOString(),
    paymentMethod: describePaymentMethod(order.payment_details),
    paymentReference: order.payment_id,
    couponCode: order.coupon_code,
    reverseCharge: false,
  };

  const issuedAt = new Date();

  const { data: rows, error: issueError } = await supabase.rpc("issue_invoice", {
    p_order_id: orderId,
    p_financial_year: financialYearOf(issuedAt),
    p_prefix: seller.invoicePrefix,
    p_seller: sellerSnapshot as unknown as Json,
    p_buyer: buyerSnapshot as unknown as Json,
    p_place_of_supply: placeOfSupply.name,
    p_place_of_supply_code: placeOfSupply.code,
    p_is_interstate: interstate,
    p_line_items: breakdown.lines as unknown as Json,
    p_totals: breakdown.totals as unknown as Json,
  });

  if (issueError) {
    return { ok: false, message: issueError.message };
  }

  const invoice = rows?.[0];
  if (!invoice) {
    return { ok: false, message: "The database did not return an invoice." };
  }

  return { ok: true, invoice, message: `Invoice ${invoice.invoice_number} issued.` };
}
