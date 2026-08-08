import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { StarRating } from "@/components/reviews/StarRating";
import { WriteReviewButton } from "@/components/reviews/WriteReviewButton";
import { getReviewsByProduct, getAverageRating, mapReview } from "@/lib/data/reviews";

// Per-product reviews for the product detail page. Only approved reviews are shown (enforced in the
// data layer); submissions land pending moderation, so a freshly written review won't appear until
// an admin approves it in Admin → Reviews.
export async function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [reviewRows, average] = await Promise.all([
    getReviewsByProduct(productId),
    getAverageRating(productId),
  ]);
  const reviews = reviewRows.map(mapReview);

  return (
    <section className="border-t border-neutral-100 py-20 sm:py-28">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="text-center">
          <Eyebrow>Reviews</Eyebrow>
          <h2 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">
            {productName}
          </h2>

          {reviews.length > 0 ? (
            <div className="mt-5 flex items-center justify-center gap-2">
              <StarRating rating={Math.round(average)} />
              <span className="font-heading text-[12.5px] uppercase tracking-widest text-neutral-400">
                {average.toFixed(1)} out of 5 &middot; {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
          ) : (
            // Deliberately says nothing about how many reviews exist — the previous
            // "Be the first to share your experience" read as an absence of customers.
            <p className="mx-auto mt-3 max-w-md font-body text-lg text-neutral-300">
              Tell us how this piece found its place in your space.
            </p>
          )}

          <div className="mt-7">
            <WriteReviewButton productId={productId} />
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <ReviewCard key={`${review.name}-${i}`} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
