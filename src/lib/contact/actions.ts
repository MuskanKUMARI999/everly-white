"use server";

import { createClient } from "@/lib/supabase/server";
import { sendNewContactAlert } from "@/lib/email/adminAlerts";
import type { FormResult } from "@/lib/cart/types";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

interface ContactFormInput {
  name: string;
  email: string;
  inquiryType: string;
  subject: string;
  message: string;
}

export async function submitContactForm(input: ContactFormInput): Promise<FormResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();
  const subjectText = input.subject.trim();
  const inquiryType = input.inquiryType.trim();

  if (!name) return { success: false, message: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { success: false, message: "Please enter a valid email address." };
  if (!inquiryType) return { success: false, message: "Please select what your inquiry is about." };
  if (!message) return { success: false, message: "Please enter a message." };

  const subject = subjectText ? `${inquiryType} — ${subjectText}` : inquiryType;

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("Error submitting contact form:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  // Best-effort: the message is already saved and visible in the admin panel, so a mail failure
  // must not tell the sender their message failed.
  await sendNewContactAlert({ name, email, subject, message }).catch((e) => {
    console.error("Failed to send contact form admin alert:", e);
  });

  return { success: true, message: "Message sent." };
}
