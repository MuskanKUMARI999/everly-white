import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset the password for your Everly White account.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Set by /auth/callback when a recovery link could not be redeemed. It used to land here with no
  // explanation at all, which read as the reset simply not working.
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      <ForgotPasswordForm
        notice={
          error === "invalid_link"
            ? "That reset link has expired or has already been used. Enter your email to get a new one."
            : undefined
        }
      />
    </AuthShell>
  );
}
