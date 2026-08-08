import Image from "next/image";
import { Play } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const clips: { image: string; caption: string; objectPosition?: string }[] = [
  {
    image: "/images/products/twin-flames/1-pair.jpg",
    caption: "100 Hours of Handcraft",
  },
  {
    image: "/images/instagram/product-coffee-table.jpg",
    caption: "Styled: Center of the Universe",
  },
  {
    image: "/images/brand/packaging-flatlay.jpg",
    caption: "Unboxing: Twin Flames",
    objectPosition: "80% 60%",
  },
];

export function VideoShowcase() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
        <Reveal>
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            In Motion
          </p>
          <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
            See the Craft Come to Life
          </h2>
        </Reveal>
      </div>

      <div className="mx-auto mt-12 max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {clips.map((clip, i) => (
            <Reveal key={clip.caption} delay={i * 0.1}>
            <button
              type="button"
              className="cursor-pointer group relative block aspect-3/4 w-full overflow-hidden text-left"
            >
              <Image
                src={clip.image}
                alt={clip.caption}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                style={clip.objectPosition ? { objectPosition: clip.objectPosition } : undefined}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent" />
              <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                <Play size={18} className="ml-0.5 fill-beige-light text-beige-light" />
              </span>
              <span className="absolute bottom-5 left-5 font-heading text-xs uppercase tracking-[0.16em] text-beige-light">
                {clip.caption}
              </span>
            </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
