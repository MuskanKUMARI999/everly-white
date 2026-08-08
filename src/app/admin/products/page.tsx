import { getAllProducts } from "@/lib/data/admin";
import { AdminProducts } from "@/components/admin/AdminProducts";

export default async function AdminProductsPage() {
  const products = await getAllProducts();
  return <AdminProducts products={products} />;
}
