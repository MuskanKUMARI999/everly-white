import Image from "next/image";
import Link from "next/link";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";

function HeroText() {
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
      >
        <Link href="/" className="text-neutral-400 hover:text-brown">
          Home
        </Link>
        <span className="text-neutral-300">/</span>
        <span aria-current="page" className="text-brown">
          Contact Us
        </span>
      </nav>
      <Eyebrow>We&rsquo;re Here For You</Eyebrow>
      <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">
        Contact Us
      </h1>
      <p className="mt-4 hidden max-w-[42ch] font-body text-lg italic text-neutral-400 sm:block">
        Questions about an order, a custom request, or just want to say hello — we&rsquo;d love to
        hear from you.
      </p>
    </>
  );
}

interface ContactHeroProps {
  bannerImage?: string;
  bannerAlt?: string;
}

export function ContactHero({ bannerImage, bannerAlt }: ContactHeroProps) {
  return (
    <section>
      {/* Mobile & tablet: stacked frames — full banner, then a glass card overlapping its base */}
      <div className="xl:hidden">
        <div className="relative aspect-4/3 w-full">
          <Image
            src={bannerImage ?? "/images/brand/packaging-flatlay.jpg"}
            alt={bannerAlt ?? "Everly White signature packaging — gift bags, boxes, and a wax-sealed envelope styled on silk"}
            fill
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative z-10 mx-auto -mt-12 w-[calc(100%-2.5rem)] max-w-140 border border-white/60 bg-white/75 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:-mt-16 sm:p-9">
          <HeroText />
        </div>
      </div>

      {/* Desktop: glass card overlaid on a full-bleed banner */}
      <div className="relative hidden min-h-150 items-end overflow-hidden xl:flex">
        <Image
          src={bannerImage ?? "/images/brand/packaging-flatlay.jpg"}
          alt={bannerAlt ?? "Everly White signature packaging — gift bags, boxes, and a wax-sealed envelope styled on silk"}
          fill
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center" }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-content px-6 pb-16 sm:px-10 lg:px-10">
          <div className="w-fit max-w-110 border border-white/60 bg-white/55 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-10">
            <HeroText />
          </div>
        </div>
      </div>
    </section>
  );
}
