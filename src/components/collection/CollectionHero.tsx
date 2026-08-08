import Image from "next/image";
import Link from "next/link";
import { CollectionEyebrow as Eyebrow } from "./Eyebrow";

export function CollectionHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
}) {
  const heroText = (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-2 font-heading text-[10px] uppercase tracking-[0.18em]"
      >
        <Link href="/" className="text-neutral-400 hover:text-brown">
          Home
        </Link>
        <span className="text-neutral-300">/</span>
        <Link href="/products" className="text-neutral-400 hover:text-brown">
          Collections
        </Link>
        <span className="text-neutral-300">/</span>
        <span aria-current="page" className="text-brown">
          {title}
        </span>
      </nav>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">{title}</h1>
      <p className="mt-4 hidden max-w-[42ch] font-body text-lg italic text-neutral-400 sm:block">
        {subtitle}
      </p>
    </>
  );

  return (
    <section>
      {/* Mobile & tablet: stacked frames — full banner, then a glass card overlapping its base */}
      <div className="xl:hidden">
        <div className="relative aspect-4/3 w-full">
          <Image
            src={image}
            alt={imageAlt}
            fill
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative z-10 mx-auto -mt-12 w-[calc(100%-2.5rem)] max-w-140 border border-white/60 bg-white/75 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl sm:-mt-16 sm:p-9">
          {heroText}
        </div>
      </div>

      {/* Desktop: glass card overlaid on a full-bleed banner */}
      <div className="relative hidden min-h-150 items-end overflow-hidden xl:flex">
        <Image
          src={image}
          alt={imageAlt}
          fill
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: "center" }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
        <div className="relative z-10 mx-auto w-full max-w-content px-6 pb-16 sm:px-10 lg:px-10">
          <div className="w-fit max-w-110 border border-white/60 bg-white/55 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-10">
            {heroText}
          </div>
        </div>
      </div>
    </section>
  );
}
