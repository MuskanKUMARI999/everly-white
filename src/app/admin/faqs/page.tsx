import { getAdminFaqCategories, getAdminSections } from "@/lib/data/admin";
import { AdminFaqs } from "@/components/admin/AdminFaqs";

export default async function AdminFaqsPage() {
  const categories = await getAdminFaqCategories();
  const sections = await getAdminSections("faqs");

  return <AdminFaqs categories={categories} sections={sections} />;
}
