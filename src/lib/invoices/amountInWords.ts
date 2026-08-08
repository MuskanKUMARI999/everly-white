/**
 * Renders a rupee amount in words, the way an Indian invoice states it.
 *
 * Indian grouping, not international: 1,00,000 is "One Lakh", not "One Hundred
 * Thousand", and 1,00,00,000 is "One Crore". Getting this wrong on an invoice
 * looks careless to anyone reading it.
 *
 * Input is paise (integers) rather than rupees, because the caller already works
 * in paise to keep floating-point error out of the tax arithmetic.
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
] as const;

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
] as const;

/** 0–99. Eleven through nineteen are irregular, hence the lookup up to 19. */
function underHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = ONES[n % 10];
  return ones ? `${tens} ${ones}` : tens;
}

/** 0–999. */
function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const hundreds = `${ONES[Math.floor(n / 100)]} Hundred`;
  const rest = n % 100;
  return rest ? `${hundreds} ${underHundred(rest)}` : hundreds;
}

/**
 * Any non-negative integer, in Indian grouping. The crore group recurses, so
 * amounts above ninety-nine crore still read correctly rather than overflowing
 * the largest named unit.
 */
export function numberToIndianWords(n: number): string {
  if (n === 0) return "Zero";

  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1_000);
  const rest = n % 1_000;

  const parts: string[] = [];
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${underHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${underHundred(thousand)} Thousand`);
  if (rest) parts.push(underThousand(rest));

  return parts.join(" ");
}

/**
 * The full sign-off line for an invoice, e.g.
 *   85600  -> "Rupees Eight Hundred Fifty Six Only"
 *   856050 -> "Rupees Eight Thousand Five Hundred Sixty and Fifty Paise Only"
 *
 * Paise are named separately because they are a distinct unit, not a decimal
 * fraction — "and Fifty Paise", never "point five".
 */
export function paiseToWords(paise: number): string {
  const negative = paise < 0;
  const absolute = Math.abs(Math.round(paise));

  const rupees = Math.floor(absolute / 100);
  const remainder = absolute % 100;

  let words = `Rupees ${numberToIndianWords(rupees)}`;
  if (remainder > 0) {
    words += ` and ${numberToIndianWords(remainder)} Paise`;
  }

  return `${negative ? "Minus " : ""}${words} Only`;
}
