"use server";

import { createClient } from "@/lib/supabase/server";
import type { FormResult } from "@/lib/cart/types";

const MAX_PHOTOS = 6;

export async function submitReview(formData: FormData): Promise<FormResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const rating = Number(formData.get("rating"));
  const body = (formData.get("body") as string)?.trim();
  // Present when the review is written from a product page; null for a general site review.
  const productId = (formData.get("productId") as string)?.trim() || null;
  const photos = (formData.getAll("photos") as File[]).filter((f) => f.size > 0).slice(0, MAX_PHOTOS);

  if (!name) return { success: false, message: "Please enter your name." };
  if (!rating || rating < 1 || rating > 5) {
    return { success: false, message: "Please select a rating." };
  }
  if (!body) return { success: false, message: "Please write your review." };

  const supabase = await createClient();

  const photoUrls: string[] = [];
  for (const file of photos) {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("review-photos")
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      const { data } = supabase.storage.from("review-photos").getPublicUrl(path);
      photoUrls.push(data.publicUrl);
    }
  }

  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase.from("reviews").insert({
    reviewer_name: name,
    rating,
    body,
    product_id: productId,
    user_id: userData.user?.id ?? null,
    is_approved: false,
    metadata: { email: email || null, photos: photoUrls },
  });

  if (error) {
    console.error("Error submitting review:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  return {
    success: true,
    message: "Your review has been submitted for verification.",
  };
}
