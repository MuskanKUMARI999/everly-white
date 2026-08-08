/**
 * Shared layout for every transactional email Everly White sends.
 *
 * Email HTML is not web HTML: Outlook still renders through Word, Gmail strips <style> blocks
 * in some contexts, and flexbox/grid are unusable. So everything here is table-based with inline
 * styles only, capped at 600px. Colours are the real site tokens from globals.css; fonts fall
 * back to Georgia because Cinzel/EB Garamond cannot be loaded in most mail clients.
 */

// Brand tokens, mirrored from src/app/globals.css. Kept as literals because email HTML cannot
// resolve CSS custom properties.
export const EMAIL_COLORS = {
  page: "#fff9f5", // --color-beige-light
  card: "#ffffff",
  text: "#1e1e1e", // --color-neutral-500
  muted: "#5d5d5d", // --color-neutral-300
  faint: "#919191", // --color-neutral-200
  border: "#dbdbdb", // --color-neutral-100
  accent: "#8c4646", // --color-brown
  accentSoft: "#feeaeb", // --color-pink-100
} as const;

const FONT_BODY = "Georgia, 'Times New Roman', Times, serif";
const FONT_HEADING = "Georgia, 'Times New Roman', Times, serif";

/**
 * Absolute origin for links and images. Mail clients have no page context, so every URL in an
 * email must be absolute. Matches the fallback used in src/lib/auth/actions.ts.
 */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Escape untrusted text before it goes into email HTML.
 *
 * This matters more than on the website: order items, addresses and contact-form messages are
 * attacker-influenced strings, and an unescaped `<` can break the layout or smuggle markup into
 * the shop owner's inbox. Every interpolation of user data below goes through this.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape a URL for an href, and refuse anything that is not http(s) to block javascript: links. */
export function safeUrl(url: string): string {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return getSiteUrl();
  return escapeHtml(trimmed);
}

export interface EmailCta {
  label: string;
  url: string;
}

export interface RenderEmailOptions {
  /** Short preview line shown next to the subject in the inbox list. */
  preheader: string;
  /** Main title inside the card. */
  heading: string;
  /** Optional line directly under the heading (order number, date, etc.). */
  subheading?: string;
  /** Pre-rendered HTML for the body. Build it with the block helpers below. */
  body: string;
  /** Optional primary button. */
  cta?: EmailCta;
  /** Small closing line above the footer. */
  footerNote?: string;
  /** When set, the footer explains how to unsubscribe. Used by marketing-ish mail only. */
  unsubscribeNote?: string;
}

/**
 * Hidden preheader. The zero-size span holds the preview text; the trailing entities stop the
 * client from spilling body copy into the preview after it.
 */
function renderPreheader(text: string): string {
  return `<div style="display:none;font-size:1px;color:${EMAIL_COLORS.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
    text,
  )}${"&#8199;&#65279;&#847; ".repeat(30)}</div>`;
}

function renderCta(cta: EmailCta): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0 8px;">
      <tr>
        <td style="background-color:${EMAIL_COLORS.accent};border-radius:2px;">
          <a href="${safeUrl(cta.url)}"
             style="display:inline-block;padding:14px 32px;font-family:${FONT_BODY};font-size:15px;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
            ${escapeHtml(cta.label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Wrap body HTML in the branded shell. Returns a complete HTML document. */
export function renderEmail({
  preheader,
  heading,
  subheading,
  body,
  cta,
  footerNote,
  unsubscribeNote,
}: RenderEmailOptions): string {
  const siteUrl = getSiteUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.page};">
  ${renderPreheader(preheader)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${EMAIL_COLORS.page};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Logo. Most clients block images by default, so the alt text is the real wordmark. -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <a href="${safeUrl(siteUrl)}" style="text-decoration:none;">
                <img src="${safeUrl(`${siteUrl}/images/logo.png`)}" width="140" alt="Everly White"
                     style="display:block;border:0;outline:none;width:140px;max-width:140px;height:auto;font-family:${FONT_HEADING};font-size:20px;letter-spacing:0.18em;color:${EMAIL_COLORS.text};text-decoration:none;" />
              </a>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:600px;background-color:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.border};">
          <tr>
            <td style="padding:40px 40px 32px;font-family:${FONT_BODY};color:${EMAIL_COLORS.text};">

              <h1 style="margin:0 0 ${subheading ? "6px" : "24px"};font-family:${FONT_HEADING};font-size:24px;font-weight:400;line-height:1.3;letter-spacing:0.02em;color:${EMAIL_COLORS.text};">
                ${escapeHtml(heading)}
              </h1>
              ${
                subheading
                  ? `<p style="margin:0 0 24px;font-size:14px;letter-spacing:0.04em;color:${EMAIL_COLORS.muted};">${escapeHtml(
                      subheading,
                    )}</p>`
                  : ""
              }

              ${body}

              ${cta ? renderCta(cta) : ""}

              ${
                footerNote
                  ? `<p style="margin:32px 0 0;font-size:14px;line-height:1.6;color:${EMAIL_COLORS.faint};">${escapeHtml(
                      footerNote,
                    )}</p>`
                  : ""
              }
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
          <tr>
            <td align="center" style="padding:24px 24px 0;font-family:${FONT_BODY};font-size:13px;line-height:1.7;color:${EMAIL_COLORS.faint};">
              <a href="${safeUrl(`${siteUrl}/products`)}" style="color:${EMAIL_COLORS.muted};text-decoration:none;">Shop</a>
              &nbsp;&middot;&nbsp;
              <a href="${safeUrl(`${siteUrl}/track-order`)}" style="color:${EMAIL_COLORS.muted};text-decoration:none;">Track order</a>
              &nbsp;&middot;&nbsp;
              <a href="${safeUrl(`${siteUrl}/contact`)}" style="color:${EMAIL_COLORS.muted};text-decoration:none;">Contact</a>
              <div style="padding-top:12px;">&copy; ${year} Everly White. All rights reserved.</div>
              ${
                unsubscribeNote
                  ? `<div style="padding-top:8px;">${escapeHtml(unsubscribeNote)}</div>`
                  : ""
              }
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* Body block helpers — so templates never hand-write table markup.    */
/* ------------------------------------------------------------------ */

/** A paragraph of body copy. Pass `html: true` only for text you built yourself. */
export function emailParagraph(text: string, options: { html?: boolean; muted?: boolean } = {}): string {
  const color = options.muted ? EMAIL_COLORS.muted : EMAIL_COLORS.text;
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${color};">${
    options.html ? text : escapeHtml(text)
  }</p>`;
}

/** Small uppercase section label, matching the site's eyebrow style. */
export function emailSectionLabel(text: string): string {
  return `<h2 style="margin:32px 0 12px;font-size:12px;font-weight:400;text-transform:uppercase;letter-spacing:0.12em;color:${EMAIL_COLORS.muted};">${escapeHtml(
    text,
  )}</h2>`;
}

/** Horizontal rule. */
export function emailDivider(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr><td style="border-top:1px solid ${EMAIL_COLORS.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

/**
 * A tinted callout box — used for tracking details and admin alert summaries.
 * `rows` values are escaped; pass pre-escaped HTML via `valueHtml` when a link is needed.
 */
export function emailPanel(rows: { label: string; value?: string; valueHtml?: string }[]): string {
  const cells = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:6px 0;font-size:14px;letter-spacing:0.04em;color:${EMAIL_COLORS.muted};white-space:nowrap;">${escapeHtml(
            row.label,
          )}</td>
          <td style="padding:6px 0 6px 16px;font-size:15px;color:${EMAIL_COLORS.text};word-break:break-word;">${
            row.valueHtml ?? escapeHtml(row.value)
          }</td>
        </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background-color:${EMAIL_COLORS.accentSoft};border:1px solid ${EMAIL_COLORS.border};margin:8px 0 8px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${cells}</table>
        </td>
      </tr>
    </table>`;
}

/** Quoted block for echoing a customer's own words back (used in admin alerts). */
export function emailQuote(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
      <tr>
        <td style="padding:4px 0 4px 20px;border-left:2px solid ${EMAIL_COLORS.border};font-size:15px;line-height:1.7;color:${EMAIL_COLORS.muted};white-space:pre-wrap;word-break:break-word;">${escapeHtml(
          text,
        )}</td>
      </tr>
    </table>`;
}
