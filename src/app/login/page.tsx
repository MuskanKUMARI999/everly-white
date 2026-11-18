import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Everly White account to track orders, save favourites, and more.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // next: set by the proxy when it turns away a signed-out visitor from a protected page.
  // error: set by /auth/callback when a confirmation link could not be redeemed — expired, already
  // used, or opened in a different browser from the one that signed up. Without showing it, that
  // customer arrived at a blank sign-in page with no idea why.
  const { next, error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign In"
      subtitle="Enter your details to access your account."
    >
      <LoginForm
        next={typeof next === "string" ? next : undefined}
        notice={
          error === "invalid_link"
            ? "That confirmation link has expired or has already been used. Sign in below — if your email is confirmed, your account is ready."
            : undefined
        }
      />
    </AuthShell>
  );
}
