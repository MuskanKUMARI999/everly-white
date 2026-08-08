/**
 * The 36 Indian states and union territories, with their GST state codes.
 *
 * This table decides how tax is split on every invoice. If the buyer's state
 * equals the seller's state the tax is CGST + SGST (half each); otherwise it is
 * IGST (the full rate). Get the state wrong and the invoice is wrong — the
 * total is unchanged, but the split filed with the return is not.
 *
 * The code is also the first two digits of a GSTIN, which is what lets
 * `gstinMatchesState` catch a GSTIN pasted from the wrong business.
 *
 * Two historical codes are deliberately absent:
 *   25 Daman and Diu       — merged into 26 in 2020
 *   28 Andhra Pradesh      — retired when the state was bifurcated; the
 *                            surviving Andhra Pradesh is 37
 * Including them would let someone pick a code the GST portal no longer accepts.
 */

export interface GstState {
  /** Two-digit GST state code, e.g. "10". */
  readonly code: string;
  /** Canonical name, spelled as the GST portal spells it. */
  readonly name: string;
  /**
   * Other spellings seen in the wild. Customers type this field by hand, so
   * these cover abbreviations, the pre-rename names, and the ampersand forms.
   * Matching is punctuation- and case-insensitive, so "Tamil Nadu", "tamilnadu"
   * and "TAMIL-NADU" all resolve without needing separate entries.
   */
  readonly aliases?: readonly string[];
}

export const GST_STATES = [
  { code: "01", name: "Jammu and Kashmir", aliases: ["JK", "J and K", "Jammu Kashmir"] },
  { code: "02", name: "Himachal Pradesh", aliases: ["HP"] },
  { code: "03", name: "Punjab", aliases: ["PB"] },
  { code: "04", name: "Chandigarh", aliases: ["CH"] },
  { code: "05", name: "Uttarakhand", aliases: ["UK", "UA", "Uttaranchal"] },
  { code: "06", name: "Haryana", aliases: ["HR"] },
  { code: "07", name: "Delhi", aliases: ["DL", "New Delhi", "NCT of Delhi", "Delhi NCR"] },
  { code: "08", name: "Rajasthan", aliases: ["RJ"] },
  { code: "09", name: "Uttar Pradesh", aliases: ["UP"] },
  { code: "10", name: "Bihar", aliases: ["BR"] },
  { code: "11", name: "Sikkim", aliases: ["SK"] },
  { code: "12", name: "Arunachal Pradesh", aliases: ["AR"] },
  { code: "13", name: "Nagaland", aliases: ["NL"] },
  { code: "14", name: "Manipur", aliases: ["MN"] },
  { code: "15", name: "Mizoram", aliases: ["MZ"] },
  { code: "16", name: "Tripura", aliases: ["TR"] },
  { code: "17", name: "Meghalaya", aliases: ["ML"] },
  { code: "18", name: "Assam", aliases: ["AS"] },
  { code: "19", name: "West Bengal", aliases: ["WB"] },
  { code: "20", name: "Jharkhand", aliases: ["JH"] },
  { code: "21", name: "Odisha", aliases: ["OD", "OR", "Orissa"] },
  { code: "22", name: "Chhattisgarh", aliases: ["CG", "CT", "Chattisgarh"] },
  { code: "23", name: "Madhya Pradesh", aliases: ["MP"] },
  { code: "24", name: "Gujarat", aliases: ["GJ"] },
  {
    code: "26",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    aliases: ["DN", "DD", "DNH", "Dadra and Nagar Haveli", "Daman and Diu"],
  },
  { code: "27", name: "Maharashtra", aliases: ["MH"] },
  { code: "29", name: "Karnataka", aliases: ["KA", "Karnatka"] },
  { code: "30", name: "Goa", aliases: ["GA"] },
  { code: "31", name: "Lakshadweep", aliases: ["LD"] },
  { code: "32", name: "Kerala", aliases: ["KL"] },
  { code: "33", name: "Tamil Nadu", aliases: ["TN"] },
  { code: "34", name: "Puducherry", aliases: ["PY", "Pondicherry"] },
  { code: "35", name: "Andaman and Nicobar Islands", aliases: ["AN", "Andaman and Nicobar"] },
  { code: "36", name: "Telangana", aliases: ["TS", "TG"] },
  { code: "37", name: "Andhra Pradesh", aliases: ["AP"] },
  { code: "38", name: "Ladakh", aliases: ["LA"] },
  { code: "97", name: "Other Territory" },
] as const satisfies readonly GstState[];

/**
 * Union of the canonical names. Typing the seller's state as this makes a
 * misspelling a compile error rather than a silently wrong tax split.
 */
export type GstStateName = (typeof GST_STATES)[number]["name"];

/**
 * Reduces a typed-in state to a comparison key: case-folded, "&" spelled out,
 * and every non-alphanumeric character dropped. So "Tamil Nadu", "tamil-nadu"
 * and "TAMILNADU" all collapse to "tamilnadu".
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]/g, "");
}

/** Built once — canonical names, aliases and bare codes all point at the state. */
const LOOKUP: ReadonlyMap<string, GstState> = (() => {
  const map = new Map<string, GstState>();
  // Widened to GstState: `as const` narrows each entry to its own literal type,
  // and the entries without an `aliases` key would otherwise have no such
  // property to read.
  for (const state of GST_STATES as readonly GstState[]) {
    map.set(normalise(state.name), state);
    map.set(state.code, state);
    for (const alias of state.aliases ?? []) {
      const key = normalise(alias);
      // Canonical names win: never let an alias shadow a real state's name.
      if (!map.has(key)) map.set(key, state);
    }
  }
  return map;
})();

/**
 * Resolves free text from an address into a GST state, or null if it cannot be
 * matched. Returning null rather than guessing is deliberate — a wrong state
 * produces a plausible-looking invoice with the wrong tax split, which is far
 * worse than a loud failure the admin can correct.
 */
export function resolveGstState(input: string | null | undefined): GstState | null {
  if (!input) return null;
  return LOOKUP.get(normalise(input)) ?? null;
}

/** The 15-character GSTIN format: 2-digit state code, 10-char PAN, entity digit, 'Z', checksum. */
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstinFormat(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin.trim().toUpperCase());
}

/**
 * Cross-checks a GSTIN's embedded state code against the state it is filed
 * under. Catches the realistic mistake of pasting the right-looking GSTIN for
 * the wrong registration.
 */
export function gstinMatchesState(gstin: string, state: GstStateName): boolean {
  const expected = GST_STATES.find((s) => s.name === state);
  return expected ? gstin.trim().slice(0, 2) === expected.code : false;
}

const GSTIN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Verifies the GSTIN's 15th character, which is a check digit computed from the
 * preceding fourteen. A single mistyped or transposed character almost always
 * fails this, so it catches errors that the format pattern alone lets through.
 *
 * The algorithm is the GST portal's own: value each character by its position
 * in the base-36 alphabet, multiply by an alternating 1/2 factor, add the
 * quotient and remainder of that product over 36, then the check digit is
 * whatever brings the running total up to a multiple of 36.
 */
export function hasValidGstinChecksum(gstin: string): boolean {
  const value = gstin.trim().toUpperCase();
  if (!GSTIN_PATTERN.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const digit = GSTIN_ALPHABET.indexOf(value[i]);
    if (digit < 0) return false;
    const product = digit * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }

  return GSTIN_ALPHABET[(36 - (sum % 36)) % 36] === value[14];
}

/** Characters 3–12 of a GSTIN are the holder's PAN. */
export function panFromGstin(gstin: string): string | null {
  const value = gstin.trim().toUpperCase();
  return GSTIN_PATTERN.test(value) ? value.slice(2, 12) : null;
}
