import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/actions";
import { getOrdersByUser } from "@/lib/data/orders";
import { getAddressesByUser } from "@/lib/data/addresses";
import { getWishlistCount } from "@/lib/data/wishlist";
import { DashboardContent, type DashboardOrder } from "@/components/account/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Everly White account overview — recent orders, wishlist, and saved details.",
};

export default async function AccountDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, orders, addresses, wishlistCount] = await Promise.all([
    getCurrentProfile(),
    getOrdersByUser(user.id),
    getAddressesByUser(user.id),
    getWishlistCount(user.id),
  ]);

  const recentOrders: DashboardOrder[] = orders.slice(0, 2).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    date: order.created_at,
    status: order.status,
    total: Number(order.total),
    items: order.order_items.map((item) => ({
      name: item.product_name,
      image: item.product_image,
    })),
  }));

  const firstName = (profile?.full_name ?? user.email ?? "there").split(/\s+/)[0];

  return (
    <DashboardContent
      firstName={firstName}
      orders={recentOrders}
      orderCount={orders.length}
      addressCount={addresses.length}
      wishlistCount={wishlistCount}
    />
  );
}
