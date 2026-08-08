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
  // Set by the proxy when it turns away a signed-out visitor from a protected page.
  const { next } = await searchParams;

  return (
    <AuthShell
      eyebrow="Welcome Back"
      title="Sign In"
      subtitle="Enter your details to access your account."
    >
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
