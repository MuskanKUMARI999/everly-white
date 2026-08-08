/**
 * Shape of a review as the storefront renders it — shared by `ReviewCard`, the `/reviews` grid and
 * the homepage testimonials.
 *
 * Every review shown on the site comes from the `reviews` table and has been approved in
 * Admin → Reviews. There is deliberately no hardcoded review copy in the front end: the pre-written
 * launch reviews were moved into the database (see `scripts/seedReviews.ts`) so the admin panel can
 * edit or delete them like any other review. Rendering them from both places showed each one twice.
 *
 * The database row is mapped onto this shape by `mapReview` in `src/lib/data/reviews.ts`.
 */
export interface Review {
  quote: string;
  name: string;
  location: string;
  rating: number;
  /** Customer-submitted photos — optional. */
  photos?: string[];
}
