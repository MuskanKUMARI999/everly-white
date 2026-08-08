import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Banner = Tables<"banners">;

export async function getActiveBanners(placement: string): Promise<Banner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching banners:", error);
    return [];
  }

  return data ?? [];
}
