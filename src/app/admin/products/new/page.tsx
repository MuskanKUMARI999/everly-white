import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllCategories, getAllCollections } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    getAllCategories(),
    getAllCollections(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:text-brown"
        >
          <ArrowLeft size={14} strokeWidth={1.4} />
          Back to Products
        </Link>
      </div>
      <h2 className="font-heading text-2xl font-light text-neutral-500">Add New Product</h2>
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}
