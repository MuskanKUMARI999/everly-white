"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ReviewCard } from "./ReviewCard";
import { StarRating } from "./StarRating";
import type { Review } from "./reviewTypes";

// Deferred: the review-submission modal's JS isn't needed until a visitor clicks to open it.
const WriteReviewButton = dynamic(() =>
  import("./WriteReviewButton").then((m) => m.WriteReviewButton),
);

const PAGE_SIZE = 9;

interface ReviewsGridProps {
  reviews: Review[];
  /** The closing CTA band, passed in as an element: it is a server component that reads its own
   *  copy, and importing it here would drag it into the client bundle. */
  cta?: ReactNode;
}

export function ReviewsGrid({ reviews, cta }: ReviewsGridProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visibleReviews = reviews.slice(0, visibleCount);

  // Averaged across every approved review the page holds, not just the ones currently paged in —
  // "Load More" must never change the headline figure.
  const averageRating =
    reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

  return (
    <main>
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-content px-6 text-center sm:px-10 lg:px-10">
          <Reveal>
            <h2 className="font-heading text-3xl text-neutral-500 sm:text-4xl">
              What Our Community Is Saying
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-body text-lg text-neutral-300">
              Play with lights, colors! Show us your creativity to get featured on our website.
            </p>

            {reviews.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-2">
                <StarRating rating={Math.round(averageRating)} />
                <span className="font-heading text-[12.5px] uppercase tracking-widest text-neutral-400">
                  {averageRating.toFixed(1)} out of 5 &middot; {reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}

            <div className="mt-7">
              <WriteReviewButton />
            </div>
          </Reveal>

          {reviews.length === 0 ? (
            // Every review on the page comes from the database and can be deleted in Admin →
            // Reviews, so the grid has to read as intentional when the table is empty. The copy
            // deliberately avoids "be the first", which reads as an absence of customers.
            <Reveal>
              <p className="mt-12 font-body text-lg text-neutral-300">
                Tell us how your piece found its place in your space.
              </p>
            </Reveal>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
              {visibleReviews.map((r, i) => (
                <Reveal key={`${r.name}-${i}`} delay={(i % 3) * 0.1}>
                  <ReviewCard review={r} />
                </Reveal>
              ))}
            </div>
          )}

          {visibleCount < reviews.length && (
            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                icon={false}
                onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, reviews.length))}
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      </section>

      {cta}
    </main>
  );
}
