import "server-only";

import { readFileSync } from "fs";
import path from "path";
import { Font } from "@react-pdf/renderer";

/**
 * Registers the invoice typeface, and reports whether it worked.
 *
 * WHY THIS IS NOT JUST A ONE-LINE Font.register
 *
 * A PDF's built-in fonts use WinAnsi encoding, which has no glyph for the rupee
 * sign. Verified rather than assumed: rendering "₹8,560.00" with the default
 * font produced "¹8,560.00", bullet characters vanished entirely, and em dashes
 * came out as nothing at all. An invoice is the last place to discover that.
 *
 * EB Garamond — the brand's own text face, so the document matches the site —
 * carries all of them (checked against the font's character map before it was
 * added to the repo). But if the file is ever missing at runtime, silently
 * falling back to a built-in font would reintroduce the mangling. So the caller
 * is told, and switches to plain ASCII spellings instead. Wrong-looking is
 * acceptable; wrong is not.
 *
 * Only one weight is available: EB Garamond ships as a variable font, and
 * fontkit embeds only its default instance, so a registered "bold" would render
 * identically to regular. The template builds hierarchy from size, letter
 * spacing, rules and tinted bands rather than weight.
 */

let registered: boolean | null = null;

export function ensureInvoiceFont(): boolean {
  // Registering twice would re-embed the file on every request.
  if (registered !== null) return registered;

  try {
    // Read the bytes here rather than handing react-pdf a path: a failed read is
    // then caught and handled, instead of surfacing deep inside the renderer.
    // The bytes go across as a data URL because Font.register's `src` is typed
    // and treated as a string — passing a Buffer fails inside its URL sniffing
    // with "dataUrl.substring is not a function".
    const file = path.join(process.cwd(), "public", "fonts", "EBGaramond.ttf");
    const data = readFileSync(file);

    Font.register({
      family: INVOICE_FONT,
      fonts: [
        { src: `data:font/truetype;base64,${data.toString("base64")}`, fontWeight: 400 },
      ],
    });

    // Garamond is a narrow, small-x-height face; the default hyphenation
    // callback breaks product names mid-word in the line table. Off is better.
    Font.registerHyphenationCallback((word) => [word]);

    registered = true;
  } catch (error) {
    console.error(
      "Invoice font could not be loaded; falling back to the built-in face and ASCII currency.",
      error,
    );
    registered = false;
  }

  return registered;
}

export const INVOICE_FONT = "EBGaramond";

/**
 * The currency prefix to print. "₹" only when the real font is in use — the
 * built-in fallback would draw it as a superscript one.
 */
export function rupeePrefix(hasFont: boolean): string {
  return hasFont ? "₹" : "Rs.";
}
