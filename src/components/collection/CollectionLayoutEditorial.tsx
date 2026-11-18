import { ProductCard } from "@/components/sections/ProductCard";
import { ComeCloserCTA } from "@/components/sections/ComeCloserCTA";
import { CollectionStatsStrip } from "./CollectionStatsStrip";
import { CollectionEyebrow as Eyebrow } from "./Eyebrow";
import type { CollectionInfo } from "./collectionData";

// A "Founder's Note" band used to sit between the product grid and the closing CTA. Nothing ever
// populated it — no migration wrote `metadata.founderNote`, so it rendered a heading above an empty
// pair of quote marks — and the founder's story properly belongs to the About page, which has a
// "Meet the Founder" section of its own (see about_founder in lib/content/sections.ts). It was
// removed rather than given an admin form, so there is only one place to write about the founder.
export function CollectionLayoutEditorial({ collection }: { collection: CollectionInfo }) {
  return (
    <main>
      {/* INTRO */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-175 px-6 text-center sm:px-10">
          <Eyebrow>{collection.storyEyebrow}</Eyebrow>
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
            <Eyebrow>{collection.shopEyebrow}</Eyebrow>
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

      <ComeCloserCTA />
    </main>
  );
}
