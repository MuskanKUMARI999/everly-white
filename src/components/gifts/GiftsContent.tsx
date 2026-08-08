import Image from "next/image";
import { Building2, Gift, Heart, Package, Sparkles, Truck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

interface GiftSection {
  key: string;
  eyebrow: string;
  title: string;
  body: string[];
  points: { Icon: LucideIcon; label: string }[];
  cta: string;
  image: string;
  imageAlt: string;
  imageOnRight?: boolean;
}

const sections: GiftSection[] = [
  {
    key: "corporate",
    eyebrow: "For Businesses",
    title: "Corporate Gifting",
    body: [
      "Make an impression that outlasts the moment. From client appreciation to employee milestones, an Everly White piece says more than a card ever could — handcrafted, considered, and never mass-produced.",
      "We work with businesses of every size on bulk orders, custom packaging, and timed deliveries for events and celebrations.",
    ],
    points: [
      { Icon: Package, label: "Bulk Order Pricing" },
      { Icon: Building2, label: "Custom Branding on Request" },
      { Icon: Truck, label: "Nationwide, On-Time Delivery" },
    ],
    cta: "Enquire for Corporate Gifting",
    image: "/images/instagram/product-coffee-table.jpg",
    imageAlt: "Everly White plates styled on a coffee table",
  },
  {
    key: "loved-ones",
    eyebrow: "For Someone Special",
    title: "Gifting For Loved Ones",
    body: [
      "Some gifts are meant to be kept, not used and forgotten. Whether it's a wedding, an anniversary, or simply because — an Everly White piece becomes part of someone's everyday, long after the occasion has passed.",
    ],
    points: [
      { Icon: Gift, label: "Complimentary Gift Wrapping" },
      { Icon: Heart, label: "Personalized Notes on Request" },
      { Icon: Sparkles, label: "Ready for Weddings, Anniversaries & More" },
    ],
    cta: "Get in Touch",
    image: "/images/instagram/product-marble-counter.jpg",
    imageAlt: "Everly White plates on a marble counter",
    imageOnRight: true,
  },
];

export function GiftsContent() {
  return (
    <main className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-content flex-col gap-16 px-6 sm:px-10 lg:gap-20 lg:px-10">
        {sections.map((s) => (
          <Reveal key={s.key}>
            <div className="grid grid-cols-1 overflow-hidden border border-neutral-100 bg-beige-light lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className={`relative min-h-70 lg:min-h-full ${
                  s.imageOnRight ? "lg:order-2" : ""
                }`}
              >
                <Image
                  src={s.image}
                  alt={s.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 520px, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-8 sm:p-12 lg:p-14">
                <Eyebrow>{s.eyebrow}</Eyebrow>
                <h2 className="mt-3 font-heading text-2xl text-neutral-500 sm:text-3xl">
                  {s.title}
                </h2>
                {s.body.map((p, i) => (
                  <p key={i} className="mt-5 font-body text-neutral-300">
                    {p}
                  </p>
                ))}

                <div className="mt-7 flex flex-col gap-4">
                  {s.points.map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <Icon size={22} strokeWidth={1.3} className="shrink-0 text-brown" />
                      <span className="font-heading text-[11.5px] uppercase tracking-[0.06em] text-neutral-500">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                <Button href="/contact" variant="primary" icon={false} className="mt-9">
                  {s.cta}
                </Button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </main>
  );
}
