import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { getGuestId } from "@/lib/cart/utils";
import { MAX_QUANTITY, maxOrderableQuantity, type CartItem } from "@/lib/cart/types";
import { FALLBACK_PRODUCT_IMAGE, primaryProductImage } from "@/lib/data/productImage";
import type { Tables } from "@/lib/supabase/database.types";

export type CartItemRow = Tables<"cart_items"> & {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    stock_quantity: number;
    product_images: { url: string; alt: string | null; position: number; is_featured: boolean }[];
  } | null;
};

export type CartWithItems = Tables<"carts"> & {
  cart_items: CartItemRow[];
};

export function rowToCartItem(row: CartItemRow): CartItem {
  const product = row.product;
  const image = primaryProductImage(product?.product_images) ?? FALLBACK_PRODUCT_IMAGE;
  const stock = product?.stock_quantity ?? 0;
  return {
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    price: product?.price ?? 0,
    image,
    stock,
    // Clamped to what's actually in stock too: a line saved when there were 9 available shouldn't
    // keep showing 9 after the shop sold down to 2.
    quantity: Math.max(1, Math.min(maxOrderableQuantity(stock) || MAX_QUANTITY, row.quantity)),
  };
}

// Uses the service-role client rather than the RLS-respecting one: guest carts are
// identified only by a guest_id stored in an httpOnly cookie, and Postgres RLS has no
// secure way to verify a client-supplied guest_id the way it verifies auth.uid(). The
// security boundary here is application-level — guestId always comes from the trusted
// cookie the server itself set and read, never from client-supplied input.
export async function getCart(
  userId?: string | null,
  guestId?: string | null,
): Promise<CartWithItems | null> {
  const supabase = createServiceClient();
  const targetUserId = userId;
  const targetGuestId = guestId ?? (!targetUserId ? await getGuestId() : null);

  if (!targetUserId && !targetGuestId) return null;

  let query = supabase
    .from("carts")
    .select(
      `
      *,
      cart_items (
        *,
        product:products (
          id,
          slug,
          name,
          price,
          stock_quantity,
          product_images (url, alt, position, is_featured)
        )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(1);

  if (targetUserId) {
    query = query.eq("user_id", targetUserId);
  } else if (targetGuestId) {
    query = query.eq("guest_id", targetGuestId);
  }

  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching cart:", error);
    return null;
  }

  return data as CartWithItems;
}

export async function getCartItems(
  userId?: string | null,
  guestId?: string | null,
): Promise<CartItem[]> {
  const cart = await getCart(userId, guestId);
  if (!cart) return [];
  return cart.cart_items.map(rowToCartItem);
}

export async function getOrCreateCart(
  userId?: string | null,
  guestId?: string | null,
): Promise<CartWithItems> {
  const existing = await getCart(userId, guestId);
  if (existing) return existing;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("carts")
    .insert({
      user_id: userId ?? null,
      guest_id: guestId ?? null,
    })
    .select(
      `
      *,
      cart_items (
        *,
        product:products (
          id,
          slug,
          name,
          price,
          stock_quantity,
          product_images (url, alt, position, is_featured)
        )
      )
    `,
    )
    .single();

  if (error) {
    console.error("Error creating cart:", error);
    throw new Error("Unable to create cart.");
  }

  return data as CartWithItems;
}
