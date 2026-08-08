import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Everly White account to track orders, save favourites, and more.",
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Begin Your Story"
      title="Create Your Account"
      subtitle="Sign up to track orders, save favourites, and hear about new arrivals first."
    >
      <SignupForm />
    </AuthShell>
  );
}
