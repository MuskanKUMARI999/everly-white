import { sendEmail } from "@/lib/email/resend";
import {
  emailPanel,
  emailParagraph,
  emailSectionLabel,
  getSiteUrl,
  renderEmail,
} from "@/lib/email/layout";
import { renderAddressBlock } from "@/lib/email/orderConfirmation";
import { formatPrice } from "@/components/sections/productFormat";
import type { Tables } from "@/lib/supabase/database.types";

/** Which lifecycle email to send. Chosen by detectOrderEmail() from a before/after comparison. */
export type OrderEmailKind = "shipped" | "delivered" | "cancelled" | "refunded";

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

/**
 * Decide which email a save should trigger, by comparing the order before and after.
 *
 * Returns at most one kind — an admin who cancels a paid order in one save should get one
 * message to the customer, not a cancellation and a refund notice simultaneously. Order of the
 * checks below is the priority, and it is deliberate:
 *
 *  - Cancellation wins over refund, because updateOrderStatus auto-flips a paid order's payment
 *    to "refunded" when it is cancelled. Without this precedence that single save would fire two
 *    emails. The cancellation copy covers the refund instead.
 *  - The refund email keys off refund_id appearing, not payment_status becoming "refunded". The
 *    refund is actually issued in the Razorpay dashboard and the reference pasted in afterwards,
 *    so refund_id filling in is the honest signal that money is genuinely on its way back.
 *    payment_status is also accepted as a trigger for admins who never paste a reference.
 */
export function detectOrderEmail(
  before: Pick<Tables<"orders">, "status" | "payment_status" | "refund_id">,
  after: Pick<Tables<"orders">, "status" | "payment_status" | "refund_id">,
): OrderEmailKind | null {
  const statusChanged = after.status !== before.status;

  if (statusChanged && after.status === "cancelled") return "cancelled";

  const refundReferenceAdded = Boolean(after.refund_id) && !before.refund_id;
  const paymentNowRefunded =
    after.payment_status === "refunded" && before.payment_status !== "refunded";
  if (refundReferenceAdded || paymentNowRefunded) return "refunded";

  if (statusChanged && after.status === "shipped") return "shipped";
  if (statusChanged && after.status === "delivered") return "delivered";

  return null;
}

function buildShipped(order: Tables<"orders">) {
  const address = (order.shipping_address as ShippingAddress | null) ?? {};
  const details: { label: string; value: string }[] = [];
  if (order.courier) details.push({ label: "Courier", value: order.courier });
  if (order.tracking_number) {
    details.push({ label: "Tracking No.", value: order.tracking_number });
  }

  const body = `
    ${emailParagraph("Good news — your order has left our studio and is on its way to you.")}
    ${details.length > 0 ? emailPanel(details) : ""}
    ${
      details.length > 0
        ? emailParagraph(
            "Tracking can take up to 24 hours to show movement after dispatch.",
            { muted: true },
          )
        : ""
    }
    ${emailSectionLabel("Delivering to")}
    ${renderAddressBlock(address)}
  `;

  return {
    subject: `Your order has shipped — #${order.order_number}`,
    html: renderEmail({
      preheader: `Order #${order.order_number} is on its way.`,
      heading: "Your order is on its way",
      subheading: `Order #${order.order_number}`,
      body,
      cta: { label: "Track your order", url: `${getSiteUrl()}/track-order` },
      footerNote: "Any questions about your delivery? Just reply to this email.",
    }),
  };
}

function buildDelivered(order: Tables<"orders">) {
  // No review link by design — the customer asked for a written nudge only.
  const body = `
    ${emailParagraph("Your order has been delivered. We hope it's everything you imagined.")}
    ${emailParagraph(
      "If you have a moment, we'd love to hear what you think — your review helps other customers, and it helps us. You can leave one from the product page on our website whenever you're ready.",
    )}
  `;

  return {
    subject: `Your order has been delivered — #${order.order_number}`,
    html: renderEmail({
      preheader: `Order #${order.order_number} has been delivered.`,
      heading: "Your order has arrived",
      subheading: `Order #${order.order_number}`,
      body,
      footerNote: "If anything isn't right, reply to this email and we'll put it straight.",
    }),
  };
}

function buildCancelled(order: Tables<"orders">) {
  const wasPaid = order.payment_status === "paid" || order.payment_status === "refunded";

  const body = `
    ${emailParagraph(`Order #${order.order_number} has been cancelled. It will not be dispatched.`)}
    ${emailPanel([
      { label: "Order", value: `#${order.order_number}` },
      { label: "Order total", value: formatPrice(order.total) },
    ])}
    ${
      wasPaid
        ? emailParagraph(
            "A refund of the amount above is being processed. We'll email you again once it has been issued.",
          )
        : emailParagraph("No payment has been taken for this order.")
    }
  `;

  return {
    subject: `Order cancelled — #${order.order_number}`,
    html: renderEmail({
      preheader: `Order #${order.order_number} has been cancelled.`,
      heading: "Your order has been cancelled",
      subheading: `Order #${order.order_number}`,
      body,
      footerNote: "If this is unexpected, reply to this email and we'll look into it.",
    }),
  };
}

function buildRefunded(order: Tables<"orders">) {
  const rows: { label: string; value: string }[] = [
    { label: "Order", value: `#${order.order_number}` },
    { label: "Refund amount", value: formatPrice(order.total) },
  ];
  if (order.refund_id) rows.push({ label: "Reference", value: order.refund_id });

  const body = `
    ${emailParagraph(`Your refund for order #${order.order_number} has been processed.`)}
    ${emailPanel(rows)}
    ${emailParagraph(
      "Refunds are returned to the original payment method. Banks typically take 5–7 working days to show the amount in your account.",
    )}
  `;

  return {
    subject: `Refund processed — #${order.order_number}`,
    html: renderEmail({
      preheader: `Your refund for order #${order.order_number} has been processed.`,
      heading: "Your refund has been processed",
      subheading: `Order #${order.order_number}`,
      body,
      footerNote: "If the amount hasn't appeared after 7 working days, reply to this email.",
    }),
  };
}

const BUILDERS: Record<OrderEmailKind, (order: Tables<"orders">) => { subject: string; html: string }> =
  {
    shipped: buildShipped,
    delivered: buildDelivered,
    cancelled: buildCancelled,
    refunded: buildRefunded,
  };

export async function sendOrderStatusEmail({
  kind,
  to,
  order,
}: {
  kind: OrderEmailKind;
  to: string;
  order: Tables<"orders">;
}): Promise<{ success: boolean; message: string }> {
  const { subject, html } = BUILDERS[kind](order);
  return sendEmail({ to, subject, html });
}
