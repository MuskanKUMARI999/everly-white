export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  /** Units the shop actually has. Carried so the +/- stepper can stop at the real limit. */
  stock: number;
}

export type CartProduct = Omit<CartItem, "quantity" | "stock"> & { stock?: number };

/** Per-line ceiling regardless of stock — stops a fat-fingered order for 500 plates. */
export const MAX_QUANTITY = 9;

/**
 * How many of a piece a customer may actually put in their bag.
 *
 * The steppers used to stop at MAX_QUANTITY alone, so a piece with 1 left still offered a "9".
 * createOrder always re-checked stock server-side, so nothing could be oversold — but the customer
 * only found out at the pay button, which is the worst possible moment to be told.
 *
 * Undefined stock means "unknown, don't guess" and falls back to the flat cap; the server re-checks
 * regardless, so a stale client-side number can never oversell.
 */
export function maxOrderableQuantity(stock: number | null | undefined): number {
  if (stock === null || stock === undefined) return MAX_QUANTITY;
  return Math.max(0, Math.min(MAX_QUANTITY, stock));
}

export type FormResult = { success: boolean; message: string };

export interface ValidatedCoupon {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number | null;
}

export function calculateDiscount(coupon: ValidatedCoupon | null, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.discountType === "percentage") {
    return Math.round((subtotal * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, subtotal);
}
