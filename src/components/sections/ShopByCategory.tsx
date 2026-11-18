import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { getAllCollections } from "@/lib/data/collections";
import { list, text, type SectionValues } from "@/lib/content/sections";

interface CategoryTile {
  name: string;
  image: string;
  href: string;
  badge?: string;
}

export async function ShopByCategory({ content }: { content: SectionValues }) {
  const collections = await getAllCollections();
  const fallbackImage = text(content, "fallbackImage");

  // Published collections lead; the extra tiles from Admin → Home Page follow. Those exist for
  // collections that aren't in the database yet (the "coming soon" teasers), which is why they
  // can't come from getAllCollections and are kept as editable rows instead.
  const tiles: CategoryTile[] = [
    ...collections.map((collection) => {
      // The tile wants a squarer crop than the collection page hero, so it gets its own
      // image in metadata; hero_image is the fallback when none is set.
      const metadata = (collection.metadata as Record<string, unknown>) ?? {};
      const tileImage = typeof metadata.tileImage === "string" ? metadata.tileImage : null;

      return {
        name: collection.title,
        image: tileImage ?? collection.hero_image ?? fallbackImage,
        href: `/collection/${collection.slug}`,
      };
    }),
    ...list(content, "upcoming")
      // A half-filled row typed into admin would otherwise render as a broken image tile.
      .filter((tile) => tile.image && tile.href)
      .map((tile) => ({
        name: tile.name,
        image: tile.image,
        href: tile.href,
        badge: tile.badge || undefined,
      })),
  ].filter((tile) => tile.image);

  if (tiles.length === 0) return null;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <h2 className="text-center font-heading text-xs uppercase tracking-[0.2em] text-neutral-500">
            {text(content, "heading")}
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
