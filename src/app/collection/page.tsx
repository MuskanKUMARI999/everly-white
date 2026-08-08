import { redirect } from "next/navigation";
import { getAllCollections } from "@/components/products/productsData";

export default async function CollectionIndexPage() {
  const collections = await getAllCollections();
  if (collections.length === 0) redirect("/products");
  redirect(`/collection/${collections[0].slug}`);
}
