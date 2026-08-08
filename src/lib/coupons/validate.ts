import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { ValidatedCoupon } from "@/lib/cart/types";

export type CouponValidationResult =
  | { success: true; coupon: ValidatedCoupon }
  | { success: false; message: string };

export async function validateCouponForSubtotal(
  rawCode: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { success: false, message: "Please enter a coupon code." };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { success: false, message: "This coupon code is not valid." };
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { success: false, message: "This coupon has expired." };
  }

  if (data.max_uses !== null && data.uses_count >= data.max_uses) {
    return { success: false, message: "This coupon has reached its usage limit." };
  }

  const minOrderAmount = data.min_order_amount !== null ? Number(data.min_order_amount) : null;
  if (minOrderAmount !== null && subtotal < minOrderAmount) {
    return {
      success: false,
      message: `This coupon requires a minimum order of ₹${minOrderAmount}.`,
    };
  }

  return {
    success: true,
    coupon: {
      code: data.code,
      discountType: data.discount_type,
      discountValue: Number(data.discount_value),
      minOrderAmount,
    },
  };
}

export async function incrementCouponUsage(rawCode: string): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return;

  // Atomic increment via RPC — a read-then-write here would let concurrent orders both read the
  // same count and under-increment. The DB guard also stops the count exceeding max_uses.
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("increment_coupon_usage", { p_code: code });
  if (error) {
    console.error("Failed to increment coupon usage:", error);
  }
}
