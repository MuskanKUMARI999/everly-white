import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/actions";
import { getOrdersByUser } from "@/lib/data/orders";
import { OrdersContent } from "@/components/account/OrdersContent";

export const metadata: Metadata = {
  title: "Orders",
  description: "Track and review your Everly White orders.",
};

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await getOrdersByUser(user.id);

  return <OrdersContent orders={orders} />;
}
