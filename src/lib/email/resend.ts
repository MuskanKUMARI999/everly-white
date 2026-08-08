const RESEND_API_URL = "https://api.resend.com/emails";

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  // Optional. Customers replying to a transactional email should reach a mailbox somebody reads —
  // the from address is often a send-only alias with no inbox behind it.
  const replyTo = process.env.RESEND_REPLY_TO?.trim() || undefined;
  return { apiKey, fromEmail, replyTo };
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  /** Overrides RESEND_REPLY_TO for this send. Used by admin alerts to reply straight to the customer. */
  replyTo?: string;
}): Promise<{ success: boolean; message: string }> {
  const config = getResendConfig();
  if (!config) {
    console.warn(`Resend not configured — skipping email "${subject}" to ${to}.`);
    return { success: false, message: "Email provider not configured." };
  }

  const effectiveReplyTo = replyTo?.trim() || config.replyTo;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to,
      subject,
      html,
      ...(effectiveReplyTo ? { reply_to: effectiveReplyTo } : {}),
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("Resend send failed:", error);
    return { success: false, message: "Failed to send email." };
  }

  return { success: true, message: "Email sent." };
}
