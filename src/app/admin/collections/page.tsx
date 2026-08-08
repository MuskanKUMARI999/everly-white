import { getAllCollections, getAllCategories } from "@/lib/data/admin";
import { AdminCollections } from "@/components/admin/AdminCollections";

export default async function AdminCollectionsPage() {
  const [collections, categories] = await Promise.all([
    getAllCollections(),
    getAllCategories(),
  ]);

  return <AdminCollections collections={collections} categories={categories} />;
}
