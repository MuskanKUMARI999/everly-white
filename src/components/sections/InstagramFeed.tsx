import Image from "next/image";
import { FaInstagram } from "react-icons/fa6";
import { Reveal } from "@/components/ui/Reveal";

const INSTAGRAM_URL = "https://www.instagram.com/everlywhitestudios/";

const leftColumn = [
  { src: "/images/instagram/craft-process.jpg", alt: "Hand-setting mirror work on an Everly White plate" },
  { src: "/images/instagram/lifestyle-sofa.jpg", alt: "Everly White plates styled on a living room coffee table" },
];

const rightColumn = [
  { src: "/images/instagram/product-coffee-table.jpg", alt: "Everly White plates on a coffee table with candles" },
  { src: "/images/instagram/product-marble-counter.jpg", alt: "Everly White plates on a marble countertop" },
];

const center = {
  src: "/images/instagram/product-display.jpg",
  alt: "Everly White plates displayed on gold stands",
};

function Tile({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
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
    </a>
  );
}

export function InstagramFeed() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal>
          <h2 className="text-center font-heading text-3xl text-neutral-500 sm:text-4xl">
            Join our Instagram community
          </h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center font-body text-brown hover:underline"
          >
            @everlywhitestudios
          </a>
        </Reveal>

        {/* Mobile: 2-col grid with larger tap targets */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:hidden">
          {[...leftColumn, center, ...rightColumn].map((img) => (
            <Tile key={img.src} {...img} />
          ))}
        </div>

        {/* sm+: 3-col layout with a taller centered feature tile */}
        <div className="mt-10 hidden grid-cols-3 gap-6 sm:grid">
          <div className="flex flex-col gap-6">
            {leftColumn.map((img) => (
              <Tile key={img.src} {...img} />
            ))}
          </div>

          <Tile {...center} className="self-center" />

          <div className="flex flex-col gap-6">
            {rightColumn.map((img) => (
              <Tile key={img.src} {...img} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
