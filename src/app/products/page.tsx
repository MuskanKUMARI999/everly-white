import type { Metadata } from "next";
import { ProductsHero } from "@/components/products/ProductsHero";
import { ProductsCatalog } from "@/components/products/ProductsCatalog";
import { CollectionTrustBar } from "@/components/collection/CollectionTrustBar";
import {
  getAllProducts,
  categoryForCollection,
  productCategories,
} from "@/components/products/productsData";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "Products — Everly White",
  description:
    "Shop the full Everly White catalog of hand-finished, mirror-inlay plates.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category, collection } = await searchParams;
  const requestedCategory =
    (typeof collection === "string" ? await categoryForCollection(collection) : undefined) ??
    (typeof category === "string" ? category : undefined);
  const initialCategory = productCategories.some((cat) => cat.key === requestedCategory)
    ? (requestedCategory as string)
    : "all";

  const allProducts = await getAllProducts();
  const [heroBanner] = await getActiveBanners("products_hero");

  return (
    <main>
      <ProductsHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <ProductsCatalog key={initialCategory} products={allProducts} initialCategory={initialCategory} />
      <CollectionTrustBar />
    </main>
  );
}
