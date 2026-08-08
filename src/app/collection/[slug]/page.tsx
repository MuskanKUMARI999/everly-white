import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionHero } from "@/components/collection/CollectionHero";
import { CollectionLayoutEditorial } from "@/components/collection/CollectionLayoutEditorial";
import { getCollectionBySlug } from "@/components/products/productsData";
import { getAllCollectionsForStaticParams } from "@/lib/data/collections";
import { getActiveBanners } from "@/lib/data/banners";

export async function generateStaticParams() {
  const collections = await getAllCollectionsForStaticParams();
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  return {
    title: collection.name,
    description: collection.subtitle,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const [heroBanner] = await getActiveBanners("collection_hero");

  return (
    <>
      <CollectionHero
        eyebrow={collection.eyebrow}
        title={collection.name}
        subtitle={collection.subtitle}
        image={heroBanner?.image_url ?? collection.heroImage}
        imageAlt={heroBanner?.alt ?? collection.heroImageAlt}
      />
      <CollectionLayoutEditorial collection={collection} />
    </>
  );
}
