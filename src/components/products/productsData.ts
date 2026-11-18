import "server-only";

import type { Metadata } from "next";

import {
  getAllProducts as getAllProductsFromDb,
  getAllProductsForStaticParams,
  getProductBySlug as getProductBySlugFromDb,
  getProductsByCategory as getProductsByCategoryFromDb,
  getProductsByCollection as getProductsByCollectionFromDb,
  type ProductWithImages,
} from "@/lib/data/products";
import {
  getAllCollections as getAllCollectionsFromDb,
  getCollectionBySlug as getCollectionBySlugFromDb,
  getCollectionCategoryKey as getCollectionCategoryKeyFromDb,
  type CollectionWithCategory,
} from "@/lib/data/collections";
import {
  DEFAULT_DIMENSIONS,
  type CollectionInfo,
  type CollectionProduct,
} from "@/components/collection/collectionData";
import { orderProductMedia } from "@/lib/data/productMedia";
import { type CatalogProduct } from "./productTypes";

export { productCategories, type CatalogProduct, type ProductCategory } from "./productTypes";

function mapProductToCatalog(product: ProductWithImages): CatalogProduct {
  // Sort first, then choose. PostgREST does not promise the order of an embedded array, so reading
  // `product_images[0]` straight off the response made the card photo a coin toss whenever no row
  // carried is_featured. Ordering by position makes the fallback deterministic, and the admin
  // upload path keeps is_featured pinned to this same first entry.
  const orderedImages = product.product_images
    .slice()
    .sort((a, b) => a.position - b.position);

  const featuredImage =
    orderedImages.find((img) => img.is_featured)?.url ??
    orderedImages[0]?.url ??
    "/images/products/twin-flames-1.png";

  // The second distinct photo, whatever its position number happens to be — deleting an image
  // leaves gaps in the sequence, so matching on `position === 1` used to silently lose the hover.
  const hoverImage = orderedImages.find((img) => img.url !== featuredImage)?.url;

  // Every photo and video, in the one order admin arranged them in. The PDP gallery leads with
  // whatever holds slot 1 — the main pair shot, the lifestyle shot, or a clip. Skipping positions 0
  // and 1 here (because they also feed image/hoverImage) dropped the two best photos of every
  // product and let generic filler images take their slots.
  const galleryMedia = orderProductMedia(product.product_images, product.product_videos).map(
    (entry) =>
      entry.kind === "image"
        ? { type: "image" as const, src: entry.item.url, alt: entry.item.alt ?? product.name }
        : {
            type: "video" as const,
            src: entry.item.url,
            alt: entry.item.alt ?? `${product.name} video`,
          },
  );

  return {
    id: product.id,
    // Carried through rather than re-derived from the name downstream: the product page, cart and
    // wishlist all resolve a product by this exact column value.
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    image: featuredImage,
    hoverImage: hoverImage || undefined,
    tagline: product.tagline ?? "",
    description: product.description ?? "",
    story: product.story ?? "",
    dimensions: product.dimensions ?? DEFAULT_DIMENSIONS,
    // Left undefined when unset so ProductDetailsAccordion applies DEFAULT_COMPOSITION.
    composition: product.composition ?? undefined,
    // Optional specs — the accordion omits each row's line when the field is empty.
    weight: product.weight ?? undefined,
    careInstructions: product.care_instructions ?? undefined,
    makingTime: product.making_time ?? undefined,
    shippingInfo: product.shipping_info ?? undefined,
    category: product.category?.key ?? "all",
    collectionSlug: product.collection?.slug ?? "",
    stock: product.stock_quantity,
    // Was a hardcoded Set of two product *names* in ProductCard, so renaming either piece in admin
    // silently removed its badge and there was no way for the client to move it.
    isFlagship:
      ((product.metadata as Record<string, unknown> | null)?.isFlagship ?? false) === true,
    galleryMedia: galleryMedia.length > 0 ? galleryMedia : undefined,
  };
}

function mapCollectionToCollectionInfo(
  collection: CollectionWithCategory,
  products: CollectionProduct[],
): CollectionInfo {
  const metadata = (collection.metadata as Record<string, unknown>) ?? {};

  return {
    slug: collection.slug,
    name: collection.title,
    category: collection.category?.key ?? "all",
    eyebrow: (metadata.eyebrow as string) ?? collection.subtitle ?? "",
    subtitle: collection.subtitle ?? "",
    heroImage: collection.hero_image ?? "/images/instagram/insta-chair.jpg",
    // The table has no hero_image_alt column, so the descriptive alt text lives in metadata
    // alongside eyebrow/intro/stats. Falling back to the bare title loses the description.
    heroImageAlt: (metadata.heroImageAlt as string) ?? collection.title,
    // The three small-caps lines and the founder photo were hardcoded in the page component until
    // they became editable in Admin → Collections. The defaults below are that original copy, so a
    // collection saved before the fields existed still reads exactly as it did.
    storyEyebrow: (metadata.storyEyebrow as string) ?? "The Story",
    // Field by field, not whole-object: an intro saved with a blank heading used to render an empty
    // <h2>, because the presence of the `intro` key alone was enough to skip the fallback.
    intro: {
      heading: (metadata.intro as CollectionInfo["intro"])?.heading || collection.title,
      paragraphs: (metadata.intro as CollectionInfo["intro"])?.paragraphs?.length
        ? (metadata.intro as CollectionInfo["intro"]).paragraphs
        : collection.description
          ? [collection.description]
          : [],
    },
    stats: (metadata.stats as CollectionInfo["stats"]) ?? [],
    shopEyebrow: (metadata.shopEyebrow as string) ?? "Shop the Collection",
    products,
  };
}

export async function getAllProducts(): Promise<CatalogProduct[]> {
  const products = await getAllProductsFromDb();
  return products.map(mapProductToCatalog);
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const product = await getProductBySlugFromDb(slug);
  return product ? mapProductToCatalog(product) : null;
}

export async function getProductsByCategory(category: string): Promise<CatalogProduct[]> {
  const products = await getProductsByCategoryFromDb(category);
  return products.map(mapProductToCatalog);
}

export async function getProductsByCollection(slug: string): Promise<CatalogProduct[]> {
  const products = await getProductsByCollectionFromDb(slug);
  return products.map(mapProductToCatalog);
}

export async function getAllCollections(): Promise<CollectionInfo[]> {
  const collections = await getAllCollectionsFromDb();
  return Promise.all(
    collections.map(async (collection) => {
      const products = await getProductsByCollectionFromDb(collection.slug);
      return mapCollectionToCollectionInfo(collection, products.map(mapProductToCatalog));
    }),
  );
}

export async function getCollectionBySlug(slug: string): Promise<CollectionInfo | null> {
  const collection = await getCollectionBySlugFromDb(slug);
  if (!collection) return null;
  const products = await getProductsByCollectionFromDb(slug);
  return mapCollectionToCollectionInfo(collection, products.map(mapProductToCatalog));
}

export async function categoryForCollection(slug: string): Promise<string | undefined> {
  const publishedCategory = await getCollectionCategoryKeyFromDb(slug);
  if (publishedCategory) return publishedCategory;

  // Upcoming collections that exist in the catalog but not as full collections yet.
  const UPCOMING_COLLECTION_CATEGORY: Record<string, string> = {
    "celestial-bloom": "coming-soon",
  };
  return UPCOMING_COLLECTION_CATEGORY[slug];
}

export async function generateProductStaticParams() {
  const products = await getAllProductsForStaticParams();
  // The stored slug, not a re-slugified name — the route resolves via getProductBySlug, which
  // matches the column, so deriving the param from the name pre-generates paths that 404.
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateProductMetadata(slug: string): Promise<Metadata> {
  const product = await getProductBySlugFromDb(slug);
  if (!product) return {};

  const metaTitle = product.meta_title?.trim();
  const metaDescription = product.meta_description?.trim();

  return {
    // Admin → Products has a SEO section whose Meta Title and Meta Description were saved to the
    // database and then never read — page metadata was built from the name and tagline instead, so
    // any SEO copy written there had no effect at all.
    //
    // `absolute` when an override exists: the root layout applies a "%s | Everly White" template,
    // and a hand-written meta title normally already carries the brand. The old value here ended
    // "— Everly White" and so rendered as "… — Everly White | Everly White". With no override the
    // bare product name flows through the template and comes out as "Twin Flames | Everly White".
    title: metaTitle ? { absolute: metaTitle } : product.name,
    description: metaDescription || product.tagline || undefined,
  };
}
