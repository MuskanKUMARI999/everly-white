import Image from "next/image";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import type { CollectionInfo } from "@/components/collection/collectionData";

export function ProductMakingSplit({ collection }: { collection: CollectionInfo }) {
  const { stats, intro } = collection;
  // Find the hand-craft-hours stat by label rather than position, so reordering `stats` can't
  // silently swap in the wrong number.
  const hoursStat = stats.find((stat) => /hour/i.test(stat.label)) ?? stats[stats.length - 1];

  return (
    <section className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>The Making</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
              {hoursStat.value} Hours, Held by One Pair of Hands
            </h2>
            <p className="mt-5 font-body text-neutral-300">{intro.paragraphs[1]}</p>

            <div className="mt-8 flex gap-10">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-3xl text-brown">{stat.value}</p>
                  <p className="mt-1 font-body text-[13px] uppercase tracking-[0.06em] text-neutral-300">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative aspect-3/4">
              <Image
                src="/images/instagram/craft-process.jpg"
                alt="Hand-setting mirror work on an Everly White plate"
                fill
                sizes="(min-width: 1024px) 22vw, 45vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-3/4 overflow-hidden bg-neutral-50">
              <video
                src="/videos/the-making.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
