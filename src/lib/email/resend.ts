import { htmlToPlainText } from "@/lib/email/layout";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * How long to wait on Resend before giving up.
 *
 * Sends sit inside request paths that matter more than the email does — fulfillOrder awaits two of
 * them before the customer's payment confirmation returns. An unbounded fetch would let a slow or
 * hanging provider stall that response indefinitely. Every send is best-effort, so abandoning one
 * is always the cheaper failure.
 */
const SEND_TIMEOUT_MS = 10_000;

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

  let res: Response;
  try {
    res = await fetch(RESEND_API_URL, {
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
        // Multipart: HTML-only mail scores worse with spam filters. Derived from the HTML in one
        // place so no template has to maintain a second copy of its own words.
        text: htmlToPlainText(html),
        ...(effectiveReplyTo ? { reply_to: effectiveReplyTo } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (e) {
    // Timeout, DNS failure, connection reset. Reported rather than thrown so callers keep their
    // one code path for "the email didn't go" — an order must complete either way.
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    console.error(
      timedOut
        ? `Resend timed out after ${SEND_TIMEOUT_MS}ms — skipping email "${subject}" to ${to}.`
        : "Resend request failed:",
      timedOut ? "" : e,
    );
    return { success: false, message: "Failed to send email." };
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error("Resend send failed:", error);
    return { success: false, message: "Failed to send email." };
  }

  return { success: true, message: "Email sent." };
}
