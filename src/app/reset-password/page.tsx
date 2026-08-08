import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Everly White account.",
};

export default async function ResetPasswordPage() {
  // The /auth/callback route should have established a recovery session before landing here.
  // If there's no session, the link was invalid or expired — show that instead of a broken form.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        eyebrow="Password Reset"
        title="Link Expired"
        subtitle="This password reset link is invalid or has expired."
      >
        <div className="border border-neutral-100 bg-pink-100/40 p-8 text-center">
          <p className="font-body text-neutral-400">
            Please request a new password reset link to continue.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-block border-b border-neutral-300 font-heading text-[11.5px] uppercase tracking-widest text-neutral-400 transition-colors hover:border-brown hover:text-brown"
          >
            Request New Link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Set A New Password"
      subtitle="Choose a new password to finish resetting your account."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
