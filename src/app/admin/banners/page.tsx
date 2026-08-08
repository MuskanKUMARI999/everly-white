import { getAllBanners } from "@/lib/data/admin";
import { AdminBanners } from "@/components/admin/AdminBanners";

export default async function AdminBannersPage() {
  const banners = await getAllBanners();

  return <AdminBanners banners={banners} />;
}
