import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export interface Review {
  quote: string;
  name: string;
  location: string;
  rating: number;
  photos?: string[];
}

export type ReviewWithProduct = Tables<"reviews"> & {
  product: Tables<"products"> | null;
};

export function mapReview(review: ReviewWithProduct): Review {
  const metadata = (review.metadata as Record<string, unknown>) ?? {};
  return {
    quote: review.body,
    name: review.reviewer_name,
    location: (metadata.location as string) ?? "",
    rating: review.rating,
    photos: (metadata.photos as string[]) ?? undefined,
  };
}

export async function getAllReviews(): Promise<ReviewWithProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, product:products (*)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return (data as ReviewWithProduct[]) ?? [];
}

export async function getReviewsByProduct(
  productId: string,
): Promise<ReviewWithProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, product:products (*)")
    .eq("is_approved", true)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews by product:", error);
    return [];
  }

  return (data as ReviewWithProduct[]) ?? [];
}

export async function getAverageRating(productId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("is_approved", true)
    .eq("product_id", productId);

  if (error || !data || data.length === 0) return 0;

  const total = data.reduce((sum, review) => sum + review.rating, 0);
  return Number((total / data.length).toFixed(1));
}

export async function getAllMappedReviews(): Promise<Review[]> {
  const reviews = await getAllReviews();
  return reviews.map(mapReview);
}
