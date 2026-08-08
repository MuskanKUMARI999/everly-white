"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNewsletterWelcomeEmail } from "@/lib/email/newsletterWelcome";
import type { FormResult } from "@/lib/cart/types";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Optional lead details captured by the welcome popup. The footer form supplies none of these and
// still calls subscribeToNewsletter(email) — the second argument is optional so it stays valid.
export interface NewsletterLead {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export async function subscribeToNewsletter(
  email: string,
  lead: NewsletterLead = {},
): Promise<FormResult> {
  const trimmed = email.trim().toLowerCase();

  if (!EMAIL_RE.test(trimmed)) {
    return { success: false, message: "Please enter a valid email address." };
  }

  const firstName = lead.firstName?.trim() || null;
  const lastName = lead.lastName?.trim() || null;
  const phone = lead.phone?.trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").insert({
    email: trimmed,
    first_name: firstName,
    last_name: lastName,
    phone,
  });

  if (error) {
    if (error.code === "23505") {
      // Already on the list — deliberately no second welcome email, and no second coupon.
      return { success: true, message: "You're already subscribed." };
    }
    console.error("Error subscribing to newsletter:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  // Best-effort: the subscription is already saved, so a mail failure must not report failure
  // back to someone who genuinely is subscribed. Reaching here means the insert was new, so
  // this fires exactly once per subscriber.
  await sendNewsletterWelcomeEmail({ to: trimmed, firstName }).catch((e) => {
    console.error("Failed to send newsletter welcome email:", e);
  });

  return { success: true, message: "Thanks for subscribing!" };
}
