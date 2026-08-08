"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCartAction,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  removeCartItem as removeCartItemAction,
  clearCartAction,
  applyCoupon as applyCouponAction,
  removeCoupon as removeCouponAction,
} from "@/lib/cart/actions";
import {
  MAX_QUANTITY,
  maxOrderableQuantity,
  calculateDiscount,
  type CartItem,
  type CartProduct,
  type FormResult,
  type ValidatedCoupon,
} from "@/lib/cart/types";

export type { CartItem, CartProduct, FormResult };
export { MAX_QUANTITY };

// The cart is a small external store (synced to Supabase) rather than component state, so every
// consumer — header badge, product cards, cart page — reads the same live snapshot via
// useSyncExternalStore instead of each holding its own copy. Mutations update this in-memory
// snapshot immediately (optimistic UI, unchanged from the old localStorage-backed version) and
// persist to Supabase in the background — errors are logged, not surfaced, since the next full
// page load re-hydrates from the server and self-heals any drift.
const EMPTY_ITEMS: CartItem[] = [];
let items: CartItem[] = EMPTY_ITEMS;
let appliedCoupon: ValidatedCoupon | null = null;
const listeners = new Set<() => void>();

// Whose cart is currently in memory — a user id, or "guest". Signing out is an in-app navigation,
// not a document load, so without this the module keeps its values across the identity change and
// the previous customer's items stay on screen (header badge, cart page) until a hard refresh. On a
// shared device that shows one person their predecessor's bag, and any subsequent add-to-cart
// writes to the *guest* cart server-side while the screen still shows the old items.
//
// This replaces the old one-shot `hydrated` flag: the first render is simply the case where the
// remembered identity is null and therefore always differs.
let loadedIdentity: string | null = null;

function emitChange() {
  listeners.forEach((listener) => listener());
}

function logSyncError(action: string) {
  return (error: unknown) => {
    console.error(`Cart sync failed (${action}):`, error);
  };
}

function setItems(next: CartItem[]) {
  items = next;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Point the store at `identity`, reloading from the server if it changed.
 *
 * Clears first, then fetches: between sign-out and the round-trip completing there must be no
 * window in which the previous account's items are still on screen.
 */
function syncIdentity(identity: string) {
  if (loadedIdentity === identity) return;
  loadedIdentity = identity;

  items = EMPTY_ITEMS;
  appliedCoupon = null;
  emitChange();

  getCartAction()
    .then((snapshot) => {
      // A slower earlier request must not overwrite a newer identity's cart.
      if (loadedIdentity !== identity) return;
      items = snapshot.items;
      appliedCoupon = snapshot.coupon;
      emitChange();
    })
    .catch(logSyncError("identity sync"));
}

function getSnapshot() {
  return items;
}

function getServerSnapshot() {
  return EMPTY_ITEMS;
}

function getCouponSnapshot() {
  return appliedCoupon;
}

function getCouponServerSnapshot() {
  return null;
}

function addItem(product: CartProduct, quantity = 1) {
  const existing = items.find((item) => item.slug === product.slug);
  // Optimistic cap uses the stock we know about; the server re-clamps and the next snapshot
  // corrects anything stale, so this can never oversell — it just avoids a UI flicker.
  const cap = maxOrderableQuantity(product.stock ?? existing?.stock);
  if (existing) {
    setItems(
      items.map((item) =>
        item.slug === product.slug
          ? { ...item, quantity: Math.min(cap, item.quantity + quantity) }
          : item,
      ),
    );
  } else {
    setItems([
      ...items,
      { ...product, stock: product.stock ?? MAX_QUANTITY, quantity: Math.min(cap, quantity) },
    ]);
  }

  const formData = new FormData();
  formData.set("slug", product.slug);
  formData.set("quantity", String(quantity));
  addToCartAction(null, formData).catch(logSyncError("add item"));
}

function removeItem(slug: string) {
  const next = items.filter((item) => item.slug !== slug);
  // Removing the last line drops the coupon with it, mirroring what the server does. Without this
  // the discount stays in this in-memory snapshot and reappears in the order summary the moment
  // the next product is added — a discount the customer never re-entered.
  if (next.length === 0) appliedCoupon = null;
  setItems(next);

  const formData = new FormData();
  formData.set("slug", slug);
  removeCartItemAction(null, formData).catch(logSyncError("remove item"));
}

function updateQuantity(slug: string, quantity: number) {
  const stock = items.find((item) => item.slug === slug)?.stock;
  const clamped = Math.max(1, Math.min(maxOrderableQuantity(stock) || MAX_QUANTITY, quantity));
  setItems(items.map((item) => (item.slug === slug ? { ...item, quantity: clamped } : item)));

  const formData = new FormData();
  formData.set("slug", slug);
  formData.set("quantity", String(clamped));
  updateCartItemAction(null, formData).catch(logSyncError("update quantity"));
}

function clearCart() {
  appliedCoupon = null;
  setItems([]);
  clearCartAction().catch(logSyncError("clear cart"));
}

// Coupon validation now requires a database round-trip (real coupons table, checked against
// the current subtotal), so this is async — unlike the other mutators above, which stay
// synchronous/optimistic since they don't need server-computed data back.
async function applyCoupon(code: string): Promise<FormResult> {
  const formData = new FormData();
  formData.set("couponCode", code);
  const result = await applyCouponAction(null, formData);
  if (result.success && result.coupon) {
    appliedCoupon = result.coupon;
    emitChange();
  }
  return result;
}

function removeCoupon() {
  appliedCoupon = null;
  emitChange();
  removeCouponAction(null, new FormData()).catch(logSyncError("remove coupon"));
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  coupon: string | null;
  couponLabel: string | null;
  discount: number;
  total: number;
  addItem: typeof addItem;
  removeItem: typeof removeItem;
  updateQuantity: typeof updateQuantity;
  clearCart: typeof clearCart;
  applyCoupon: typeof applyCoupon;
  removeCoupon: typeof removeCoupon;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, identity }: { children: ReactNode; identity: string }) {
  const cartItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const coupon = useSyncExternalStore(subscribe, getCouponSnapshot, getCouponServerSnapshot);

  // Runs on mount (first load) and whenever the signed-in user changes. The root layout is
  // re-rendered on sign-in/sign-out by revalidatePath, so a new identity arrives as a prop here.
  useEffect(() => {
    syncIdentity(identity);
  }, [identity]);

  const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cartItems],
  );
  const couponLabel = coupon
    ? coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `₹${coupon.discountValue} off`
    : null;
  const discount = useMemo(() => calculateDiscount(coupon, subtotal), [subtotal, coupon]);
  const total = subtotal - discount;

  const value = useMemo(
    () => ({
      items: cartItems,
      itemCount,
      subtotal,
      coupon: coupon?.code ?? null,
      couponLabel,
      discount,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      applyCoupon,
      removeCoupon,
    }),
    [cartItems, itemCount, subtotal, coupon, couponLabel, discount, total],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
