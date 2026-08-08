import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

// product_name/product_image on an order item are snapshots frozen at checkout — they must stay
// frozen, because they record what was actually bought. But that makes them useless for building a
// link: re-slugifying a stale name 404s the moment the product is renamed in admin. The joined
// product carries the *live* slug for that job. It is null when the row predates product_id being
// stored, or when the product has since been deleted.
export type OrderItemWithProduct = Tables<"order_items"> & {
  product: { slug: string } | null;
};

export type OrderWithItems = Tables<"orders"> & {
  order_items: OrderItemWithProduct[];
};

// Kept in one place so every order query returns the same item shape — a missing join here would
// silently type-check (the call sites cast) and then break links at runtime.
export const ORDER_WITH_ITEMS_SELECT = `
  *,
  order_items (
    *,
    product:products (slug)
  )
` as const;

export async function getOrdersByUser(userId?: string): Promise<OrderWithItems[]> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId ?? user.user?.id;
  if (!targetUserId) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (data as OrderWithItems[]) ?? [];
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_WITH_ITEMS_SELECT)
    .eq("id", orderId)
    .eq("user_id", user.user.id)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return null;
  }

  return (data as OrderWithItems) ?? null;
}
