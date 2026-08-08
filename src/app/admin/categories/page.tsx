import { getAllCategories } from "@/lib/data/admin";
import { AdminCategories } from "@/components/admin/AdminCategories";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();
  return <AdminCategories categories={categories} />;
}
