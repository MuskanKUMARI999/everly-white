import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import {
  gstinMatchesState,
  hasValidGstinChecksum,
  isValidGstinFormat,
  type GstStateName,
} from "@/lib/invoices/gstStates";

/**
 * Who the invoice is issued BY.
 *
 * These are hardcoded by decision — the client's registration details change
 * about once a decade, and keeping them out of the admin panel keeps the GSTIN,
 * PAN and bank details off every admin's screen.
 *
 * The `business_settings` table still exists and still wins where it has a
 * value (see `getSellerDetails`), so if the client ever wants to edit these
 * themselves it is a matter of building the settings form — no migration, no
 * change to any invoice code, and nothing to move.
 *
 * Editing this file does NOT alter invoices already issued: each invoice stores
 * its own copy of the seller block at the moment it was raised, which is what a
 * tax document requires.
 */
export interface SellerDetails {
  legalName: string;
  tradeName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  /** Typed against the canonical list, so a misspelling fails to compile. */
  state: GstStateName;
  pinCode: string;
  country: string;
  gstin: string;
  pan: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  /** Path under /public, or an absolute URL. Printed at the top of the invoice. */
  logoUrl: string | null;
  signatureUrl: string | null;
  invoicePrefix: string;
  /** Applied to any product with no rate of its own. */
  defaultGstRate: number;
  defaultHsnCode: string | null;
  invoiceTerms: string | null;
  bankDetails: string | null;
}

// ---------------------------------------------------------------------------
// The client's registration details, supplied 2026-08-05.
//
// The GSTIN was verified three ways before being committed here: it matches the
// 15-character format, its "18" prefix is Assam's state code and agrees with the
// address below, and its final character passes the GST check-digit algorithm
// (see hasValidGstinChecksum). The PAN and the proprietorship status are read
// out of the GSTIN itself — characters 3–12 are the PAN, and the "P" at
// position 4 of a PAN denotes an individual/proprietor.
//
// Items still marked TODO are not blocking, but each one either leaves a blank
// on the printed invoice or falls back to a placeholder rate.
// ---------------------------------------------------------------------------
export const SELLER: SellerDetails = {
  // Confirmed by the client 2026-08-05: legal name and trade name are the same,
  // so the invoice prints one name rather than a "trading as" line.
  legalName: "Everly White",
  tradeName: "Everly White",

  // Client confirmed 2026-08-07 that this matches the GST registration
  // certificate exactly. Do not "tidy" the wording — it has to agree with the
  // certificate, not read nicely.
  addressLine1: "C/O A Bora, Midas Residency, Block A, 2B, Banphool Path",
  addressLine2: "Opp. Krishna Plaza, Last Gate, Dispur, Kamrup",
  city: "Guwahati",
  // Assam, GST state code 18 — agrees with the GSTIN prefix. This is the field
  // that decides CGST+SGST (buyer in Assam) vs IGST (everyone else).
  state: "Assam",
  pinCode: "781038",
  country: "India",

  gstin: "18BCOPB4056N1Z7",
  pan: "BCOPB4056N", // embedded in the GSTIN above

  email: "everlywhiteshop@gmail.com",
  phone: null, // TODO: business phone number for the invoice header — still outstanding
  website: "www.everlywhite.com",

  logoUrl: "/images/logo.png",
  // Client declined a signature image 2026-08-05. The invoice prints a plain
  // "Authorised Signatory" line instead, which is what the rules require.
  signatureUrl: null,

  invoicePrefix: "EW",

  // Confirmed by the client's accountant, 2026-08-05: HSN 4421 90 90, "other
  // articles of wood (including wooden handicrafts)", on the basis that the
  // pieces are essentially wood/MDF. 12% is the rate for that heading.
  //
  // This is the fallback for any product with no rate of its own. If the client
  // ever stocks something that is NOT essentially wood — a piece whose value
  // and character sit in the mirror or in metal, say — that item needs its own
  // HSN and rate on its product page, because it would fall outside 4421.
  defaultGstRate: 12,
  defaultHsnCode: "44219090",

  invoiceTerms: null, // optional: terms printed at the foot of the invoice
  // Client declined 2026-08-05 — no account details on the invoice. The PDF
  // omits the block entirely rather than printing an empty heading.
  bankDetails: null,
};

/**
 * Lists anything wrong with the seller block that would show on a printed
 * invoice. Used by the issuance step to log a warning rather than to block —
 * a customer waiting on their invoice should not be held up by a missing PAN.
 */
export function sellerDetailsProblems(seller: SellerDetails): string[] {
  const problems: string[] = [];
  const unset = (v: string | null) => !v || v.startsWith("TODO");

  if (unset(seller.gstin)) {
    problems.push("GSTIN is not set");
  } else {
    if (!isValidGstinFormat(seller.gstin)) problems.push("GSTIN is not a valid format");
    else if (!hasValidGstinChecksum(seller.gstin)) problems.push("GSTIN fails its check digit");
    else if (!gstinMatchesState(seller.gstin, seller.state)) {
      problems.push(`GSTIN state code does not match ${seller.state}`);
    }
  }

  if (unset(seller.addressLine1)) problems.push("address is not set");
  if (unset(seller.city)) problems.push("city is not set");
  if (unset(seller.pinCode)) problems.push("PIN code is not set");
  return problems;
}

/**
 * The seller block used when raising an invoice: the hardcoded values above,
 * with any non-empty `business_settings` column taking precedence.
 *
 * Merged field by field rather than all-or-nothing so a half-filled settings
 * row can never blank out a detail that is legally required on the document.
 *
 * If the table is unreachable we fall back to the constants rather than
 * failing — the hardcoded values are the source of truth today, so an invoice
 * should not be blocked by a settings row nobody is using.
 */
export async function getSellerDetails(): Promise<SellerDetails> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("business_settings").select("*").maybeSingle();
  if (!data) return SELLER;

  // Treats "" and "   " as unset, so a cleared form field falls back rather
  // than printing a blank line on the invoice.
  const text = (value: string | null | undefined, fallback: string | null): string | null => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
  };

  return {
    legalName: text(data.legal_name, SELLER.legalName) ?? SELLER.legalName,
    tradeName: text(data.trade_name, SELLER.tradeName),
    addressLine1: text(data.address_line1, SELLER.addressLine1) ?? SELLER.addressLine1,
    addressLine2: text(data.address_line2, SELLER.addressLine2),
    city: text(data.city, SELLER.city) ?? SELLER.city,
    // Cast: the column is free-form TEXT, but only ever written from the
    // canonical list. An unrecognised value is caught when the place of supply
    // is resolved, which fails loudly rather than guessing a tax split.
    state: (text(data.state, SELLER.state) ?? SELLER.state) as GstStateName,
    pinCode: text(data.pin_code, SELLER.pinCode) ?? SELLER.pinCode,
    country: text(data.country, SELLER.country) ?? SELLER.country,
    gstin: text(data.gstin, SELLER.gstin) ?? SELLER.gstin,
    pan: text(data.pan, SELLER.pan),
    email: text(data.email, SELLER.email),
    phone: text(data.phone, SELLER.phone),
    website: text(data.website, SELLER.website),
    logoUrl: text(data.logo_url, SELLER.logoUrl),
    signatureUrl: text(data.signature_url, SELLER.signatureUrl),
    invoicePrefix: text(data.invoice_prefix, SELLER.invoicePrefix) ?? SELLER.invoicePrefix,
    // 0 is a legitimate GST rate (exempt goods), so this checks for null
    // rather than falsiness — `|| SELLER.defaultGstRate` would silently
    // convert a deliberate 0% into 18%.
    defaultGstRate: data.default_gst_rate ?? SELLER.defaultGstRate,
    defaultHsnCode: text(data.default_hsn_code, SELLER.defaultHsnCode),
    invoiceTerms: text(data.invoice_terms, SELLER.invoiceTerms),
    bankDetails: text(data.bank_details, SELLER.bankDetails),
  };
}
