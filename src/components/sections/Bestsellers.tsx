import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/sections/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { MultilineText } from "@/components/ui/RichText";
import { text, type SectionValues } from "@/lib/content/sections";
import type { CatalogProduct } from "@/components/products/productTypes";

interface BestsellersProps {
  products: CatalogProduct[];
  content: SectionValues;
}

export function Bestsellers({ products, content }: BestsellersProps) {
  const bannerImage = text(content, "bannerImage");
  const bannerHref = text(content, "bannerHref");
  const bannerCard = (
    <div className="absolute right-0 top-1/2 w-65 -translate-y-1/2 border border-white/40 bg-pink-100/50 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.15)] backdrop-blur-md sm:w-75 sm:p-7">
      <p className="font-heading text-xs uppercase tracking-[0.2em] text-brown">
        {text(content, "bannerEyebrow")}
      </p>
      <p className="mt-3 font-body text-lg italic leading-snug">
        <MultilineText value={text(content, "bannerText")} />
      </p>
    </div>
  );

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            {text(content, "eyebrow")}
          </p>
          <h2 className="mt-3 font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            <MultilineText value={text(content, "heading")} />
          </h2>
        </Reveal>
      </div>

      {/* Clearing the banner image in admin drops the banner rather than leaving a broken frame;
          clearing only its link leaves the image in place as a plain block. */}
      {bannerImage && (
        <Reveal delay={0.1} className="mx-auto mt-10 max-w-content px-6 sm:px-10 lg:px-10">
          {bannerHref ? (
            <Link
              href={bannerHref}
              className="relative block h-105 w-full overflow-hidden text-neutral-500 sm:h-125"
            >
              <Image
                src={bannerImage}
                alt={text(content, "bannerAlt")}
                fill
                sizes="100vw"
                className="object-cover"
              />
              {bannerCard}
            </Link>
          ) : (
            <div className="relative block h-105 w-full overflow-hidden text-neutral-500 sm:h-125">
              <Image
                src={bannerImage}
                alt={text(content, "bannerAlt")}
                fill
                sizes="100vw"
                className="object-cover"
              />
              {bannerCard}
            </div>
          )}
        </Reveal>
      )}

      <div className="mx-auto mt-12 max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal key={product.name} delay={i * 0.08}>
              <ProductCard {...product} showWishlist={false} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
