"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getOrCreateGuestId } from "@/lib/cart/utils";
import { getWishlistItems } from "@/lib/data/wishlist";
import type { WishlistItem } from "@/lib/wishlist/types";

export interface FormResult {
  success: boolean;
  message: string;
}

type Owner = { user_id: string } | { guest_id: string };

const UNIQUE_VIOLATION = "23505";

// Same split as lib/cart/actions.ts: auth.getUser() needs the cookie-aware client, while every
// wishlist_items query below goes through the service-role client. Guest rows are identified by
// a guest_id cookie, which RLS can't verify the way it verifies auth.uid(), so the boundary is
// enforced here instead — guestId always comes from the trusted httpOnly cookie, never from
// anything the browser sent us.
async function getOwner(): Promise<Owner> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  return userId ? { user_id: userId } : { guest_id: await getOrCreateGuestId() };
}

async function productIdForSlug(slug: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("products").select("id").eq("slug", slug).single();
  return data?.id ?? null;
}

async function savedProductIds(owner: Owner): Promise<Set<string>> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("wishlist_items").select("product_id").match(owner);
  return new Set((data ?? []).map((row) => row.product_id));
}

// "layout", not the default "page": a bare revalidatePath("/account") invalidates only the
// dashboard, leaving both the wishlist page and the sidebar badge (which lives in the account
// layout) serving stale data.
function revalidateWishlist() {
  revalidatePath("/account", "layout");
}

export async function getWishlistAction(): Promise<WishlistItem[]> {
  const owner = await getOwner();
  return "user_id" in owner
    ? getWishlistItems(owner.user_id, null)
    : getWishlistItems(null, owner.guest_id);
}

export async function addWishlistItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const slug = (formData.get("slug") as string)?.trim();
  if (!slug) {
    return { success: false, message: "Product is missing." };
  }

  const productId = await productIdForSlug(slug);
  if (!productId) {
    return { success: false, message: "Product not found." };
  }

  const owner = await getOwner();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("wishlist_items")
    .insert({ ...owner, product_id: productId });

  // A double-click, or the same piece saved from two tabs, trips the partial unique index. The
  // row it wanted is already there, so that's the desired end state, not a failure.
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { success: false, message: error.message };
  }

  revalidateWishlist();
  return { success: true, message: "Saved to wishlist." };
}

export async function removeWishlistItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const slug = (formData.get("slug") as string)?.trim();
  if (!slug) {
    return { success: false, message: "Product is missing." };
  }

  const productId = await productIdForSlug(slug);
  if (!productId) {
    return { success: true, message: "Already removed." };
  }

  const owner = await getOwner();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .match({ ...owner, product_id: productId });

  if (error) return { success: false, message: error.message };

  revalidateWishlist();
  return { success: true, message: "Removed from wishlist." };
}

// Insert only what's missing: a bulk insert is rejected as a whole if any single row duplicates
// an existing one, so the two callers below filter against what's already saved first.
async function addMissing(owner: Owner, productIds: string[]): Promise<FormResult> {
  const existing = await savedProductIds(owner);
  const rows = productIds
    .filter((id) => !existing.has(id))
    .map((id) => ({ ...owner, product_id: id }));

  if (rows.length === 0) return { success: true, message: "Nothing to sync." };

  const supabase = createServiceClient();
  const { error } = await supabase.from("wishlist_items").insert(rows);
  if (error && error.code !== UNIQUE_VIOLATION) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Wishlist synced." };
}

// One-time rescue for anyone whose wishlist is still sitting in localStorage from before this
// table existed. The context calls it once on first hydration and then clears the old key, so
// long-standing customers don't silently lose their saved pieces on deploy day.
export async function adoptWishlistSlugs(slugs: string[]): Promise<FormResult> {
  if (slugs.length === 0) return { success: true, message: "Nothing to adopt." };

  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .in("slug", slugs.slice(0, 100));

  if (!products || products.length === 0) {
    return { success: true, message: "Nothing to adopt." };
  }

  const result = await addMissing(
    await getOwner(),
    products.map((product) => product.id),
  );
  if (result.success) revalidateWishlist();
  return result;
}

// Called on sign-in alongside mergeGuestCart: whatever was saved while browsing signed-out
// becomes part of the account, and the guest rows are cleared so they can't resurface later.
export async function mergeGuestWishlist(guestId: string): Promise<FormResult> {
  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const userId = userData.user?.id;
  if (!userId || !guestId) {
    return { success: false, message: "Missing user or guest id." };
  }

  const supabase = createServiceClient();
  const { data: guestRows } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .eq("guest_id", guestId);

  if (guestRows && guestRows.length > 0) {
    const result = await addMissing(
      { user_id: userId },
      guestRows.map((row) => row.product_id),
    );
    if (!result.success) return result;
  }

  await supabase.from("wishlist_items").delete().eq("guest_id", guestId);

  revalidateWishlist();
  return { success: true, message: "Wishlist synced." };
}
