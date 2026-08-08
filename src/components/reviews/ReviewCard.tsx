"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Review } from "./reviewTypes";
import { StarRating } from "./StarRating";

const EASE = [0.22, 1, 0.36, 1] as const;
const MAX_VISIBLE_THUMBS = 3;

export function ReviewCard({ review }: { review: Review }) {
  const photos = review.photos ?? [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overflowCount = photos.length - MAX_VISIBLE_THUMBS;

  useEffect(() => {
    if (openIndex === null) return;
    const current = openIndex;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") setOpenIndex((current + 1) % photos.length);
      if (e.key === "ArrowLeft") setOpenIndex((current - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openIndex, photos.length]);

  return (
    <>
      <figure className="flex h-full flex-col justify-between border border-neutral-100 bg-pink-100/40 p-7">
        <div>
          <StarRating rating={review.rating} />
          <blockquote className="mt-4 font-body text-lg italic leading-relaxed text-neutral-400">
            &ldquo;{review.quote}&rdquo;
          </blockquote>

          {photos.length > 0 && (
            <div className="mt-5 flex gap-2">
              {photos.slice(0, MAX_VISIBLE_THUMBS).map((src, i) => {
                const isLastVisible = i === MAX_VISIBLE_THUMBS - 1;
                const showOverflow = isLastVisible && overflowCount > 0;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={
                      showOverflow
                        ? `View all ${photos.length} customer photos`
                        : `View customer photo ${i + 1}`
                    }
                    className="cursor-pointer relative h-14 w-14 shrink-0 overflow-hidden bg-pink-100 transition-opacity hover:opacity-90 sm:h-16 sm:w-16"
                  >
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                    {showOverflow && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 font-heading text-xs text-beige-light">
                        +{overflowCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <figcaption className="mt-6">
          <p className="font-heading text-sm uppercase tracking-[0.14em] text-neutral-500">
            {review.name}
          </p>
          <p className="mt-1 font-body text-sm text-neutral-300">{review.location}</p>
        </figcaption>
      </figure>

      <AnimatePresence>
        {openIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${review.name}'s customer photos`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setOpenIndex(null)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpenIndex(null)}
              className="cursor-pointer absolute right-5 top-5 text-beige-light/80 transition-colors hover:text-beige-light"
            >
              <X size={26} strokeWidth={1.4} />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((openIndex - 1 + photos.length) % photos.length);
                  }}
                  className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 text-beige-light/80 transition-colors hover:text-beige-light sm:left-8"
                >
                  <ChevronLeft size={30} strokeWidth={1.3} />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex((openIndex + 1) % photos.length);
                  }}
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 text-beige-light/80 transition-colors hover:text-beige-light sm:right-8"
                >
                  <ChevronRight size={30} strokeWidth={1.3} />
                </button>
              </>
            )}

            <motion.div
              key={openIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
              className="relative h-[70vh] w-full max-w-2xl"
            >
              <Image
                src={photos[openIndex]}
                alt={`${review.name}'s photo of Everly White`}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                className="object-contain"
              />
            </motion.div>

            {photos.length > 1 && (
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-heading text-xs uppercase tracking-[0.14em] text-beige-light/80">
                {openIndex + 1} / {photos.length}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
