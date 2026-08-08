import Image from "next/image";
import { Clock, Star, Feather, CircleCheck, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const leftItems = [
  {
    title: "Detailed Craftsmanship",
    description: "High-end materials, sophisticated craftsmanship for the discerning eye.",
    icon: Clock,
  },
  {
    title: "Bespoke Collection",
    description: "Limited edition designs that focus on bold minimalism and timeless luxury.",
    icon: Star,
  },
];

const rightItems = [
  {
    title: "Creative Freedom",
    description:
      "From the door closing behind you to the peace setting in — discover the magic of truly being home.",
    icon: Feather,
  },
  {
    title: "Timeless Artistry",
    description: "Where each piece transcends your home into a portal for higher consciousness.",
    icon: CircleCheck,
  },
];

function FeatureItem({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="text-center">
      <Icon size={28} strokeWidth={1.3} className="mx-auto text-brown" />
      <h4 className="mt-6 font-heading text-base uppercase tracking-[0.05em] text-neutral-500">{title}</h4>
      <p className="mx-auto mt-4 max-w-xs font-body text-neutral-300">{description}</p>
    </div>
  );
}

export function ElevateExperience() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <Reveal className="text-center">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-neutral-300">
            Elevate Your Home Decor Experience
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-light leading-snug text-neutral-500 sm:text-4xl">
            Step into the universe of bold minimalism where emotions come alive as soon as you
            step into your home
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-3">
          <div className="order-2 flex flex-col gap-12 lg:order-1">
            {leftItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <FeatureItem {...item} />
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="relative order-1 mx-auto aspect-941/1672 w-full max-w-sm lg:order-2">
            <Image
              src="/images/banners/elevate-centered.png"
              alt="Elevate Your Home Decor Experience"
              fill
              sizes="(min-width: 1024px) 33vw, 90vw"
              className="object-cover"
            />
          </Reveal>

          <div className="order-3 flex flex-col gap-12">
            {rightItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <FeatureItem {...item} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
