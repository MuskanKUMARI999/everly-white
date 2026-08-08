import { getAllOrders } from "@/lib/data/admin";
import { AdminOrders } from "@/components/admin/AdminOrders";

export default async function AdminOrdersPage() {
  const orders = await getAllOrders();
  return <AdminOrders orders={orders} />;
}
