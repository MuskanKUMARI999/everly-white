import "server-only";

import { readFileSync } from "fs";
import path from "path";

/**
 * Loads the brand logo for the invoice header, as a data URL.
 *
 * Read from disk here — rather than handed to react-pdf as a path — for the same
 * reason as the font: a failed read is caught and reported, instead of surfacing
 * from inside the renderer. Callers fall back to setting the shop name in type.
 *
 * WHY A SEPARATE FILE FROM public/images/logo.png
 *
 * The site's logo is an INDEXED-PALETTE png whose transparency lives in a tRNS
 * lookup table. react-pdf's image decoder does not handle that combination, and
 * printed the wordmark so faint it was nearly invisible on the page — even
 * though the artwork itself is pure black (checked: 19,658 fully-opaque pixels,
 * every one dark, none light).
 *
 * invoice-logo.png is the same artwork re-encoded as truecolour + alpha
 * (PNG colour type 6), which react-pdf reads correctly, with every pixel's
 * colour forced to pure black so no anti-aliased edge carries a lighter tint.
 * Regenerate it from logo.png with sharp if the brand mark ever changes.
 *
 * The original is left untouched: this repository is not under version control,
 * so overwriting an image would destroy it permanently.
 *
 * Cached: the bytes never change within a process, and base64-encoding them on
 * every invoice would be pure waste.
 */

const LOGO_ASPECT = 1080 / 207;

let cached: string | null | undefined;

export function loadInvoiceLogo(): string | null {
  if (cached !== undefined) return cached;

  try {
    const file = path.join(process.cwd(), "public", "images", "invoice-logo.png");
    cached = `data:image/png;base64,${readFileSync(file).toString("base64")}`;
  } catch (error) {
    console.error("Invoice logo could not be loaded; falling back to the shop name in text.", error);
    cached = null;
  }

  return cached;
}

/** Height for a given printed width, so the wordmark is never stretched. */
export function logoHeightFor(width: number): number {
  return width / LOGO_ASPECT;
}
