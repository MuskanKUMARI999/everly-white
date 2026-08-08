import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Tables } from "@/lib/supabase/database.types";

export type CollectionWithCategory = Tables<"collections"> & {
  category: Tables<"categories"> | null;
};

export async function getAllCollections(): Promise<CollectionWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*, category:categories (*)")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching collections:", error);
    return [];
  }

  return (data as CollectionWithCategory[]) ?? [];
}

export async function getAllCollectionsForStaticParams(): Promise<CollectionWithCategory[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*, category:categories (*)")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching collections for static params:", error);
    return [];
  }

  return (data as CollectionWithCategory[]) ?? [];
}

export async function getCollectionBySlug(
  slug: string,
): Promise<CollectionWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("*, category:categories (*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error) {
    console.error("Error fetching collection by slug:", error);
    return null;
  }

  return (data as CollectionWithCategory) ?? null;
}

export async function getCollectionCategoryKey(
  slug: string,
): Promise<string | undefined> {
  const supabase = await createClient();
  // maybeSingle, not single: "no such published collection" is a normal, expected answer here.
  // Callers pass slugs that legitimately have no row — /products?collection=celestial-bloom is the
  // teaser link for an unpublished collection, and productsData falls back to its UPCOMING map when
  // this returns undefined. With .single() that expected miss came back as a PGRST116 error and was
  // logged as "Error fetching collection category" on every such visit, so the logs filled with a
  // failure that wasn't one — which is how a real error hides.
  const { data, error } = await supabase
    .from("collections")
    .select("category:categories (key)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching collection category:", error);
    return undefined;
  }

  return (data?.category as { key: string } | null)?.key ?? undefined;
}
