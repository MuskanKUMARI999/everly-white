import { sendEmail } from "@/lib/email/resend";
import {
  EMAIL_COLORS,
  emailParagraph,
  escapeHtml,
  getSiteUrl,
  renderEmail,
} from "@/lib/email/layout";
import { WELCOME_CODE, WELCOME_DISCOUNT_LABEL } from "@/lib/newsletter/welcomeOffer";

/** Large centred coupon code — the one thing the reader is meant to take away. */
function renderCodeBlock(code: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="padding:24px;background-color:${EMAIL_COLORS.accentSoft};border:1px solid ${EMAIL_COLORS.border};">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.12em;color:${EMAIL_COLORS.muted};padding-bottom:10px;">
            Your code
          </div>
          <div style="font-size:28px;letter-spacing:0.18em;color:${EMAIL_COLORS.accent};">
            ${escapeHtml(code)}
          </div>
        </td>
      </tr>
    </table>`;
}

export async function sendNewsletterWelcomeEmail({
  to,
  firstName,
}: {
  to: string;
  /** Only the welcome popup collects a name; the footer form does not. */
  firstName?: string | null;
}): Promise<{ success: boolean; message: string }> {
  const name = firstName?.trim();
  const greeting = name ? `Hello ${name},` : "Hello,";

  const body = `
    ${emailParagraph(greeting)}
    ${emailParagraph(
      "Thank you for joining us. You'll be first to hear about new arrivals, private previews and seasonal offers — and never more often than we'd want to hear from us ourselves.",
    )}
    ${emailParagraph(`To start you off, here's ${WELCOME_DISCOUNT_LABEL} your first order.`)}
    ${renderCodeBlock(WELCOME_CODE)}
    ${emailParagraph("Enter it at checkout. Keep this email — the code is here whenever you're ready.", {
      muted: true,
    })}
  `;

  return sendEmail({
    to,
    subject: `Welcome to Everly White — ${WELCOME_DISCOUNT_LABEL} inside`,
    html: renderEmail({
      preheader: `Your ${WELCOME_DISCOUNT_LABEL} code ${WELCOME_CODE} is inside.`,
      heading: "Welcome to Everly White",
      body,
      cta: { label: "Start shopping", url: `${getSiteUrl()}/products` },
      unsubscribeNote:
        "Prefer not to receive these? Reply to this email and we'll remove you from the list.",
    }),
  });
}
