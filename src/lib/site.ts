/**
 * The site's public origin, with no trailing slash.
 *
 * Read from NEXT_PUBLIC_SITE_URL so the sitemap, robots.txt, canonical/OpenGraph tags and outgoing
 * email all agree. In production this MUST be https://everlywhite.com (no www — www 301s to it).
 * Left at the localhost default, a deployed sitemap would advertise localhost URLs to Google and
 * every email link would be dead.
 *
 * NEXT_PUBLIC_ variables are inlined at build time, so this value must be set in the host's
 * environment BEFORE the build runs. Setting it afterwards changes nothing.
 */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * The only country this shop ships to.
 *
 * Not a preference — the site is India-only by construction: free shipping "across India", a
 * 6-digit PIN rule at checkout, and GST invoices whose CGST/SGST-vs-IGST split is computed from a
 * table of the 36 Indian states (an unrecognised state fails the invoice rather than guessing a
 * tax split). The address book used to accept any country as free text, which produced saved
 * addresses the shop could not ship, price or invoice.
 *
 * Both the saved-address record and the order's frozen shipping snapshot read this, so they can
 * never disagree. Selling outside India is a business change, not a config change — shipping
 * rules, postcode validation and non-GST invoicing would all need real work first.
 */
export const SHIPPING_COUNTRY = "India";
