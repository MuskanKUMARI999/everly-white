import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { getAllCollections } from "@/lib/data/collections";

interface CategoryTile {
  name: string;
  image: string;
  href: string;
  badge?: string;
}

const FALLBACK_IMAGE = "/images/banners/category-1.jpeg";

// Upcoming collections aren't published in the database yet, so they can't come from
// getAllCollections. Kept here as a teaser tile so the grid stays balanced and the "coming soon"
// preview is preserved (mirrors the header mega-menu's treatment).
const UPCOMING_TILES: CategoryTile[] = [
  {
    name: "Celestial Bloom",
    image: "/images/banners/category-2.png",
    href: "/products?collection=celestial-bloom",
    badge: "Coming Soon",
  },
];

export async function ShopByCategory() {
  const collections = await getAllCollections();
  const tiles: CategoryTile[] = [
    ...collections.map((collection) => {
      // The tile wants a squarer crop than the collection page hero, so it gets its own
      // image in metadata; hero_image is the fallback when none is set.
      const metadata = (collection.metadata as Record<string, unknown>) ?? {};
      const tileImage = typeof metadata.tileImage === "string" ? metadata.tileImage : null;

      return {
        name: collection.title,
        image: tileImage ?? collection.hero_image ?? FALLBACK_IMAGE,
        href: `/collection/${collection.slug}`,
      };
    }),
    ...UPCOMING_TILES,
  ];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <h2 className="text-center font-heading text-xs uppercase tracking-[0.2em] text-neutral-500">
            Shop By Category
          </h2>
        </Reveal>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {tiles.map((tile, i) => (
            <Reveal key={tile.href} delay={i * 0.1}>
              <Link
                href={tile.href}
                className="group block border border-transparent transition-colors hover:border-brown"
              >
                <div className="relative aspect-9/8 overflow-hidden">
                  <Image
                    src={tile.image}
                    alt={tile.name}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
                <p className="border-t border-transparent py-3 text-center font-heading text-sm uppercase tracking-[0.15em] text-neutral-500">
                  {tile.name}
                  {tile.badge && (
                    <span className="ml-2 font-heading text-[11px] normal-case tracking-widest text-neutral-300">
                      ({tile.badge})
                    </span>
                  )}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
