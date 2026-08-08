import { getAllCustomers } from "@/lib/data/admin";
import { AdminCustomers } from "@/components/admin/AdminCustomers";

export default async function AdminCustomersPage() {
  const customers = await getAllCustomers();

  return <AdminCustomers customers={customers} />;
}
