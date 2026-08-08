import type { Metadata } from "next";
import { ReviewsHero } from "@/components/reviews/ReviewsHero";
import { ReviewsGrid } from "@/components/reviews/ReviewsGrid";
import { getAllReviews, mapReview } from "@/lib/data/reviews";
import { getActiveBanners } from "@/lib/data/banners";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Real words from a small, intentional community living with Everly White — see what our customers are saying.",
};

export default async function ReviewsPage() {
  const reviews = await getAllReviews();
  const [heroBanner] = await getActiveBanners("reviews_hero");
  return (
    <>
      <ReviewsHero bannerImage={heroBanner?.image_url} bannerAlt={heroBanner?.alt ?? undefined} />
      <ReviewsGrid reviews={reviews.map(mapReview)} />
    </>
  );
}
