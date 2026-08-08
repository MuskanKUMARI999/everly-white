import { sendEmail } from "@/lib/email/resend";
import {
  EMAIL_COLORS,
  emailPanel,
  emailParagraph,
  emailQuote,
  emailSectionLabel,
  escapeHtml,
  getSiteUrl,
  renderEmail,
} from "@/lib/email/layout";
import { formatPrice } from "@/components/sections/productFormat";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * Where owner notifications go. Separate from RESEND_REPLY_TO because the two answer different
 * questions: reply-to is where *customers* reach the shop, this is where the shop is alerted.
 * Unset means alerts are simply skipped — never a hard failure, since an order must complete
 * whether or not the owner can be notified.
 */
function getAdminAlertAddress(): string | null {
  return process.env.ADMIN_ALERT_EMAIL?.trim() || null;
}

interface ShippingAddress {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
}

/** New paid order → tell the shop owner, with enough detail to act without opening the site. */
export async function sendNewOrderAlert({
  order,
  items,
  customerEmail,
}: {
  order: Tables<"orders">;
  items: Tables<"order_items">[];
  customerEmail: string | null;
}): Promise<{ success: boolean; message: string }> {
  const to = getAdminAlertAddress();
  if (!to) return { success: false, message: "ADMIN_ALERT_EMAIL not set — alert skipped." };

  const address = (order.shipping_address as ShippingAddress | null) ?? {};

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;font-size:15px;color:${EMAIL_COLORS.text};border-bottom:1px solid ${EMAIL_COLORS.border};">
            ${escapeHtml(item.product_name)}
            <span style="color:${EMAIL_COLORS.faint};">&times; ${escapeHtml(item.quantity)}</span>
          </td>
          <td style="padding:10px 0;text-align:right;font-size:15px;white-space:nowrap;color:${EMAIL_COLORS.text};border-bottom:1px solid ${EMAIL_COLORS.border};">
            ${escapeHtml(formatPrice(item.total))}
          </td>
        </tr>`,
    )
    .join("");

  const summary: { label: string; value: string }[] = [
    { label: "Order", value: `#${order.order_number}` },
    { label: "Total", value: formatPrice(order.total) },
    { label: "Customer", value: customerEmail ?? "No email on file" },
  ];
  if (order.coupon_code) summary.push({ label: "Coupon", value: order.coupon_code });

  const body = `
    ${emailParagraph("A new order has been paid and is ready to fulfil.")}
    ${emailPanel(summary)}

    ${emailSectionLabel("Items")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${EMAIL_COLORS.border};">
      ${itemRows}
    </table>

    ${emailSectionLabel("Ship to")}
    <p style="margin:0;font-size:15px;line-height:1.7;color:${EMAIL_COLORS.text};">
      ${[
        address.full_name,
        [address.line1, address.line2].filter(Boolean).join(", "),
        [[address.city, address.state].filter(Boolean).join(", "), address.pin_code]
          .filter(Boolean)
          .join(" "),
        address.phone,
      ]
        .filter((line): line is string => Boolean(line && line.trim()))
        .map(escapeHtml)
        .join("<br />")}
    </p>
  `;

  return sendEmail({
    to,
    // Replying goes straight to the customer rather than to the shop's own inbox.
    replyTo: customerEmail ?? undefined,
    subject: `New order #${order.order_number} — ${formatPrice(order.total)}`,
    html: renderEmail({
      preheader: `${formatPrice(order.total)} from ${customerEmail ?? "a customer"}.`,
      heading: "New order received",
      subheading: `Order #${order.order_number}`,
      body,
      cta: { label: "Open in admin", url: `${getSiteUrl()}/admin/orders` },
    }),
  });
}

/** New contact-form submission → tell the shop owner, with the message quoted in full. */
export async function sendNewContactAlert({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; message: string }> {
  const to = getAdminAlertAddress();
  if (!to) return { success: false, message: "ADMIN_ALERT_EMAIL not set — alert skipped." };

  const body = `
    ${emailParagraph("Someone has sent a message through the contact form.")}
    ${emailPanel([
      { label: "From", value: name },
      { label: "Email", value: email },
      { label: "Subject", value: subject },
    ])}
    ${emailSectionLabel("Message")}
    ${emailQuote(message)}
    ${emailParagraph("Reply to this email to answer them directly.", { muted: true })}
  `;

  return sendEmail({
    to,
    // The whole point of the alert: hitting reply answers the customer, not yourself.
    replyTo: email,
    subject: `New enquiry — ${subject}`,
    html: renderEmail({
      preheader: `${name} sent a message via the contact form.`,
      heading: "New contact message",
      body,
      cta: { label: "Open in admin", url: `${getSiteUrl()}/admin/contact` },
    }),
  });
}
