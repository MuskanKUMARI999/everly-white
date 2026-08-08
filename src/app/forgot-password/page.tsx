import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset the password for your Everly White account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Forgot Password?"
      subtitle="Enter your email and we'll send you a link to reset your password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
