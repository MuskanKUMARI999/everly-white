import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/sections/ProductCard";
import { ComeCloserCTA } from "@/components/sections/ComeCloserCTA";
import { CollectionStatsStrip } from "./CollectionStatsStrip";
import { CollectionEyebrow as Eyebrow } from "./Eyebrow";
import type { CollectionInfo } from "./collectionData";

export function CollectionLayoutEditorial({ collection }: { collection: CollectionInfo }) {
  return (
    <main>
      {/* INTRO */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-175 px-6 text-center sm:px-10">
          <Eyebrow>The Story</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
            {collection.intro.heading}
          </h2>
          {collection.intro.paragraphs.map((p) => (
            <p key={p} className="mt-5 font-body text-neutral-300">
              {p}
            </p>
          ))}
        </div>

        <CollectionStatsStrip stats={collection.stats} />
      </section>

      {/* PRODUCT GRID */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="text-center">
            <Eyebrow>Shop the Collection</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
              {collection.name}
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
            {collection.products.map((product) => (
              <ProductCard key={product.name} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER'S NOTE */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 overflow-hidden border border-neutral-100 bg-beige-light lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-70 lg:min-h-full">
              <Image
                src="/images/instagram/craft-process.jpg"
                alt="An artisan hand-finishing an Everly White plate"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              <Eyebrow>From the Studio</Eyebrow>
              <h3 className="mt-3 font-heading text-2xl text-neutral-500 sm:text-3xl">
                {collection.founderNote.heading}
              </h3>
              <p className="mt-5 font-body text-lg italic leading-relaxed text-neutral-400">
                &ldquo;{collection.founderNote.quote}&rdquo;
              </p>
              <p className="mt-4 font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-300">
                — {collection.founderNote.attribution}
              </p>
              <Button href="/about" variant="secondary" icon={false} className="mt-7 w-fit">
                Read Our Story
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ComeCloserCTA />
    </main>
  );
}
