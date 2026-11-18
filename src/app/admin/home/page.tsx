import { getAdminSections } from "@/lib/data/admin";
import { AdminHome } from "@/components/admin/AdminHome";

export default async function AdminHomePage() {
  const sections = await getAdminSections("home");

  return <AdminHome sections={sections} />;
}
