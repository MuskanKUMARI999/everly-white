import { paiseToWords } from "@/lib/invoices/amountInWords";

/**
 * Works out the GST breakdown for one order.
 *
 * THREE THINGS THIS FILE EXISTS TO GET RIGHT
 *
 * 1. Prices here INCLUDE GST. The shop advertises ₹7,770 and the customer pays
 *    ₹7,770; the tax is already inside that. So the tax is extracted, not added:
 *    taxable = inclusive × 100 / (100 + rate). Adding tax on top instead would
 *    overcharge on paper and disagree with what the card was actually debited.
 *
 * 2. A coupon discount belongs to the ORDER, not to any one line, but GST is
 *    charged on the value after discount. The discount is therefore spread
 *    across the lines in proportion to their value before any tax is worked out.
 *
 * 3. The invoice total must equal what the customer paid, to the paisa. Rounding
 *    each line to two decimals can leave the sum a paisa or two adrift, so the
 *    difference is stated as a Round Off line — which is what every Indian
 *    invoice does — rather than left to disagree with the payment.
 *
 * Everything below is in PAISE, as whole numbers. Money in floating point
 * accumulates error (0.1 + 0.2 !== 0.3), and this arithmetic ends up on a tax
 * return, so rupees only reappear at the formatting boundary.
 *
 * Pure calculation: no database, no I/O, so it can be tested exhaustively.
 */

/**
 * Unique Quantity Code. Rule 46 asks for the quantity AND its unit, not the
 * bare number. "NOS" (numbers) is the code for anything sold by the piece,
 * which is everything in this shop today.
 */
export const DEFAULT_UNIT = "NOS";

export interface TaxInputItem {
  description: string;
  /** Falls back to the shop default upstream; null only if no default is set. */
  hsnCode: string | null;
  quantity: number;
  /** Unique Quantity Code. Defaults to NOS when not given. */
  unit?: string;
  /** Unit price as charged, GST included, in rupees. */
  unitPrice: number;
  /** quantity × unitPrice as charged, GST included, in rupees. */
  lineTotal: number;
  /** Percent, e.g. 12 for 12%. */
  gstRate: number;
}

export interface TaxInput {
  items: TaxInputItem[];
  /** Sum of line totals before discount, in rupees (orders.subtotal). */
  subtotal: number;
  /** Order-level coupon discount, in rupees (orders.discount_amount). */
  discount: number;
  /** Order-level delivery charge, in rupees (orders.shipping_amount). */
  shipping: number;
  /** What the customer actually paid, in rupees (orders.total). */
  total: number;
  /** True when buyer and seller are in different states — IGST instead of CGST+SGST. */
  interstate: boolean;
}

export interface TaxLine {
  description: string;
  hsnCode: string | null;
  quantity: number;
  /** Unique Quantity Code, frozen with the rest of the line. */
  unit: string;
  unitPricePaise: number;
  /** quantity × unit price, before discount. */
  grossPaise: number;
  /** This line's share of the order-level discount. */
  discountPaise: number;
  /** This line's share of the order-level delivery charge. */
  shippingPaise: number;
  /** What this line effectively costs the customer, GST included. */
  inclusivePaise: number;
  gstRate: number;
  /** The value the tax is charged on: inclusive minus the tax inside it. */
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
}

/** One row of the HSN-wise summary that GST invoices carry beneath the lines. */
export interface TaxRateSummaryRow {
  hsnCode: string | null;
  gstRate: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
}

export interface TaxTotals {
  grossPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  /** Difference between the computed sum and the amount actually paid. Usually 0. */
  roundOffPaise: number;
  /** Always equals what the customer paid. */
  grandTotalPaise: number;
  amountInWords: string;
}

export interface TaxBreakdown {
  lines: TaxLine[];
  rateSummary: TaxRateSummaryRow[];
  totals: TaxTotals;
  interstate: boolean;
  /**
   * Anything that did not add up. Empty in the normal case. Populated rather
   * than thrown, so a customer is never blocked from their invoice by a
   * discrepancy an admin needs to look at.
   */
  problems: string[];
}

/** Rupees (as stored in NUMERIC(10,2)) to whole paise. */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Paise to a plain "1,234.56" — Indian digit grouping, no currency symbol. */
export function formatPaise(paise: number): string {
  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const rupees = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, "0");
  const grouped = rupees.toLocaleString("en-IN");
  return `${negative ? "-" : ""}${grouped}.${fraction}`;
}

/**
 * Splits `amountPaise` across `weights` so the parts sum to EXACTLY the amount.
 *
 * Rounding each share independently would lose or gain a paisa, which then shows
 * up as an invoice that does not balance. This uses the largest-remainder
 * method: floor every share, then hand the leftover paise out one at a time to
 * whichever lines were cut hardest. Deterministic, and exact by construction.
 */
function apportion(amountPaise: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) return [];
  if (amountPaise === 0) return weights.map(() => 0);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Nothing to weight by (a fully discounted order, say). Putting the whole
  // amount on the first line keeps the arithmetic exact; dropping it would not.
  if (totalWeight <= 0) {
    const shares = weights.map(() => 0);
    shares[0] = amountPaise;
    return shares;
  }

  const exact = weights.map((w) => (amountPaise * w) / totalWeight);
  const shares = exact.map((v) => Math.floor(v));
  let leftover = amountPaise - shares.reduce((sum, v) => sum + v, 0);

  const byLargestRemainder = exact
    .map((v, index) => ({ index, remainder: v - Math.floor(v) }))
    // Index breaks ties so the result never depends on sort stability.
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (let k = 0; leftover > 0; k++, leftover--) {
    shares[byLargestRemainder[k % count].index] += 1;
  }

  return shares;
}

export function computeTaxBreakdown(input: TaxInput): TaxBreakdown {
  const problems: string[] = [];

  if (input.items.length === 0) {
    problems.push("The order has no line items.");
  }

  // Guard rather than record-and-continue. Everything else in this file degrades
  // gracefully and reports the problem, because a customer should not be denied
  // their invoice over a discrepancy. A malformed rate is the exception: it
  // poisons the arithmetic into NaN, and an invoice reading "NaN" in the tax
  // column is worse than no invoice at all. Caught during development by a test
  // that omitted the rate entirely.
  for (const item of input.items) {
    if (!Number.isFinite(item.gstRate) || item.gstRate < 0 || item.gstRate > 100) {
      throw new Error(
        `Invalid GST rate ${JSON.stringify(item.gstRate)} on "${item.description}" — cannot compute tax.`,
      );
    }
    if (!Number.isFinite(item.lineTotal) || !Number.isFinite(item.quantity)) {
      throw new Error(`Invalid amount or quantity on "${item.description}" — cannot compute tax.`);
    }
  }
  for (const [label, value] of [
    ["subtotal", input.subtotal],
    ["discount", input.discount],
    ["shipping", input.shipping],
    ["total", input.total],
  ] as const) {
    if (!Number.isFinite(value)) {
      throw new Error(`Order ${label} is not a number — cannot compute tax.`);
    }
  }

  const grossPerLine = input.items.map((item) => toPaise(item.lineTotal));
  const grossTotal = grossPerLine.reduce((sum, v) => sum + v, 0);

  const discountTotal = toPaise(input.discount);
  const shippingTotal = toPaise(input.shipping);
  const paidTotal = toPaise(input.total);

  // A mismatch here means the order's own arithmetic disagrees with its line
  // items — worth an admin's attention, but the invoice still has to reconcile
  // to what was actually charged, which the round-off below guarantees.
  const subtotalPaise = toPaise(input.subtotal);
  if (grossTotal !== subtotalPaise) {
    problems.push(
      `Line items add up to ${formatPaise(grossTotal)} but the order subtotal is ${formatPaise(subtotalPaise)}.`,
    );
  }

  // Delivery is apportioned by line value and taxed at each line's own rate.
  // Under GST, delivery on a composite supply carries the rate of the principal
  // item; with a single rate across the order — the normal case here — that is
  // exactly equivalent, and value-weighting is the accepted treatment for mixed
  // rates.
  const discountShares = apportion(discountTotal, grossPerLine);
  const shippingShares = apportion(shippingTotal, grossPerLine);

  const lines: TaxLine[] = input.items.map((item, i) => {
    const inclusive = grossPerLine[i] - discountShares[i] + shippingShares[i];

    // Rate in basis points, so a fractional rate stays exact in integer maths.
    const rateBp = Math.round(item.gstRate * 100);

    let taxable = Math.round((inclusive * 10_000) / (10_000 + rateBp));
    let tax = inclusive - taxable;

    // CGST and SGST are each half the tax, and an auditor expects the two to be
    // identical. An odd number of paise cannot halve evenly, so one paisa is
    // moved into the taxable value: the halves come out exactly equal AND
    // taxable + tax still adds back to the inclusive amount.
    if (!input.interstate && tax % 2 !== 0) {
      taxable += 1;
      tax -= 1;
    }

    const half = input.interstate ? 0 : tax / 2;

    return {
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unit: item.unit?.trim() || DEFAULT_UNIT,
      unitPricePaise: toPaise(item.unitPrice),
      grossPaise: grossPerLine[i],
      discountPaise: discountShares[i],
      shippingPaise: shippingShares[i],
      inclusivePaise: inclusive,
      gstRate: item.gstRate,
      taxablePaise: taxable,
      cgstPaise: half,
      sgstPaise: half,
      igstPaise: input.interstate ? tax : 0,
      totalTaxPaise: tax,
    };
  });

  const sum = (pick: (line: TaxLine) => number) => lines.reduce((t, l) => t + pick(l), 0);

  const taxablePaise = sum((l) => l.taxablePaise);
  const cgstPaise = sum((l) => l.cgstPaise);
  const sgstPaise = sum((l) => l.sgstPaise);
  const igstPaise = sum((l) => l.igstPaise);
  const totalTaxPaise = sum((l) => l.totalTaxPaise);

  const computedTotal = taxablePaise + cgstPaise + sgstPaise + igstPaise;

  // The invoice is anchored to the payment, not the other way round: whatever
  // the line arithmetic came to, the grand total shown is what the customer
  // paid, and any gap is declared openly as Round Off.
  const roundOffPaise = paidTotal - computedTotal;

  // A gap beyond a few paise is not rounding — it means the order's totals were
  // built differently from the lines, and someone should look at it.
  if (Math.abs(roundOffPaise) > 100) {
    problems.push(
      `Computed total ${formatPaise(computedTotal)} differs from the amount paid ${formatPaise(paidTotal)} by ${formatPaise(roundOffPaise)}.`,
    );
  }

  // HSN-wise summary. Grouped on HSN and rate together: the same code at two
  // rates must stay on separate rows, because that is how it is reported.
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

  return {
    lines,
    rateSummary: [...groups.values()].sort((a, b) => a.gstRate - b.gstRate),
    totals: {
      grossPaise: grossTotal,
      discountPaise: discountTotal,
      shippingPaise: shippingTotal,
      taxablePaise,
      cgstPaise,
      sgstPaise,
      igstPaise,
      totalTaxPaise,
      roundOffPaise,
      grandTotalPaise: paidTotal,
      amountInWords: paiseToWords(paidTotal),
    },
    interstate: input.interstate,
    problems,
  };
}
