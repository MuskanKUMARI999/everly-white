import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/actions";
import { AccountDetailsContent } from "@/components/account/AccountDetailsContent";

export const metadata: Metadata = {
  title: "Account Details",
  description: "Update your name, email, and phone number.",
};

export default async function AccountDetailsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();

  return (
    <AccountDetailsContent
      fullName={profile?.full_name ?? ""}
      email={user.email ?? ""}
      phone={profile?.phone ?? ""}
    />
  );
}
