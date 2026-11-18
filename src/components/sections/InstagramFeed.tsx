import Image from "next/image";
import { FaInstagram } from "react-icons/fa6";
import { Reveal } from "@/components/ui/Reveal";
import { list, text, type SectionValues } from "@/lib/content/sections";

function Tile({
  src,
  alt,
  href,
  className = "",
}: {
  src: string;
  alt: string;
  /** Blank when the profile URL has been cleared in admin — the tile then stops being a link. */
  href: string;
  className?: string;
}) {
  // An empty href is not a harmless no-op: it resolves to the current page, so clicking a tile
  // would silently reload the homepage.
  const Wrapper = href ? "a" : "div";
  const linkProps = href
    ? ({ href, target: "_blank", rel: "noopener noreferrer" } as const)
    : {};

  return (
    <Wrapper
      {...linkProps}
      className={`group relative aspect-square overflow-hidden ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 640px) 33vw, 45vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-500/0 transition-colors group-hover:bg-neutral-500/30">
        <FaInstagram
          size={26}
          className="text-white opacity-0 transition-opacity group-hover:opacity-100"
        />
      </div>
    </Wrapper>
  );
}

export function InstagramFeed({ content }: { content: SectionValues }) {
  const profileUrl = text(content, "profileUrl");
  const tiles = list(content, "tiles").filter((tile) => tile.src);
  if (tiles.length === 0) return null;

  // The desktop layout is two columns flanking one taller tile, so the middle of the list is the
  // feature. Deriving it from the length keeps that intact however many tiles the client adds,
  // and the mobile grid just renders the list in order — which is the same reading order.
  const centerIndex = Math.floor(tiles.length / 2);
  const leftColumn = tiles.slice(0, centerIndex);
  const center = tiles[centerIndex];
  const rightColumn = tiles.slice(centerIndex + 1);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <h2 className="text-center font-heading text-3xl text-neutral-500 sm:text-4xl">
            {text(content, "heading")}
          </h2>
          {profileUrl ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center font-body text-brown hover:underline"
            >
              {text(content, "handle")}
            </a>
          ) : (
            <p className="mt-3 block text-center font-body text-brown">{text(content, "handle")}</p>
          )}
        </Reveal>

        {/* Mobile: 2-col grid with larger tap targets */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:hidden">
          {tiles.map((tile, i) => (
            <Tile key={`${i}-${tile.src}`} src={tile.src} alt={tile.alt} href={profileUrl} />
          ))}
        </div>

        {/* sm+: 3-col layout with a taller centered feature tile */}
        <div className="mt-10 hidden grid-cols-3 gap-6 sm:grid">
          <div className="flex flex-col gap-6">
            {leftColumn.map((tile, i) => (
              <Tile key={`${i}-${tile.src}`} src={tile.src} alt={tile.alt} href={profileUrl} />
            ))}
          </div>

          <Tile src={center.src} alt={center.alt} href={profileUrl} className="self-center" />

          <div className="flex flex-col gap-6">
            {rightColumn.map((tile, i) => (
              <Tile key={`${i}-${tile.src}`} src={tile.src} alt={tile.alt} href={profileUrl} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
