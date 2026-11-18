import { getAdminSections } from "@/lib/data/admin";
import { AdminAbout } from "@/components/admin/AdminAbout";

export default async function AdminAboutPage() {
  const sections = await getAdminSections("about");

  return <AdminAbout sections={sections} />;
}
