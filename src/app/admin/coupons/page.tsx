import { getAllCoupons } from "@/lib/data/admin";
import { AdminCoupons } from "@/components/admin/AdminCoupons";

export default async function AdminCouponsPage() {
  const coupons = await getAllCoupons();

  return <AdminCoupons coupons={coupons} />;
}
