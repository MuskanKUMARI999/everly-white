import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/actions";
import { getAddressesByUser } from "@/lib/data/addresses";
import { AddressContent } from "@/components/account/AddressContent";

export const metadata: Metadata = {
  title: "Address Book",
  description: "Manage the addresses your Everly White orders ship to.",
};

export default async function AccountAddressPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const addresses = await getAddressesByUser(user.id);

  return <AddressContent addresses={addresses} />;
}
