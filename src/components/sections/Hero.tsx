"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HeroSlide {
  src: string;
  /** Empty string = decorative. Admin-uploaded banners supply their own; see the alt note below. */
  alt: string;
  href: string | null;
}

const FALLBACK_SLIDES: HeroSlide[] = [
  {
    src: "/images/banners/hero-1.png",
    alt: "Two ivory mirror-inlay Everly White plates on gold stands, styled on a marble console in a blush-pink living room",
    href: null,
  },
  {
    src: "/images/banners/hero-2.png",
    alt: "An Everly White gift set — two gold-and-ivory mandala plates on stands beside the branded gift box, drawstring pouch, bag and card",
    href: null,
  },
];

// Fallback name for a *linked* banner whose Alt Text was left blank in admin. An image alt can't be
// invented (we don't know what the client uploaded), but a link with no accessible name is a real
// failure for screen readers — so the link gets a name describing where it goes, not what it shows.
const UNLABELLED_BANNER_LINK = "View featured collection";

interface HeroProps {
  averageRating: string;
  slides?: HeroSlide[];
}

export function Hero({ averageRating, slides }: HeroProps) {
  const activeSlides = slides && slides.length > 0 ? slides : FALLBACK_SLIDES;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActive((i) => (i + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  return (
    <section className="relative h-[calc(100dvh-112px)] w-full overflow-hidden sm:h-[calc(100dvh-118px)] lg:h-[calc(100dvh-144px)]">
      {activeSlides.map((slide, i) => {
        const image = (
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            // `preload` is the Next 16 replacement for the deprecated `priority`, and it is the
            // right choice here (unlike the stacked page heroes): the slides are stacked in the
            // DOM rather than swapped by a media query, so the first slide is unambiguously the
            // LCP element at every viewport. Only the first — preloading the rest would compete
            // with it for the very bandwidth it needs.
            preload={i === 0}
            sizes="100vw"
            className={`object-cover transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        );
        return slide.href ? (
          <Link
            key={slide.src}
            href={slide.href}
            aria-label={slide.alt || UNLABELLED_BANNER_LINK}
            className={`absolute inset-0 block ${i === active ? "z-1" : "-z-1"}`}
          >
            {image}
          </Link>
        ) : (
          <div key={slide.src} className="absolute inset-0">
            {image}
          </div>
        );
      })}

      <div className="relative z-10 mx-auto flex h-full max-w-content items-end px-6 pb-16 sm:px-10 sm:pb-16 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="w-fit max-w-[90vw] border border-white/20 bg-white/5 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-10"
        >
          <h1 className="font-heading text-3xl font-light leading-tight text-neutral-500 sm:text-5xl sm:leading-[1.1]">
            Come Home
            <br />
            to your
            <br />
            Soulmate
          </h1>
          <p className="mt-4 font-body text-lg italic text-neutral-500">
            Because God created us in pairs...
          </p>
          <div className="mt-6">
            <Button href="/products" variant="primary">
              Discover More
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {activeSlides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`cursor-pointer h-2.5 w-2.5 rounded-full transition-[background-color,transform] duration-300 ${
              i === active ? "scale-125 bg-beige-light" : "bg-beige-light/40 hover:bg-beige-light/70"
            }`}
          />
        ))}
      </div>

      {/* The -50% vertical shift that centres this against top-1/2 has to be part of the motion
          values, not a Tailwind class: motion writes `transform` as an inline style, and an inline
          style beats a class — so a `-translate-y-1/2` class here was being silently discarded the
          moment the slide-in animation set translateX, leaving the tab hanging half its own height
          below centre. Any transform on a motion element belongs in initial/animate. */}
      <motion.div
        initial={{ opacity: 0, x: -16, y: "-50%" }}
        animate={{ opacity: 1, x: 0, y: "-50%" }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-1/2 z-30"
      >
        <Link
          href="/reviews"
          className="group flex flex-col items-center gap-2.5 border border-white/40 bg-pink-200/95 px-3 py-6 shadow-[0_6px_24px_rgba(0,0,0,0.15)] backdrop-blur-sm transition-all duration-300 hover:bg-brown hover:px-4"
        >
          <Star
            size={14}
            strokeWidth={1.5}
            className="fill-brown text-brown transition-colors duration-300 group-hover:fill-beige-light group-hover:text-beige-light"
          />
          <span className="rotate-180 font-heading text-xs uppercase tracking-[0.2em] text-neutral-500 transition-colors duration-300 [writing-mode:vertical-rl] group-hover:text-beige-light">
            Reviews
          </span>
          <span className="rotate-180 font-body text-[13px] font-semibold tracking-widest text-neutral-400 transition-colors duration-300 [writing-mode:vertical-rl] group-hover:text-beige-light/90">
            {averageRating}/5
          </span>
        </Link>
      </motion.div>
    </section>
  );
}
