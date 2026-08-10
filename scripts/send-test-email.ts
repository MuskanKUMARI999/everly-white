import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { sendEmail } from "@/lib/email/resend";
import {
  emailPanel,
  emailParagraph,
  emailSectionLabel,
  getSiteUrl,
  renderEmail,
} from "@/lib/email/layout";

/**
 * Send one test email through the real pipeline, to prove the mail configuration works.
 *
 * Without this the only way to know Resend is wired up correctly is to place a live order and wait
 * — which is a poor thing to discover is broken after launch. This uses the same sendEmail() and
 * the same renderEmail() shell as every real message, so a passing run verifies the API key, the
 * from address, the reply-to, the branded layout, the logo and every link at once.
 *
 * Usage: npx tsx scripts/send-test-email.ts <recipient@example.com>
 */

/** Show enough of the key to tell two keys apart, never enough to use one. */
function maskKey(key: string): string {
  return key.length <= 12 ? "set" : `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function reportConfig(): { ok: boolean; siteUrlIsLocal: boolean } {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;
  const adminAlert = process.env.ADMIN_ALERT_EMAIL;
  const siteUrl = getSiteUrl();

  console.log("Mail configuration in this environment:\n");
  console.log(`  RESEND_API_KEY       ${apiKey ? maskKey(apiKey) : "MISSING — nothing can send"}`);
  console.log(`  RESEND_FROM_EMAIL    ${fromEmail ?? "MISSING — nothing can send"}`);
  console.log(`  RESEND_REPLY_TO      ${replyTo ?? "not set (replies go to the from address)"}`);
  console.log(`  ADMIN_ALERT_EMAIL    ${adminAlert ?? "not set (owner alerts are skipped)"}`);
  console.log(`  NEXT_PUBLIC_SITE_URL ${siteUrl}\n`);

  const siteUrlIsLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(siteUrl);
  if (siteUrlIsLocal) {
    console.warn(
      "  ⚠  NEXT_PUBLIC_SITE_URL points at localhost. The test email will arrive with a broken\n" +
        "     logo and dead buttons — expected locally, but it must be https://everlywhite.com\n" +
        "     in production, and set BEFORE the build runs.\n",
    );
  }

  return { ok: Boolean(apiKey && fromEmail), siteUrlIsLocal };
}

async function main() {
  const recipient = process.argv[2]?.trim();
  if (!recipient || !/^\S+@\S+\.\S+$/.test(recipient)) {
    console.error("Usage: npx tsx scripts/send-test-email.ts <recipient@example.com>");
    process.exit(1);
  }

  const { ok, siteUrlIsLocal } = reportConfig();
  if (!ok) {
    console.error("Cannot send: RESEND_API_KEY and RESEND_FROM_EMAIL are both required.");
    process.exit(1);
  }

  const sentAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const body = `
    ${emailParagraph(
      "This is a test message from the Everly White store. If it has reached you, the mail configuration on this environment is working.",
    )}
    ${emailSectionLabel("What this proves")}
    ${emailPanel([
      { label: "Sent at", value: `${sentAt} IST` },
      { label: "Site URL", value: getSiteUrl() },
      { label: "Sent to", value: recipient },
    ])}
    ${emailParagraph(
      "Check that the logo above appears, that the button below opens the live site, and that hitting Reply addresses the shop's real inbox. If any of those are wrong, the email settings need another look.",
      { muted: true },
    )}
  `;

  console.log(`Sending to ${recipient}…`);

  const result = await sendEmail({
    to: recipient,
    subject: "Everly White — mail configuration test",
    html: renderEmail({
      preheader: "A test of the Everly White mail configuration.",
      heading: "Mail configuration test",
      subheading: sentAt,
      body,
      cta: { label: "Open the site", url: getSiteUrl() },
      footerNote: "Nobody but you was sent this message.",
    }),
  });

  if (!result.success) {
    console.error(`\n❌ ${result.message} See the error logged above for the reason.`);
    process.exit(1);
  }

  console.log("\n✅ Resend accepted the message.");
  console.log("   Accepted is not the same as delivered — check the inbox, and the spam folder.");
  if (siteUrlIsLocal) {
    console.log("   Ignore the broken logo and dead links: that is the localhost URL, not a fault.");
  }
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
