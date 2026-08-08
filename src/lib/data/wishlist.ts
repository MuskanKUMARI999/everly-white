import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import { hoverProductImage, primaryProductImage } from "@/lib/data/productImage";
import type { WishlistItem } from "@/lib/wishlist/types";

const FALLBACK_IMAGE = "/images/logo.png";

// Same product/image join the cart uses, plus the fields ProductCard needs to render a
// saved piece without a second round-trip.
const WISHLIST_SELECT = `
  id,
  product:products (
    slug,
    name,
    price,
    metadata,
    product_images (url, position, is_featured)
  )
`;

interface WishlistRowProduct {
  slug: string;
  name: string;
  price: number;
  metadata: Record<string, unknown> | null;
  product_images: { url: string; position: number; is_featured: boolean }[];
}

// Mirrors mapProductToCatalog in components/products/productsData.ts — via the shared helpers, so
// the two can't drift again. They had: this file still picked the hover on `position === 1`, which
// loses it as soon as an image is deleted and leaves a gap, and fell back to an unordered
// `images[0]` for the main photo.
function toWishlistItem(product: WishlistRowProduct): WishlistItem {
  const images = product.product_images ?? [];
  const image = primaryProductImage(images) ?? FALLBACK_IMAGE;

  return {
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    image,
    hoverImage: hoverProductImage(images, image),
    isFlagship: (product.metadata?.isFlagship ?? false) === true,
  };
}

export async function getWishlistItems(
  userId?: string | null,
  guestId?: string | null,
): Promise<WishlistItem[]> {
  if (!userId && !guestId) return [];

  const supabase = createServiceClient();
  let query = supabase
    .from("wishlist_items")
    .select(WISHLIST_SELECT)
    .order("created_at", { ascending: false });

  query = userId ? query.eq("user_id", userId) : query.eq("guest_id", guestId!);

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }

  // A product deleted from the catalogue leaves the join null; drop it rather than render
  // a card with no name or price.
  return (data ?? [])
    .map((row) => (row.product as unknown as WishlistRowProduct | null))
    .filter((product): product is WishlistRowProduct => Boolean(product))
    .map(toWishlistItem);
}

// Cheap count for server components (the sidebar badge and the dashboard tile) that need the
// number before the client store has hydrated, and don't need the items themselves.
export async function getWishlistCount(userId?: string | null): Promise<number> {
  if (!userId) return 0;

  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Error counting wishlist:", error);
    return 0;
  }

  return count ?? 0;
}
