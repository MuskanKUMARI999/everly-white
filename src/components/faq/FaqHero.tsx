import Image from "next/image";
import Link from "next/link";
import { text, type SectionValues } from "@/lib/content/sections";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown">
      {children}
    </p>
  );
}

function HeroText({ content }: { content: SectionValues }) {
  const intro = text(content, "intro");

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
          {text(content, "breadcrumbLabel")}
        </span>
      </nav>
      <Eyebrow>{text(content, "eyebrow")}</Eyebrow>
      <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">
        {text(content, "heading")}
      </h1>
      {intro && (
        <p className="mt-4 hidden max-w-[42ch] font-body text-lg italic text-neutral-400 sm:block">
          {intro}
        </p>
      )}
    </>
  );
}

interface FaqHeroProps {
  content: SectionValues;
  /** The active "FAQ Page Hero" banner, when there is one. It wins over the section's own image. */
  bannerImage?: string;
  bannerAlt?: string;
}

export function FaqHero({ content, bannerImage, bannerAlt }: FaqHeroProps) {
  const image = bannerImage || text(content, "image");
  const alt = bannerAlt || text(content, "imageAlt");

  return (
    <section>
      {/* Mobile & tablet: stacked frames — full banner, then a glass card overlapping its base */}
      <div className="xl:hidden">
        {image && (
          <div className="relative aspect-4/3 w-full">
            <Image src={image} alt={alt} fill fetchPriority="high" sizes="100vw" className="object-cover" />
          </div>
        )}
        <div
          className={`relative z-10 mx-auto w-[calc(100%-2.5rem)] max-w-140 border border-white/60 bg-white/75 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:p-9 ${
            // With no banner there is nothing to overlap, so the negative pull would hoist the
            // card off the top of the page.
            image ? "-mt-12 sm:-mt-16" : "mt-10"
          }`}
        >
          <HeroText content={content} />
        </div>
      </div>

      {/* Desktop: glass card overlaid on a full-bleed banner */}
      <div className="relative hidden min-h-150 items-end overflow-hidden xl:flex">
        {image && (
          <>
            <Image
              src={image}
              alt={alt}
              fill
              fetchPriority="high"
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: "center" }}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
          </>
        )}
        <div className="relative z-10 mx-auto w-full max-w-content px-6 pb-16 sm:px-10 lg:px-10">
          <div className="w-fit max-w-110 border border-white/60 bg-white/55 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-10">
            <HeroText content={content} />
          </div>
        </div>
      </div>
    </section>
  );
}
