import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Address = Tables<"addresses">;

export async function getAddressesByUser(userId?: string): Promise<Address[]> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId ?? user.user?.id;
  if (!targetUserId) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", targetUserId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }

  return (data as Address[]) ?? [];
}
