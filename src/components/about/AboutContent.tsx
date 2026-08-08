import Image from "next/image";
import Link from "next/link";
import {
  Hand,
  Leaf,
  BadgeCheck,
  Gem,
  Orbit,
  Truck,
  Award,
  Play,
  type LucideIcon,
} from "lucide-react";
import { FaInstagram, FaThreads, FaWhatsapp } from "react-icons/fa6";
import { ComeCloserCTA } from "@/components/sections/ComeCloserCTA";

const heroVariants = {
  lifestyle: {
    src: "/images/instagram/lifestyle-sofa.jpg",
    alt: "An Everly White styled living space",
    objectPosition: "center",
    overlay: "bg-linear-to-t from-black/30 to-transparent",
    card: "max-w-110 border-white/60 bg-white/55 backdrop-blur-xl",
    mobileAspect: "aspect-4/3",
  },
  signage: {
    src: "/images/banners/about-signage.jpg",
    alt: "Everly White gold signage on a studio wall",
    objectPosition: "center",
    overlay: "bg-linear-to-r from-black/40 via-black/5 to-transparent",
    card: "max-w-100 border-white/60 bg-white/70 backdrop-blur-xl",
    mobileAspect: "aspect-16/9",
  },
} as const;

export type AboutHero = keyof typeof heroVariants;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`font-heading text-[11px] font-medium uppercase tracking-[0.28em] text-brown ${className}`}
    >
      {children}
    </p>
  );
}

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
          About Us
        </span>
      </nav>
      <Eyebrow className="tracking-[0.22em] sm:whitespace-nowrap">
        The House of Everly White
      </Eyebrow>
      <h1 className="mt-3 font-heading text-4xl font-light text-neutral-500 sm:text-5xl">
        About Us
      </h1>
      <p className="mt-4 hidden font-body text-lg italic text-neutral-400 sm:block">
        A longing — not for more things, but for meaning in the things we live with.
      </p>
    </>
  );
}

const galleryImages = [
  "/images/instagram/insta-window.jpg",
  "/images/instagram/insta-card.jpg",
  "/images/instagram/insta-chair.jpg",
];

const studioSocials = [
  { label: "Instagram", Icon: FaInstagram, href: "https://www.instagram.com/everlywhitestudios/" },
  { label: "Threads", Icon: FaThreads, href: "https://www.threads.net/@everlywhitestudios" },
  { label: "WhatsApp", Icon: FaWhatsapp, href: "https://wa.me/message/OEJJOG6DF762J1" },
];

const values: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: BadgeCheck,
    title: "Authenticity",
    body: "Genuine craftsmanship, made with an unwavering commitment to integrity — never a shortcut, never a substitute.",
  },
  {
    Icon: Gem,
    title: "Exclusivity",
    body: "Created for those who feel it, not those chasing status — rarity as a form of respect for the wearer.",
  },
  {
    Icon: Orbit,
    title: "Cosmic Luxe Experience",
    body: "Where esoteric wisdom meets artisanal mastery — luxury that is loud in the eyes, quiet in the essence.",
  },
];

const trust: { Icon: LucideIcon; title: string; body: string }[] = [
  { Icon: Hand, title: "Handcrafted in India", body: "Every piece shaped by hand, never by machine." },
  { Icon: Truck, title: "Free Shipping", body: "Complimentary delivery across India." },
  { Icon: Award, title: "Limited Edition", body: "Small-batch collections, never mass produced." },
];

export function AboutContent({
  hero = "lifestyle",
  bannerImage,
  bannerAlt,
}: {
  hero?: AboutHero;
  bannerImage?: string;
  bannerAlt?: string;
}) {
  const heroConfig = heroVariants[hero];
  const heroSrc = bannerImage ?? heroConfig.src;
  const heroAlt = bannerAlt ?? heroConfig.alt;

  return (
    <main>
      {/* HERO */}
      <section>
        {/* Mobile & tablet: stacked frames — full banner, then a glass card overlapping its base.
            Both branches below use fetchPriority="high", NOT `preload`. Next 16 deprecated
            `priority` in favour of `preload`, but preload is explicitly wrong for this pattern: two
            <Image> tags render the same photo and CSS hides one, so preloading would insert a <link>
            for both and download the hero twice. fetchPriority keeps default lazy loading (which
            skips the hidden variant) while still prioritising the visible one. Same call as the six
            other stacked heroes — please don't "fix" these to preload. */}
        <div className="xl:hidden">
          <div className={`relative w-full ${heroConfig.mobileAspect}`}>
            <Image
              src={heroSrc}
              alt={heroAlt}
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
            src={heroSrc}
            alt={heroAlt}
            fill
            fetchPriority="high"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: heroConfig.objectPosition }}
          />
          <div className={`absolute inset-0 ${heroConfig.overlay}`} />
          <div className="relative z-10 mx-auto w-full max-w-content px-6 pb-16 sm:px-10 lg:px-10">
            <div
              className={`w-fit border p-8 shadow-[0_8px_32px_rgba(0,0,0,0.12)] sm:p-10 ${heroConfig.card}`}
            >
              <HeroText />
            </div>
          </div>
        </div>
      </section>

      {/* INTRO SPLIT */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="mt-3 max-w-[20ch] font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
            Life extends far beyond the material.
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-[8vw]">
            <div>
              <h4 className="font-heading text-xs uppercase tracking-[0.14em] text-neutral-500">
                The Philosophy
              </h4>
              <p className="mt-4 font-body text-neutral-300">
                Everly White was born from a longing — not for more things, but for meaning in the
                things we live with. We believe true richness is found beyond the material, in a
                deeper awareness of the universe and our place within it.
              </p>
              <p className="mt-4 font-body text-neutral-300">
                Every piece we create is a quiet invitation: to slow down, to notice, to connect
                with something larger than ourselves.
              </p>
            </div>
            <div>
              <h4 className="font-heading text-xs uppercase tracking-[0.14em] text-neutral-500">
                The Craft
              </h4>
              <p className="mt-4 font-body text-neutral-300">
                True luxury is not just measured by what&rsquo;s around you — but by what&rsquo;s
                inside you. We favor bold minimalism, handmade imperfection, and patience over speed
                in every piece we create.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-9 gap-y-5">
                <div className="flex items-center gap-3">
                  <Hand size={26} strokeWidth={1.3} className="shrink-0 text-brown" />
                  <span className="font-heading text-[11.5px] uppercase tracking-[0.06em] text-neutral-500">
                    100% Handcrafted
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Leaf size={26} strokeWidth={1.3} className="shrink-0 text-brown" />
                  <span className="font-heading text-[11.5px] uppercase tracking-[0.06em] text-neutral-500">
                    Considered Materials
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE / VIDEO BAND */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 overflow-hidden md:grid-cols-[1fr_1.4fr]">
            <div className="flex items-center bg-pink-100 p-10 sm:p-12">
              <div className="border border-white/60 bg-white/55 p-7 backdrop-blur-xl">
                <Eyebrow>Creative Freedom</Eyebrow>
                <p className="mt-3 font-body text-lg italic leading-relaxed text-neutral-500">
                  &ldquo;Creativity is sacred freedom — not bound by trends, but guided by
                  intuition.&rdquo; Limited, bespoke, and preserved in rarity.
                </p>
              </div>
            </div>
            <div className="relative flex min-h-70 items-center justify-center">
              <Image
                src="/images/instagram/product-coffee-table.jpg"
                alt="Everly White plates styled on a coffee table"
                fill
                sizes="(min-width: 768px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/25" />
              <div className="relative z-10 flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/50 bg-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md">
                  <Play size={20} className="ml-0.5 fill-beige-light text-beige-light" />
                </span>
                <span className="mt-3 font-heading text-xs uppercase tracking-[0.16em] text-beige-light">
                  Brand Film
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MEET THE FOUNDER */}
      <section id="craft" className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 overflow-hidden border border-neutral-100 bg-beige-light lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative min-h-85 lg:min-h-full">
              <Image
                src="/images/about/founder.jpg"
                alt="Aoksana Bhuyan, Founder & Creative Director of Everly White"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover [transform:scaleX(-1)]"
              />
              <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_30px_var(--color-beige-light)]" />
            </div>
            <div className="p-8 sm:p-12 lg:p-14">
              <Eyebrow>The Founder</Eyebrow>
              <h3 className="mt-3 font-heading text-2xl text-neutral-500 sm:text-3xl">
                Meet the Founder
              </h3>
              <p className="mt-5 font-body text-neutral-300">
                Everly White began with a simple belief: the things we choose to surround ourselves
                with should do more than just decorate our homes. They should remind us of what we
                believe, what we love, and who we&rsquo;re becoming. To see beyond what&rsquo;s
                visible to our mere eyes, every collection we create is an exploration of the
                invisible threads that connect people, places, and moments, brought to life through
                thoughtful design and patient craftsmanship. We don&rsquo;t claim to have all the
                answers. We simply invite you to pause, wonder, and create a home that reflects not
                just your style, but your soul.
              </p>

              <div className="mt-6 border-l-2 border-brown pl-5">
                <p className="font-body text-lg italic leading-relaxed text-neutral-500">
                  &ldquo;Luxury isn&rsquo;t what fills a home. It&rsquo;s what gives it
                  meaning.&rdquo;
                </p>
                <p className="mt-2 font-heading text-xs uppercase tracking-[0.14em] text-brown">
                  &ldquo;Come Home To Your Soulmate&rdquo;
                </p>
              </div>

              <div className="mt-6">
                <p className="font-heading text-[13px] uppercase tracking-[0.08em] text-neutral-500">
                  Aoksana Bhuyan
                </p>
                <p className="font-body text-sm text-neutral-300">Founder &amp; Creative Director</p>
              </div>

              <span className="mt-8 block font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Gallery
              </span>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {galleryImages.map((src) => (
                  <div key={src} className="relative aspect-square overflow-hidden bg-pink-100">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 18vw, 30vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              <span className="mt-8 block font-heading text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                Follow the Studio
              </span>
              <div className="mt-3 flex gap-3">
                {studioSocials.map(({ label, Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-100 text-brown transition-colors hover:bg-pink-100"
                  >
                    <Icon size={14} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="pb-20 text-center sm:pb-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="mx-auto max-w-xl">
            <Eyebrow>Core Values</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
              What we build our name on.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 border border-neutral-100 md:grid-cols-3">
            {values.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="border-b border-neutral-100 bg-beige-light p-10 text-left transition-colors duration-300 last:border-b-0 hover:bg-pink-200 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <Icon size={30} strokeWidth={1.3} className="text-brown" />
                <h3 className="mt-6 font-heading text-[15px] uppercase tracking-widest text-neutral-500">
                  {title}
                </h3>
                <p className="mt-3 font-body text-[15px] text-neutral-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMITMENT */}
      <section className="bg-pink-100 py-20 sm:py-28">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-[6vw]">
            <div>
              <Eyebrow>The Commitment</Eyebrow>
              <h2 className="mt-3 max-w-[14ch] font-heading text-3xl leading-snug text-neutral-500 sm:text-4xl">
                Coming home to higher conscience.
              </h2>
              <p className="mt-5 max-w-[48ch] font-body text-neutral-400">
                At Everly White, coming home means arriving at something deeper — not just material
                luxury, but a quiet return to yourself. We don&rsquo;t create for everyone; we create
                for those who feel it, and we hold every collection to that same quiet standard.
              </p>
              <Link
                href="#craft"
                className="mt-6 inline-block border-b border-brown font-heading text-[11.5px] uppercase tracking-[0.14em] text-brown"
              >
                Learn More →
              </Link>
            </div>
            <div className="relative h-80 sm:h-95">
              <div className="absolute left-0 top-0 h-[78%] w-[74%] overflow-hidden">
                <Image
                  src="/images/instagram/product-marble-counter.jpg"
                  alt="Everly White plates on a marble counter"
                  fill
                  sizes="(min-width: 1024px) 35vw, 70vw"
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-[56%] w-[52%] overflow-hidden shadow-[0_16px_34px_rgba(120,60,50,0.18)]">
                <Image
                  src="/images/products/twin-flames-2.png"
                  alt="Everly White Twin Flames plates"
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <ComeCloserCTA />

      {/* TRUST BAR */}
      <section className="bg-pink-100 py-14">
        <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            {trust.map(({ Icon, title, body }) => (
              <div key={title}>
                <Icon size={26} strokeWidth={1.3} className="mx-auto text-brown" />
                <h4 className="mt-3 font-heading text-[12.5px] uppercase tracking-widest text-neutral-500">
                  {title}
                </h4>
                <p className="mt-1.5 font-body text-sm text-neutral-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
