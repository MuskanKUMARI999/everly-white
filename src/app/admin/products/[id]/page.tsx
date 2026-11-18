import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductById, getAllCategories, getAllCollections } from "@/lib/data/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductMediaPanel } from "@/components/admin/ProductMediaPanel";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories, collections] = await Promise.all([
    getProductById(id),
    getAllCategories(),
    getAllCollections(),
  ]);

  if (!product) notFound();

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
      <h2 className="font-heading text-2xl font-light text-neutral-500">Edit Product</h2>
      <ProductMediaPanel product={product} />
      <ProductForm product={product} categories={categories} collections={collections} />
    </div>
  );
}
