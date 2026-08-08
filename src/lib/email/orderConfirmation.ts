import { sendEmail } from "@/lib/email/resend";
import {
  EMAIL_COLORS,
  emailDivider,
  emailParagraph,
  emailSectionLabel,
  escapeHtml,
  getSiteUrl,
  renderEmail,
} from "@/lib/email/layout";
import { formatPrice } from "@/components/sections/productFormat";
import type { Tables } from "@/lib/supabase/database.types";

interface ShippingAddress {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pin_code?: string;
  country?: string;
}

/** Address block shared by the confirmation and shipping emails. Every field is escaped. */
export function renderAddressBlock(address: ShippingAddress): string {
  const cityLine = [
    [address.city, address.state].filter(Boolean).join(", "),
    address.pin_code,
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    address.full_name,
    [address.line1, address.line2].filter(Boolean).join(", "),
    cityLine,
    address.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));

  return `<p style="margin:0;font-size:15px;line-height:1.7;color:${EMAIL_COLORS.text};">${lines
    .map(escapeHtml)
    .join("<br />")}</p>`;
}

export async function sendOrderConfirmationEmail({
  to,
  order,
  items,
}: {
  to: string;
  order: Tables<"orders">;
  items: Tables<"order_items">[];
}): Promise<{ success: boolean; message: string }> {
  const address = (order.shipping_address as ShippingAddress | null) ?? {};

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;font-size:15px;line-height:1.5;color:${EMAIL_COLORS.text};border-bottom:1px solid ${EMAIL_COLORS.border};">
            ${escapeHtml(item.product_name)}
            <span style="color:${EMAIL_COLORS.faint};">&times; ${escapeHtml(item.quantity)}</span>
          </td>
          <td style="padding:12px 0;text-align:right;font-size:15px;white-space:nowrap;color:${EMAIL_COLORS.text};border-bottom:1px solid ${EMAIL_COLORS.border};">
            ${escapeHtml(formatPrice(item.total))}
          </td>
        </tr>`,
    )
    .join("");

  const totalRow = (
    label: string,
    value: string,
    options: { bold?: boolean; accent?: boolean } = {},
  ) => `
    <tr>
      <td style="padding:6px 0;font-size:15px;color:${options.accent ? EMAIL_COLORS.accent : EMAIL_COLORS.muted};${
        options.bold ? "font-weight:bold;" : ""
      }">${escapeHtml(label)}</td>
      <td style="padding:6px 0;text-align:right;font-size:15px;white-space:nowrap;color:${
        options.accent ? EMAIL_COLORS.accent : EMAIL_COLORS.text
      };${options.bold ? "font-weight:bold;" : ""}">${escapeHtml(value)}</td>
    </tr>`;

  const body = `
    ${emailParagraph("Thank you — we've received your order and are getting it ready. You'll hear from us again as soon as it ships.")}

    ${emailSectionLabel("Your order")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${EMAIL_COLORS.border};">
      ${itemRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
      ${totalRow("Subtotal", formatPrice(order.subtotal))}
      ${
        order.discount_amount > 0
          ? totalRow(
              `Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`,
              `-${formatPrice(order.discount_amount)}`,
              { accent: true },
            )
          : ""
      }
      ${totalRow("Total", formatPrice(order.total), { bold: true })}
    </table>

    ${emailDivider()}

    ${emailSectionLabel("Shipping to")}
    ${renderAddressBlock(address)}
  `;

  return sendEmail({
    to,
    subject: `Order Confirmed — #${order.order_number}`,
    html: renderEmail({
      preheader: `Your Everly White order #${order.order_number} is confirmed.`,
      heading: "Thank you for your order",
      subheading: `Order #${order.order_number}`,
      body,
      cta: { label: "Track your order", url: `${getSiteUrl()}/track-order` },
      footerNote: "We'll let you know once your order ships.",
    }),
  });
}
