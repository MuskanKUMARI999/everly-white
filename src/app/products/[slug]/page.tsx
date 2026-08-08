import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { CollectionTrustBar } from "@/components/collection/CollectionTrustBar";
import { StickyPane } from "@/components/ui/StickyPane";
import { DEFAULT_DIMENSIONS } from "@/components/collection/collectionData";
import { ProductCard } from "@/components/sections/ProductCard";
import { formatPrice } from "@/components/sections/productFormat";
import { ProductGallery, type ProductMediaItem } from "@/components/products/ProductGallery";
import { AddToCartPanel } from "@/components/products/AddToCartPanel";
import { ProductPerks } from "@/components/products/ProductPerks";
import { ProductDetailsAccordion } from "@/components/products/ProductDetailsAccordion";
import { ProductStoryQuote } from "@/components/products/ProductStoryQuote";
import { ProductMakingSplit } from "@/components/products/ProductMakingSplit";
import { ProductReviews } from "@/components/products/ProductReviews";
import {
  generateProductStaticParams,
  generateProductMetadata,
  getProductBySlug,
  getCollectionBySlug,
  getAllProducts,
} from "@/components/products/productsData";

export async function generateStaticParams() {
  return generateProductStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateProductMetadata(slug);
}

// A photo uploaded through Admin → Products is stored as an absolute Supabase Storage URL, not a
// path under public/. Passing one to path.join produces "public\https:\<host>\..." — never a real
// file — so stat'ing it would drop every admin-uploaded photo from the gallery and let a generic
// filler take its slot. Only same-origin /public paths can be checked on disk; anything else is
// served by a host we can't stat, so trust it (next.config.ts already allowlists *.supabase.co).
function isLocalAsset(src: string) {
  return src.startsWith("/") && !src.startsWith("//");
}

// Cache filesystem lookups across requests — the set of public assets is stable at runtime.
const imageExistsCache = new Map<string, boolean>();
function imageExists(src: string) {
  if (!isLocalAsset(src)) return true;
  const cached = imageExistsCache.get(src);
  if (cached !== undefined) return cached;
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));
  imageExistsCache.set(src, exists);
  return exists;
}

// Placeholder assets standing in until real per-product photography/video is shot.
// Target set per product is 6 images + 2 videos — swap these out (or add a `src` to the
// video entries once clips exist) without touching the gallery component itself.
const FILLER_IMAGES: { src: string; alt: string }[] = [
  { src: "/images/instagram/lifestyle-sofa.jpg", alt: "Everly White plates styled on a living room coffee table" },
  { src: "/images/instagram/product-marble-counter.jpg", alt: "Everly White plates styled on a marble countertop" },
  { src: "/images/instagram/product-display.jpg", alt: "Everly White plates styled for display" },
  { src: "/images/instagram/product-coffee-table.jpg", alt: "Everly White plates styled on a coffee table" },
  { src: "/images/instagram/insta-card.jpg", alt: "Everly White plates styled in a home setting" },
];

const VIDEO_PLACEHOLDERS: { alt: string; poster: string }[] = [
  { alt: "Handcrafted, start to finish — video coming soon", poster: "/images/instagram/craft-process.jpg" },
  { alt: "Styled at home — video coming soon", poster: "/images/instagram/insta-window.jpg" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const collection = await getCollectionBySlug(product.collectionSlug);

  const ownPhotos: ProductMediaItem[] = product.galleryImages
    ? product.galleryImages
        .filter((photo) => imageExists(photo.src))
        .map((photo) => ({ type: "image" as const, src: photo.src, alt: photo.alt }))
    : [
        { type: "image", src: product.image, alt: product.name },
        ...(product.hoverImage && imageExists(product.hoverImage)
          ? [{ type: "image" as const, src: product.hoverImage, alt: product.name }]
          : []),
      ];

  const fillerPhotos: ProductMediaItem[] = FILLER_IMAGES.slice(0, 6 - ownPhotos.length).map((f) => ({
    type: "image",
    src: f.src,
    alt: f.alt,
  }));

  const videoSlots: ProductMediaItem[] = product.videos?.length
    ? product.videos.map((src, i) => ({
        type: "video" as const,
        src,
        alt: `${product.name} video ${i + 1}`,
      }))
    : VIDEO_PLACEHOLDERS.map((v) => ({
        type: "video",
        alt: v.alt,
        poster: v.poster,
      }));

  const galleryMedia: ProductMediaItem[] = [...ownPhotos, ...fillerPhotos, ...videoSlots];

  const allProducts = await getAllProducts();
  const related = allProducts.filter((item) => item.name !== product.name).slice(0, 4);

  return (
    <main>
      <div className="mx-auto max-w-content px-6 pt-8 sm:px-10 sm:pt-10 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
        >
          <Link href="/" className="text-neutral-400 hover:text-brown">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link href="/products" className="text-neutral-400 hover:text-brown">
            Products
          </Link>
          <span className="text-neutral-300">/</span>
          <span aria-current="page" className="text-brown">
            {product.name}
          </span>
        </nav>
      </div>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-6 sm:px-10 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:gap-10 lg:px-10">
          <ProductGallery media={galleryMedia} />

          <StickyPane>
            {collection && <Eyebrow>{collection.eyebrow}</Eyebrow>}
            <h1 className="mt-3 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="font-body text-xl text-brown">{formatPrice(product.price)}</p>
              <span className="bg-pink-100 px-3 py-1 font-heading text-[11px] uppercase tracking-[0.15em] text-brown">
                Introductory Price
              </span>
            </div>
            <p className="mt-4 font-body text-base italic leading-relaxed text-neutral-400">
              {product.tagline}
            </p>
            <p className="mt-4 font-body text-[15px] text-neutral-300">{product.description}</p>

            <AddToCartPanel
              productName={product.name}
              slug={product.slug}
              price={product.price}
              image={product.image}
              hoverImage={product.hoverImage}
              stock={product.stock}
            />
            <ProductPerks />

            <ProductDetailsAccordion
              dimensions={product.dimensions ?? DEFAULT_DIMENSIONS}
              composition={product.composition}
              weight={product.weight}
              careInstructions={product.careInstructions}
              makingTime={product.makingTime}
              shippingInfo={product.shippingInfo}
            />
          </StickyPane>
        </div>
      </section>

      <ProductStoryQuote quote={product.story} />

      {product.id && <ProductReviews productId={product.id} productName={product.name} />}

      {related.length > 0 && (
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
            <div className="text-center">
              <Eyebrow>More to Love</Eyebrow>
              <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
                You May Also Like
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.name} {...item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {collection && <ProductMakingSplit collection={collection} />}

      <CollectionTrustBar />
    </main>
  );
}
