"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getOrCreateGuestId } from "@/lib/cart/utils";
import { getCart, getOrCreateCart } from "@/lib/data/cart";
import {
  MAX_QUANTITY,
  maxOrderableQuantity,
  type CartItem,
  type FormResult,
  type ValidatedCoupon,
} from "@/lib/cart/types";
import {
  FALLBACK_PRODUCT_IMAGE,
  primaryProductImage,
  type ProductImageRef,
} from "@/lib/data/productImage";
import { validateCouponForSubtotal } from "@/lib/coupons/validate";

// auth.getUser() needs the session-aware client (reads the auth cookie); every actual
// cart/cart_items/products query below uses the service-role client instead — guest carts
// are identified only by a guest_id cookie, which Postgres RLS can't securely verify the
// way it verifies auth.uid(), so the security boundary is enforced here in application
// code (guestId always comes from the trusted httpOnly cookie, never client input).
async function getCartIdentifiers() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  const guestId = !userId ? await getOrCreateGuestId() : null;
  return { userId, guestId };
}

/**
 * Drop the stored coupon once the last line leaves the cart.
 *
 * A code belongs to a basket, not to the shopper. Without this the row keeps `coupon_code` after
 * the cart is emptied one item at a time, and the discount silently reattaches itself to whatever
 * the customer adds next — they never re-entered it and never saw it re-applied.
 */
async function clearCouponIfCartEmpty(
  supabase: ReturnType<typeof createServiceClient>,
  cartId: string,
) {
  const { count, error } = await supabase
    .from("cart_items")
    .select("id", { count: "exact", head: true })
    .eq("cart_id", cartId);
  // Only clear on a definite zero — a failed count must not wipe a live coupon.
  if (error || count !== 0) return;
  await supabase.from("carts").update({ coupon_code: null }).eq("id", cartId);
}

export interface CartSnapshot {
  items: CartItem[];
  coupon: ValidatedCoupon | null;
}

export async function getCartAction(): Promise<CartSnapshot> {
  const { userId, guestId } = await getCartIdentifiers();
  const empty: CartSnapshot = { items: [], coupon: null };

  const supabase = createServiceClient();
  let query = supabase
    .from("carts")
    .select(
      `
      *,
      cart_items (
        *,
        product:products (
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

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (guestId) {
    query = query.eq("guest_id", guestId);
  } else {
    return empty;
  }

  const { data, error } = await query.single();
  if (error) {
    if (error.code === "PGRST116") return empty;
    console.error("Error fetching cart:", error);
    return empty;
  }

  const items: CartItem[] =
    data?.cart_items.map(
      (row: {
        product: {
          slug: string;
          name: string;
          price: number;
          stock_quantity: number;
          product_images: ProductImageRef[];
        } | null;
        quantity: number;
      }) => {
        const stock = row.product?.stock_quantity ?? 0;
        return {
          slug: row.product?.slug ?? "",
          name: row.product?.name ?? "",
          price: row.product?.price ?? 0,
          image: primaryProductImage(row.product?.product_images) ?? FALLBACK_PRODUCT_IMAGE,
          stock,
          quantity: Math.max(1, Math.min(maxOrderableQuantity(stock) || MAX_QUANTITY, row.quantity)),
        };
      },
    ) ?? [];

  const storedCode = data?.coupon_code ?? null;
  if (!storedCode) {
    return { items, coupon: null };
  }

  // An empty basket can't carry a discount. Enforced on read as well as on the mutation paths,
  // so carts emptied before this rule existed heal themselves on the next load.
  if (items.length === 0) {
    await supabase.from("carts").update({ coupon_code: null }).eq("id", data.id);
    return { items, coupon: null };
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const result = await validateCouponForSubtotal(storedCode, subtotal);
  if (result.success) {
    return { items, coupon: result.coupon };
  }

  // The coupon became invalid since it was applied (expired, used up, cart changed
  // below the minimum) — silently clear it rather than surface a stale error.
  await supabase.from("carts").update({ coupon_code: null }).eq("id", data.id);
  return { items, coupon: null };
}

export async function addToCart(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const slug = (formData.get("slug") as string)?.trim();
  const quantity = Math.max(1, Math.min(MAX_QUANTITY, Number(formData.get("quantity") ?? 1)));

  if (!slug) {
    return { success: false, message: "Product is missing." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, price, stock_quantity")
    .eq("slug", slug)
    .single();

  if (!product) {
    return { success: false, message: "Product not found." };
  }

  // Authoritative ceiling for this product. The steppers already stop here, but the action is
  // callable directly, so the clamp has to exist on the server too.
  const cap = maxOrderableQuantity(product.stock_quantity);
  if (cap === 0) {
    return { success: false, message: "This piece is out of stock." };
  }

  const cart = await getOrCreateCart(userId, guestId);

  const { data: existingItem } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", product.id)
    .single();

  if (existingItem) {
    const newQuantity = Math.min(cap, existingItem.quantity + quantity);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", existingItem.id);
    if (error) return { success: false, message: error.message };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: product.id,
      quantity: Math.min(cap, quantity),
    });
    if (error) return { success: false, message: error.message };
  }

  revalidatePath("/cart");
  return { success: true, message: "Added to cart." };
}

export async function updateCartItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const slug = (formData.get("slug") as string)?.trim();
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!slug) {
    return { success: false, message: "Product is missing." };
  }

  const cart = await getCart(userId, guestId);
  if (!cart) {
    return { success: false, message: "Cart not found." };
  }

  const item = cart.cart_items.find((row) => row.product?.slug === slug);
  if (!item) {
    return { success: false, message: "Item not found in cart." };
  }

  if (quantity < 1) {
    const { error } = await supabase.from("cart_items").delete().eq("id", item.id);
    if (error) return { success: false, message: error.message };
    await clearCouponIfCartEmpty(supabase, cart.id);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: Math.min(maxOrderableQuantity(item.product?.stock_quantity), quantity) })
      .eq("id", item.id);
    if (error) return { success: false, message: error.message };
  }

  revalidatePath("/cart");
  return { success: true, message: "Cart updated." };
}

export async function removeCartItem(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const slug = (formData.get("slug") as string)?.trim();
  if (!slug) {
    return { success: false, message: "Product is missing." };
  }

  const cart = await getCart(userId, guestId);
  if (!cart) {
    return { success: false, message: "Cart not found." };
  }

  const item = cart.cart_items.find((row) => row.product?.slug === slug);
  if (!item) {
    return { success: false, message: "Item not found in cart." };
  }

  const { error } = await supabase.from("cart_items").delete().eq("id", item.id);
  if (error) return { success: false, message: error.message };

  await clearCouponIfCartEmpty(supabase, cart.id);

  revalidatePath("/cart");
  return { success: true, message: "Item removed." };
}

export async function clearCartAction(): Promise<FormResult> {
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const cart = await getCart(userId, guestId);
  if (!cart) {
    return { success: true, message: "Cart is already empty." };
  }

  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  if (error) return { success: false, message: error.message };

  await supabase.from("carts").update({ coupon_code: null }).eq("id", cart.id);

  revalidatePath("/cart");
  return { success: true, message: "Cart cleared." };
}

export interface CouponActionResult extends FormResult {
  coupon?: ValidatedCoupon | null;
}

export async function applyCoupon(
  prevState: CouponActionResult | null,
  formData: FormData,
): Promise<CouponActionResult> {
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const code = (formData.get("couponCode") as string)?.trim().toUpperCase();
  if (!code) {
    return { success: false, message: "Please enter a coupon code." };
  }

  const cart = await getOrCreateCart(userId, guestId);

  // Closes the same hole from the other side: a code accepted against an empty basket would sit
  // on the row waiting for the next product, which is exactly the behaviour being fixed here.
  if (cart.cart_items.length === 0) {
    return { success: false, message: "Add something to your cart before applying a code." };
  }

  const subtotal = cart.cart_items.reduce(
    (sum, row) => sum + (row.product?.price ?? 0) * row.quantity,
    0,
  );

  const result = await validateCouponForSubtotal(code, subtotal);
  if (!result.success) {
    return { success: false, message: result.message };
  }

  const { error } = await supabase
    .from("carts")
    .update({ coupon_code: result.coupon.code })
    .eq("id", cart.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/cart");
  const discountLabel =
    result.coupon.discountType === "percentage"
      ? `${result.coupon.discountValue}% off`
      : `₹${result.coupon.discountValue} off`;
  return {
    success: true,
    message: `Code "${result.coupon.code}" applied — ${discountLabel}.`,
    coupon: result.coupon,
  };
}

export async function removeCoupon(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  // Signature kept compatible with useActionState; neither argument is needed here.
  void prevState;
  void formData;
  const { userId, guestId } = await getCartIdentifiers();
  const supabase = createServiceClient();

  const cart = await getCart(userId, guestId);
  if (!cart) {
    return { success: true, message: "No coupon applied." };
  }

  const { error } = await supabase
    .from("carts")
    .update({ coupon_code: null })
    .eq("id", cart.id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/cart");
  return { success: true, message: "Coupon removed." };
}

export async function mergeGuestCart(guestId: string): Promise<FormResult> {
  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const userId = userData.user?.id;
  if (!userId || !guestId) {
    return { success: false, message: "Missing user or guest id." };
  }

  const supabase = createServiceClient();
  const guestCart = await getCart(undefined, guestId);
  const userCart = await getOrCreateCart(userId);

  if (!guestCart || guestCart.cart_items.length === 0) {
    return { success: true, message: "Nothing to merge." };
  }

  for (const item of guestCart.cart_items) {
    const product = item.product;
    if (!product) continue;
    const existing = userCart.cart_items.find((row) => row.product?.id === product.id);
    if (existing) {
      await supabase
        .from("cart_items")
        .update({
          quantity: Math.min(MAX_QUANTITY, existing.quantity + item.quantity),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({
        cart_id: userCart.id,
        product_id: product.id,
        quantity: Math.min(MAX_QUANTITY, item.quantity),
      });
    }
  }

  await supabase.from("carts").delete().eq("id", guestCart.id);
  revalidatePath("/cart");
  return { success: true, message: "Cart synced." };
}
