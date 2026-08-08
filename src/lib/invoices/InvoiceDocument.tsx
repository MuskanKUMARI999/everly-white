import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { INVOICE_FONT, rupeePrefix } from "@/lib/invoices/pdfFont";
import { logoHeightFor } from "@/lib/invoices/pdfLogo";
import { formatPaise } from "@/lib/invoices/tax";
import type { TaxLine, TaxRateSummaryRow, TaxTotals } from "@/lib/invoices/tax";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * The printed tax invoice.
 *
 * Everything rendered here comes from the invoice ROW, never from live tables —
 * the row holds a frozen copy of the seller, the buyer and every figure as they
 * stood when the invoice was raised. That is what stops a later price edit or a
 * change of shop address rewriting a document already sent to a customer.
 *
 * Only one font weight is available (see pdfFont.ts), so emphasis comes from
 * size, letter spacing, uppercase labels, rules and tinted bands.
 */

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
  invoiceTerms: string | null;
  bankDetails: string | null;
}

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
  /** Optional: invoices raised before these were recorded have no value. */
  couponCode?: string | null;
  reverseCharge?: boolean;
}

// Brand palette, taken from globals.css so the document sits with the site.
const INK = "#1e1e1e";
const MUTED = "#5d5d5d";
const FAINT = "#919191";
const RULE = "#dbdbdb";
const BAND = "#f6f3ef";

/** Printed width of the wordmark; its height follows the artwork's own ratio. */
const LOGO_WIDTH = 150;

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    // Was 64, which left room for a footer pinned to the bottom of every page.
    // The page number is now the only fixed element and shows solely on
    // multi-page invoices, so that reserve was pushing an ordinary two-item
    // invoice onto a second page with nothing on it but the sign-off.
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontFamily: INVOICE_FONT,
    fontSize: 9,
    color: INK,
    lineHeight: 1.5,
  },

  // Header ---------------------------------------------------------------
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  // Explicit width AND height: an Image with both reserves its space in the
  // column, which is what stops anything below riding up over it. marginBottom
  // is deliberate separation on top of that, not decoration.
  logo: { width: LOGO_WIDTH, height: logoHeightFor(LOGO_WIDTH), marginBottom: 4 },
  // Every text style below carries an explicit lineHeight. Without one they
  // inherit the page's 1.5, and at large sizes with letterSpacing the measured
  // line box came out shorter than the glyphs actually drawn — which is why the
  // tagline printed on top of the wordmark rather than beneath it. Stating the
  // line height per style keeps each block's height predictable.
  wordmark: { fontSize: 18, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1.3 },
  wordmarkSub: {
    fontSize: 7,
    letterSpacing: 2,
    color: FAINT,
    textTransform: "uppercase",
    lineHeight: 1.4,
    marginTop: 6,
  },
  docTitle: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "right",
    lineHeight: 1.3,
  },
  docMeta: { fontSize: 9, color: MUTED, textAlign: "right", lineHeight: 1.4, marginTop: 3 },

  hr: { borderBottomWidth: 0.75, borderBottomColor: INK, marginTop: 12, marginBottom: 14 },
  hrFaint: { borderBottomWidth: 0.5, borderBottomColor: RULE, marginVertical: 8 },

  // Party blocks ---------------------------------------------------------
  columns: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  label: {
    fontSize: 7,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: FAINT,
    marginBottom: 4,
  },
  partyName: { fontSize: 10.5, marginBottom: 2 },
  line: { color: MUTED },
  strong: { color: INK },

  // Line-item table ------------------------------------------------------
  tableHead: {
    flexDirection: "row",
    backgroundColor: BAND,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  th: { fontSize: 7, letterSpacing: 1, textTransform: "uppercase", color: MUTED },
  // Widths are tuned against A4 minus 40pt padding each side (515pt usable).
  // The money columns were trimmed when the quantity column grew to fit its
  // unit code, so the description keeps its room.
  cellNum: { width: 16 },
  cellDesc: { flex: 1 },
  cellHsn: { width: 50 },
  cellQty: { width: 44, textAlign: "right" },
  cellRate: { width: 52, textAlign: "right" },
  cellTaxable: { width: 56, textAlign: "right" },
  cellTaxPct: { width: 30, textAlign: "right" },
  cellTax: { width: 52, textAlign: "right" },
  cellAmount: { width: 60, textAlign: "right" },

  // Totals ---------------------------------------------------------------
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totals: { width: 250 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  totalLabel: { color: MUTED },
  totalsDivider: { borderTopWidth: 0.5, borderTopColor: RULE, marginVertical: 4 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: BAND,
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  grandLabel: { fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  grandValue: { fontSize: 12 },

  words: { marginTop: 10, fontSize: 9 },

  // Summary --------------------------------------------------------------
  summaryHead: {
    flexDirection: "row",
    backgroundColor: BAND,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  summaryRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },

  // Footer ---------------------------------------------------------------
  footer: { marginTop: 14, flexDirection: "row", justifyContent: "space-between" },
  signature: { width: 170, alignItems: "center" },
  signatureRule: {
    borderTopWidth: 0.5,
    borderTopColor: INK,
    width: "100%",
    marginTop: 34,
    paddingTop: 4,
  },
  note: { fontSize: 7.5, color: FAINT, marginTop: 3 },

  // Closing block. Sits in normal flow rather than being pinned to the page
  // bottom, so on a multi-page invoice it appears once, after the last line —
  // a sign-off repeated on every page stops reading as a sign-off.
  closing: { marginTop: 16, alignItems: "center" },
  closingRule: { borderTopWidth: 0.5, borderTopColor: RULE, width: 110, marginBottom: 11 },
  closingLine: { fontSize: 8, color: MUTED, lineHeight: 1.55, textAlign: "center" },
  closingWeb: {
    fontSize: 7.5,
    color: FAINT,
    letterSpacing: 1,
    lineHeight: 1.5,
    marginTop: 7,
    textAlign: "center",
  },
  pageFoot: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: FAINT,
    letterSpacing: 0.5,
  },
});

function formatDate(iso: string): string {
  // Fixed, unambiguous form — an invoice should not read differently depending
  // on where it is opened.
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function InvoiceDocument({
  invoice,
  hasFont,
  logo,
}: {
  invoice: Tables<"invoices">;
  hasFont: boolean;
  /** Data URL for the brand wordmark, or null to fall back to type. */
  logo: string | null;
}) {
  const seller = invoice.seller as unknown as SellerSnapshot;
  const buyer = invoice.buyer as unknown as BuyerSnapshot;
  const lines = invoice.line_items as unknown as TaxLine[];
  const totals = invoice.totals as unknown as TaxTotals;
  const summary = buildSummary(lines);

  const rs = rupeePrefix(hasFont);
  const money = (paise: number) => `${rs}${formatPaise(paise)}`;

  const interstate = invoice.is_interstate;

  // With neither a discount nor a delivery charge, the gross amount and the
  // taxable-plus-tax already agree, so the extra rows would only add noise.
  const hasAdjustments = totals.discountPaise > 0 || totals.shippingPaise > 0;

  return (
    <Document
      title={`Tax Invoice ${invoice.invoice_number}`}
      author={seller.legalName}
      subject={`Tax invoice for order ${buyer.orderNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* ---------------------------------------------------------- */}
        <View style={styles.header}>
          <View>
            {/* The real wordmark artwork, falling back to type if the file cannot
                be read — better a plain name than an empty corner. */}
            {logo ? (
              // react-pdf's Image is not an HTML img and accepts no alt prop, so the
              // accessibility rule below cannot apply here — it just cannot tell the
              // two apart by name.
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logo} style={styles.logo} />
            ) : (
              <Text style={styles.wordmark}>{seller.tradeName ?? seller.legalName}</Text>
            )}
            <Text style={styles.wordmarkSub}>Handcrafted Decor</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>Tax Invoice</Text>
            <Text style={styles.docMeta}>{invoice.invoice_number}</Text>
            <Text style={styles.docMeta}>{formatDate(invoice.issued_at)}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        {/* Seller / buyer -------------------------------------------- */}
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.label}>Sold By</Text>
            <Text style={styles.partyName}>{seller.legalName}</Text>
            <Text style={styles.line}>{seller.addressLine1}</Text>
            {seller.addressLine2 ? <Text style={styles.line}>{seller.addressLine2}</Text> : null}
            <Text style={styles.line}>
              {seller.city}, {seller.state} {seller.pinCode}
            </Text>
            <Text style={styles.line}>{seller.country}</Text>
            <Text style={[styles.strong, { marginTop: 4 }]}>GSTIN: {seller.gstin}</Text>
            {seller.pan ? <Text style={styles.line}>PAN: {seller.pan}</Text> : null}
            {seller.phone ? <Text style={styles.line}>{seller.phone}</Text> : null}
            {seller.email ? <Text style={styles.line}>{seller.email}</Text> : null}
            {/* The website is deliberately NOT repeated here — it sits in the
                closing block at the foot of the page, and printing it twice on a
                single-page document reads as an oversight. */}
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Billed &amp; Shipped To</Text>
            <Text style={styles.partyName}>{buyer.name}</Text>
            {buyer.addressLine1 ? <Text style={styles.line}>{buyer.addressLine1}</Text> : null}
            {buyer.addressLine2 ? <Text style={styles.line}>{buyer.addressLine2}</Text> : null}
            <Text style={styles.line}>
              {[buyer.city, buyer.state, buyer.pinCode].filter(Boolean).join(", ")}
            </Text>
            <Text style={styles.line}>{buyer.country}</Text>
            {buyer.phone ? <Text style={styles.line}>{buyer.phone}</Text> : null}
            {buyer.email ? <Text style={styles.line}>{buyer.email}</Text> : null}
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Order Details</Text>
            <Text style={styles.line}>
              Order No: <Text style={styles.strong}>{buyer.orderNumber}</Text>
            </Text>
            <Text style={styles.line}>Order Date: {formatDate(buyer.orderDate)}</Text>
            <Text style={[styles.line, { marginTop: 4 }]}>
              Place of Supply: <Text style={styles.strong}>{invoice.place_of_supply}</Text> (
              {invoice.place_of_supply_code})
            </Text>
            <Text style={styles.line}>
              Supply Type: {interstate ? "Inter-State" : "Intra-State"}
            </Text>
            {/* Rule 46(o) requires this to be stated either way, not omitted when it is "No". */}
            <Text style={styles.line}>
              Reverse Charge: {buyer.reverseCharge ? "Yes" : "No"}
            </Text>
            <Text style={[styles.line, { marginTop: 4 }]}>Paid By: {buyer.paymentMethod}</Text>
            {buyer.paymentReference ? (
              <Text style={styles.line}>Ref: {buyer.paymentReference}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.hrFaint} />

        {/* Line items ------------------------------------------------- */}
        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.cellNum]}>#</Text>
          <Text style={[styles.th, styles.cellDesc]}>Description</Text>
          <Text style={[styles.th, styles.cellHsn]}>HSN</Text>
          <Text style={[styles.th, styles.cellQty]}>Qty</Text>
          <Text style={[styles.th, styles.cellRate]}>Rate</Text>
          <Text style={[styles.th, styles.cellTaxable]}>Taxable</Text>
          <Text style={[styles.th, styles.cellTaxPct]}>{interstate ? "IGST" : "GST"}</Text>
          <Text style={[styles.th, styles.cellTax]}>Tax</Text>
          <Text style={[styles.th, styles.cellAmount]}>Amount</Text>
        </View>

        {lines.map((line, i) => (
          <View key={i} style={styles.tableRow} wrap={false}>
            <Text style={styles.cellNum}>{i + 1}</Text>
            <View style={styles.cellDesc}>
              <Text>{line.description}</Text>
              {line.discountPaise > 0 ? (
                <Text style={styles.note}>less discount {money(line.discountPaise)}</Text>
              ) : null}
              {line.shippingPaise > 0 ? (
                <Text style={styles.note}>incl. delivery {money(line.shippingPaise)}</Text>
              ) : null}
            </View>
            <Text style={styles.cellHsn}>{line.hsnCode ?? "—"}</Text>
            {/* Quantity carries its unit code — Rule 46(h) asks for both. */}
            <Text style={styles.cellQty}>
              {line.quantity} {line.unit ?? "NOS"}
            </Text>
            <Text style={styles.cellRate}>{formatPaise(line.unitPricePaise)}</Text>
            <Text style={styles.cellTaxable}>{formatPaise(line.taxablePaise)}</Text>
            <Text style={styles.cellTaxPct}>{line.gstRate}%</Text>
            <Text style={styles.cellTax}>{formatPaise(line.totalTaxPaise)}</Text>
            <Text style={styles.cellAmount}>{formatPaise(line.inclusivePaise)}</Text>
          </View>
        ))}

        {/* Totals ------------------------------------------------------ */}
        <View style={styles.totalsWrap}>
          {/* Order matters here. The discount is already inside the taxable value —
              GST is charged on the discounted amount — so it has to appear ABOVE
              the taxable line. Listed underneath it reads as a second deduction
              and the column stops adding up on the page.

              The sum a reader can follow, top to bottom:
                gross - discount + delivery = the amount split into taxable + tax
                taxable + tax + round off   = total */}
          <View style={styles.totals}>
            {hasAdjustments ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Gross Amount</Text>
                  <Text>{money(totals.grossPaise)}</Text>
                </View>

                {totals.discountPaise > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      Discount{buyer.couponCode ? ` (${buyer.couponCode})` : ""}
                    </Text>
                    <Text>-{money(totals.discountPaise)}</Text>
                  </View>
                ) : null}

                {totals.shippingPaise > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Delivery</Text>
                    <Text>{money(totals.shippingPaise)}</Text>
                  </View>
                ) : null}

                <View style={styles.totalsDivider} />
              </>
            ) : null}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxable Value</Text>
              <Text>{money(totals.taxablePaise)}</Text>
            </View>

            {interstate ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST</Text>
                <Text>{money(totals.igstPaise)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST</Text>
                  <Text>{money(totals.cgstPaise)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST</Text>
                  <Text>{money(totals.sgstPaise)}</Text>
                </View>
              </>
            )}

            {totals.roundOffPaise !== 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Round Off</Text>
                <Text>{money(totals.roundOffPaise)}</Text>
              </View>
            ) : null}

            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandValue}>{money(totals.grandTotalPaise)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.words}>
          <Text style={styles.label}>Amount in Words: </Text>
          {totals.amountInWords}
        </Text>

        <View style={styles.hrFaint} />

        {/* HSN-wise summary -------------------------------------------- */}
        <Text style={styles.label}>Tax Summary</Text>
        <View style={styles.summaryHead}>
          <Text style={[styles.th, { flex: 1 }]}>HSN</Text>
          <Text style={[styles.th, { width: 50, textAlign: "right" }]}>Rate</Text>
          <Text style={[styles.th, { width: 80, textAlign: "right" }]}>Taxable</Text>
          {interstate ? (
            <Text style={[styles.th, { width: 80, textAlign: "right" }]}>IGST</Text>
          ) : (
            <>
              <Text style={[styles.th, { width: 80, textAlign: "right" }]}>CGST</Text>
              <Text style={[styles.th, { width: 80, textAlign: "right" }]}>SGST</Text>
            </>
          )}
          <Text style={[styles.th, { width: 80, textAlign: "right" }]}>Total Tax</Text>
        </View>
        {summary.map((row, i) => (
          <View key={i} style={styles.summaryRow}>
            <Text style={{ flex: 1 }}>{row.hsnCode ?? "—"}</Text>
            <Text style={{ width: 50, textAlign: "right" }}>{row.gstRate}%</Text>
            <Text style={{ width: 80, textAlign: "right" }}>{formatPaise(row.taxablePaise)}</Text>
            {interstate ? (
              <Text style={{ width: 80, textAlign: "right" }}>{formatPaise(row.igstPaise)}</Text>
            ) : (
              <>
                <Text style={{ width: 80, textAlign: "right" }}>{formatPaise(row.cgstPaise)}</Text>
                <Text style={{ width: 80, textAlign: "right" }}>{formatPaise(row.sgstPaise)}</Text>
              </>
            )}
            <Text style={{ width: 80, textAlign: "right" }}>{formatPaise(row.totalTaxPaise)}</Text>
          </View>
        ))}

        {/* Footer ------------------------------------------------------ */}
        <View style={styles.footer}>
          <View style={{ flex: 1, paddingRight: 24 }}>
            <Text style={styles.label}>Declaration</Text>
            <Text style={styles.note}>
              All prices are inclusive of GST. This is a computer-generated invoice and is valid
              without a physical signature.
            </Text>
            {seller.invoiceTerms ? (
              <Text style={[styles.note, { marginTop: 4 }]}>{seller.invoiceTerms}</Text>
            ) : null}
            {seller.bankDetails ? (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}>Bank Details</Text>
                <Text style={styles.note}>{seller.bankDetails}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.signature}>
            <Text style={styles.label}>For {seller.legalName}</Text>
            <View style={styles.signatureRule}>
              <Text style={{ textAlign: "center", fontSize: 8, color: MUTED }}>
                Authorised Signatory
              </Text>
            </View>
          </View>
        </View>

        {/* Sign-off. Kept warm but brief: this is the last thing the customer
            reads, and it is still a tax document. wrap={false} so it never
            splits across a page break. */}
        <View style={styles.closing} wrap={false}>
          <View style={styles.closingRule} />
          <Text style={styles.closingLine}>Thank you for choosing Everly White.</Text>
          <Text style={styles.closingLine}>We hope it finds its place in your home.</Text>
          {seller.website ? <Text style={styles.closingWeb}>{seller.website}</Text> : null}
        </View>

        {/* Page number only, and only when there is more than one page — on a
            single-page invoice "Page 1 of 1" is noise. */}
        <Text
          style={styles.pageFoot}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ""
          }
          fixed
        />
      </Page>
    </Document>
  );
}

/**
 * Rebuilds the HSN-wise summary from the frozen lines rather than storing it.
 * It is pure aggregation of figures that are already fixed, so deriving it keeps
 * one source of truth and cannot drift from the lines above it.
 */
function buildSummary(lines: TaxLine[]): TaxRateSummaryRow[] {
  const groups = new Map<string, TaxRateSummaryRow>();
  for (const line of lines) {
    const key = `${line.hsnCode ?? ""}|${line.gstRate}`;
    const row = groups.get(key) ?? {
      hsnCode: line.hsnCode,
      gstRate: line.gstRate,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalTaxPaise: 0,
    };
    row.taxablePaise += line.taxablePaise;
    row.cgstPaise += line.cgstPaise;
    row.sgstPaise += line.sgstPaise;
    row.igstPaise += line.igstPaise;
    row.totalTaxPaise += line.totalTaxPaise;
    groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => a.gstRate - b.gstRate);
}
