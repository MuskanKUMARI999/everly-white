import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { ContentIcon } from "@/components/ui/ContentIcon";
import { MultilineText } from "@/components/ui/RichText";
import { list, text, type ListItem, type SectionValues } from "@/lib/content/sections";

function FeatureItem({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="text-center">
      <ContentIcon name={icon} size={28} strokeWidth={1.3} className="mx-auto text-brown" />
      <h4 className="mt-6 font-heading text-base uppercase tracking-[0.05em] text-neutral-500">{title}</h4>
      <p className="mx-auto mt-4 max-w-xs font-body text-neutral-300">{description}</p>
    </div>
  );
}

function Column({ items, offset }: { items: ListItem[]; offset: number }) {
  return (
    <>
      {items.map((item, i) => (
        <Reveal key={`${offset + i}-${item.title}`} delay={i * 0.1}>
          <FeatureItem title={item.title} description={item.description} icon={item.icon} />
        </Reveal>
      ))}
    </>
  );
}

export function ElevateExperience({ content }: { content: SectionValues }) {
  const features = list(content, "features").filter((item) => item.title || item.description);
  // The two columns flank the centre image, so an odd count leans to the left — Math.ceil rather
  // than a fixed split keeps the layout balanced whatever the client adds or removes.
  const split = Math.ceil(features.length / 2);
  const leftItems = features.slice(0, split);
  const rightItems = features.slice(split);
  const image = text(content, "image");

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal className="text-center">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            {text(content, "eyebrow")}
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            <MultilineText value={text(content, "heading")} />
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-3">
          <div className="order-2 flex flex-col gap-12 lg:order-1">
            <Column items={leftItems} offset={0} />
          </div>

          {image && (
            <Reveal
              delay={0.1}
              className="relative order-1 mx-auto aspect-941/1672 w-full max-w-sm lg:order-2"
            >
              <Image
                src={image}
                alt={text(content, "imageAlt")}
                fill
                sizes="(min-width: 1024px) 33vw, 90vw"
                className="object-cover"
              />
            </Reveal>
          )}

          <div className="order-3 flex flex-col gap-12">
            <Column items={rightItems} offset={split} />
          </div>
        </div>
      </div>
    </section>
  );
}
