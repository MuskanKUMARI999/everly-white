import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/lib/supabase/database.types";

export type ProductWithImages = Tables<"products"> & {
  product_images: Tables<"product_images">[];
  product_videos?: Tables<"product_videos">[];
  category: Tables<"categories"> | null;
  collection: Tables<"collections"> | null;
};

// Catalog order everywhere is products.sort_order (Twin Flames, Lunar Bond, Star Crossed Lovers,
// Butterfly Effect, String of Fate — the design's order). The five seeded rows share one created_at,
// so ordering on that alone left Postgres free to hand back any order it liked, and the header
// mega-menu came out shuffled. created_at stays as the tie-break for products added later.
export async function getAllProducts(): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      category:categories (*),
      collection:collections (*)
    `,
    )
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return (data as ProductWithImages[]) ?? [];
}

export async function getAllProductsForStaticParams(): Promise<ProductWithImages[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      category:categories (*),
      collection:collections (*)
    `,
    )
    .eq("is_available", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching products for static params:", error);
    return [];
  }

  return (data as ProductWithImages[]) ?? [];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      product_videos (*),
      category:categories (*),
      collection:collections (*)
    `,
    )
    .eq("slug", slug)
    .eq("is_available", true)
    .single();

  if (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }

  return (data as ProductWithImages) ?? null;
}

export async function getProductsByCategory(
  categoryKey: string,
): Promise<ProductWithImages[]> {
  if (categoryKey === "all") {
    return getAllProducts();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      category:categories!inner (*),
      collection:collections (*)
    `,
    )
    .eq("is_available", true)
    .eq("categories.key", categoryKey)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }

  return (data as ProductWithImages[]) ?? [];
}

export async function getProductsByCollection(
  collectionSlug: string,
): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (*),
      category:categories (*),
      collection:collections!inner (*)
    `,
    )
    .eq("is_available", true)
    .eq("collections.slug", collectionSlug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching products by collection:", error);
    return [];
  }

  return (data as ProductWithImages[]) ?? [];
}
