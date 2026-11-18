export interface CountryCode {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  /**
   * Accepted lengths for a MOBILE national number — the part after the dial code, with the
   * national trunk prefix ("0" in most of Europe) already dropped. Several countries issue mobile
   * numbers at more than one length, so this is a list rather than a single value.
   *
   * This is deliberately a length check and not full E.164 validation: it is enough to stop the
   * typo the shop actually sees (a digit short, or a pasted number with the country code repeated)
   * without shipping a 200KB metadata library for a contact field.
   */
  digits: number[];
}

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "IN", name: "India", dial: "+91", flag: "🇮🇳", digits: [10] },
  { iso: "US", name: "United States", dial: "+1", flag: "🇺🇸", digits: [10] },
  { iso: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", digits: [10] },
  { iso: "AE", name: "United Arab Emirates", dial: "+971", flag: "🇦🇪", digits: [9] },
  { iso: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", digits: [9] },
  { iso: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", digits: [10] },
  { iso: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬", digits: [8] },
  { iso: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", digits: [10, 11] },
  { iso: "FR", name: "France", dial: "+33", flag: "🇫🇷", digits: [9] },
  { iso: "IT", name: "Italy", dial: "+39", flag: "🇮🇹", digits: [9, 10] },
  { iso: "ES", name: "Spain", dial: "+34", flag: "🇪🇸", digits: [9] },
  { iso: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱", digits: [9] },
  { iso: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭", digits: [9] },
  { iso: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪", digits: [9] },
  { iso: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪", digits: [9] },
  { iso: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿", digits: [8, 9, 10] },
  { iso: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", digits: [10] },
  { iso: "CN", name: "China", dial: "+86", flag: "🇨🇳", digits: [11] },
  { iso: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰", digits: [8] },
  { iso: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾", digits: [9, 10] },
  { iso: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭", digits: [9] },
  { iso: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩", digits: [9, 10, 11, 12] },
  { iso: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭", digits: [10] },
  { iso: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰", digits: [10] },
  { iso: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩", digits: [10] },
  { iso: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰", digits: [9] },
  { iso: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵", digits: [10] },
  { iso: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", digits: [9] },
  { iso: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦", digits: [8] },
  { iso: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼", digits: [8] },
  { iso: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", digits: [9] },
  { iso: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬", digits: [10] },
  { iso: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪", digits: [9] },
  { iso: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", digits: [11] },
  { iso: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽", digits: [10] },
];

export const DEFAULT_COUNTRY_ISO = "IN";

/**
 * Every phone number the shop stores is India-only in practice for anything that ships: see
 * SHIPPING_COUNTRY in lib/site.ts. Checkout and the address book therefore use this fixed rule
 * rather than the per-country table above, which only applies to the account/contact phone.
 */
export const INDIA_PHONE_DIGITS = 10;

export function countryByIso(iso: string): CountryCode {
  return (
    COUNTRY_CODES.find((c) => c.iso === iso) ??
    COUNTRY_CODES.find((c) => c.iso === DEFAULT_COUNTRY_ISO)!
  );
}

/** Longest number the country issues — what the input caps typing at. */
export function maxPhoneDigits(iso: string): number {
  return Math.max(...countryByIso(iso).digits);
}

export function isValidPhoneDigits(iso: string, digits: string): boolean {
  return countryByIso(iso).digits.includes(digits.length);
}

/** "10 digits" / "9 or 10 digits" / "9, 10 or 11 digits" — for placeholders and error messages. */
export function phoneDigitsHint(iso: string): string {
  const lengths = countryByIso(iso).digits;
  if (lengths.length === 1) return `${lengths[0]} digits`;
  const head = lengths.slice(0, -1).join(", ");
  return `${head} or ${lengths[lengths.length - 1]} digits`;
}

/** Everything except the digits, dropped. Used before any length check. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Splits a stored "+91 9876543210" back into the country and the national number, so an edit form
 * can be seeded from what is in the database. Matches the longest dial code first, because "+1"
 * is a prefix of nothing but "+91"/"+94" would otherwise collide with a naive shortest match.
 * An unrecognised or bare number is treated as the default country's, which is what pre-existing
 * rows (saved before the country selector existed) contain.
 */
export function parseStoredPhone(stored: string | null | undefined): {
  iso: string;
  national: string;
} {
  const raw = (stored ?? "").trim();
  if (!raw) return { iso: DEFAULT_COUNTRY_ISO, national: "" };

  if (raw.startsWith("+")) {
    const candidates = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
    for (const country of candidates) {
      if (raw.startsWith(country.dial)) {
        return { iso: country.iso, national: onlyDigits(raw.slice(country.dial.length)) };
      }
    }
  }

  return { iso: DEFAULT_COUNTRY_ISO, national: onlyDigits(raw) };
}
