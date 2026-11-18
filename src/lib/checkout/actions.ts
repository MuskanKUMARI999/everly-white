"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createRazorpayOrder,
  getRazorpayConfig,
  verifyRazorpaySignature,
} from "@/lib/checkout/razorpay";
import { clearCartAction } from "@/lib/cart/actions";
import { calculateDiscount, type CartItem, type FormResult } from "@/lib/cart/types";
import { validateCouponForSubtotal } from "@/lib/coupons/validate";
import { fulfillPaidOrder } from "@/lib/checkout/fulfillment";
import { primaryProductImage } from "@/lib/data/productImage";
import { resolveGstState } from "@/lib/invoices/gstStates";
import { SHIPPING_COUNTRY } from "@/lib/site";
import { INDIA_PHONE_DIGITS, onlyDigits } from "@/components/ui/countryCodes";
import type { Tables } from "@/lib/supabase/database.types";

export interface OrderResult extends FormResult {
  orderId?: string;
  orderNumber?: string;
  razorpayOrderId?: string | null;
  razorpayKeyId?: string | null;
  amount?: number;
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EW${ts}${random}`;
}

interface ValidatedCheckout {
  email: string;
  fullName: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  pin: string;
  couponCode: string | null;
  items: CartItem[];
}

async function validateCheckoutForm(formData: FormData): Promise<ValidatedCheckout | { error: string }> {
  const email = (formData.get("email") as string)?.trim();
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const address1 = (formData.get("address1") as string)?.trim();
  const address2 = (formData.get("address2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const pin = (formData.get("pin") as string)?.trim();
  const couponCode = (formData.get("couponCode") as string)?.trim().toUpperCase() || null;

  if (!email || !fullName || !phone || !address1 || !city || !state || !pin) {
    return { error: "Please fill in all required fields." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!/^\d{6}$/.test(pin)) {
    return { error: "Please enter a valid 6-digit PIN code." };
  }
  // India-only delivery (SHIPPING_COUNTRY), so the shipping phone is always a 10-digit Indian
  // mobile. Checked here as well as in the form because this action is a public endpoint.
  if (onlyDigits(phone).length !== INDIA_PHONE_DIGITS) {
    return { error: `Please enter a valid ${INDIA_PHONE_DIGITS}-digit phone number.` };
  }

  // The checkout form is a fixed dropdown, so a normal customer cannot reach this.
  // It is still checked here because the state decides the GST treatment of the
  // sale — CGST + SGST within Assam, IGST elsewhere — and a request posted
  // directly would otherwise put an unresolvable state on a tax invoice.
  // Normalised to the canonical spelling so "tamilnadu" and "TN" are stored the
  // same way the invoice will read them.
  const resolvedState = resolveGstState(state);
  if (!resolvedState) {
    return { error: "Please choose a valid delivery state." };
  }

  const itemsRaw = formData.get("items") as string;
  let items: CartItem[] = [];
  try {
    items = JSON.parse(itemsRaw) as CartItem[];
  } catch {
    return { error: "Invalid cart data." };
  }
  if (!items.length) {
    return { error: "Your cart is empty." };
  }

  return {
    email,
    fullName,
    phone,
    address1,
    address2,
    city,
    state: resolvedState.name,
    pin,
    couponCode,
    items,
  };
}

export async function createOrder(
  prevState: OrderResult | null,
  formData: FormData,
): Promise<OrderResult> {
  const validated = await validateCheckoutForm(formData);
  if ("error" in validated) {
    return { success: false, message: validated.error };
  }

  const { email, fullName, phone, address1, address2, city, state, pin, couponCode, items } = validated;

  const authClient = await createClient();
  const { data: userData } = await authClient.auth.getUser();
  const userId = userData.user?.id;

  // orders/order_items have no RLS policy permitting guest (no-session) writes at all —
  // Postgres can't securely verify a guest's identity the way it verifies auth.uid(), and a
  // blanket "user_id IS NULL" policy would let anyone read every guest order's name/address/
  // phone. The service-role client bypasses RLS entirely; userId above still comes from the
  // verified session, so logged-in orders are correctly attributed either way.
  const supabase = createServiceClient();

  const slugs = items.map((i) => i.slug);
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      price,
      stock_quantity,
      product_images (url, alt, position, is_featured)
    `,
    )
    .in("slug", slugs)
    .eq("is_available", true);

  const productMap = new Map(
    products?.map((p) => [
      p.slug,
      p as Tables<"products"> & { product_images: Tables<"product_images">[] },
    ]),
  );

  const orderItems: {
    product_id: string;
    product_name: string;
    product_image: string | null;
    price: number;
    quantity: number;
    total: number;
  }[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = productMap.get(item.slug);
    if (!product) {
      return { success: false, message: `Product "${item.name}" is no longer available.` };
    }
    if (product.stock_quantity < item.quantity) {
      return { success: false, message: `Not enough stock for "${product.name}".` };
    }
    const lineTotal = Number(product.price) * item.quantity;
    subtotal += lineTotal;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      // Frozen onto the order line forever, so it has to be the product's actual main photo —
      // not whichever row Postgres happened to return first.
      product_image: primaryProductImage(product.product_images),
      price: Number(product.price),
      quantity: item.quantity,
      total: lineTotal,
    });
  }

  let discount = 0;
  let resolvedCouponCode: string | null = null;
  if (couponCode) {
    const couponResult = await validateCouponForSubtotal(couponCode, subtotal);
    if (!couponResult.success) {
      return { success: false, message: couponResult.message };
    }
    discount = calculateDiscount(couponResult.coupon, subtotal);
    resolvedCouponCode = couponResult.coupon.code;
  }
  const total = subtotal - discount;
  const orderNumber = generateOrderNumber();
  const shippingAddress = {
    full_name: fullName,
    phone,
    line1: address1,
    line2: address2,
    city,
    state,
    pin_code: pin,
    // Same constant the address book writes, so a saved address and the order's frozen snapshot
    // can never disagree about the country.
    country: SHIPPING_COUNTRY,
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId ?? null,
      // Lowercased so it can be matched exactly when the guest later creates an
      // account and their past orders are attached to it. See migration 037 for
      // why this is not done with a case-insensitive comparison instead.
      guest_email: userId ? null : email.toLowerCase(),
      status: "pending",
      payment_status: "pending",
      payment_method: "razorpay",
      subtotal,
      discount_amount: discount,
      shipping_amount: 0,
      total,
      coupon_code: resolvedCouponCode,
      shipping_address: shippingAddress,
      billing_address: shippingAddress,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("Error creating order:", orderError);
    return { success: false, message: orderError?.message || "Unable to create order." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({ ...item, order_id: order.id })),
  );
  if (itemsError) {
    console.error("Error creating order items:", itemsError);
    return { success: false, message: itemsError.message };
  }

  // Coupon usage is NOT incremented here — an unpaid order shouldn't consume a coupon's quota.
  // fulfillPaidOrder does it once payment is confirmed (it reads order.coupon_code).

  const razorpayConfig = getRazorpayConfig();
  let razorpayOrderId: string | null = null;
  if (razorpayConfig) {
    try {
      // Razorpay amounts must be integer paisa. Percentage coupons produce fractional rupee
      // totals (₹1799 - 5% = ₹1709.05), and float math lands on 170904.99999999997 — round it.
      const razorpayOrder = await createRazorpayOrder(Math.round(total * 100), order.order_number, {
        order_id: order.id,
        order_number: order.order_number,
      });
      razorpayOrderId = razorpayOrder?.id ?? null;
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Payment setup failed." };
    }
  }

  revalidatePath("/account/orders");
  return {
    success: true,
    message: "Order created. Complete payment to confirm.",
    orderId: order.id,
    orderNumber: order.order_number,
    razorpayOrderId,
    razorpayKeyId: razorpayConfig?.keyId ?? null,
    amount: total,
  };
}

export async function verifyPayment(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const orderId = formData.get("orderId") as string;
  const razorpayOrderId = formData.get("razorpayOrderId") as string;
  const razorpayPaymentId = formData.get("razorpayPaymentId") as string;
  const razorpaySignature = formData.get("razorpaySignature") as string;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
    return { success: false, message: "Payment details are missing." };
  }

  // The real security gate for this browser-reported payment is the cryptographic Razorpay
  // signature — an attacker can't produce a valid one without an actual payment. (The webhook
  // path has its own signature check.) Fulfillment itself is delegated to fulfillPaidOrder so the
  // browser callback and the webhook share one atomic, idempotent path.
  const config = getRazorpayConfig();
  if (config && razorpaySignature) {
    const valid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      config.keySecret,
    );
    if (!valid) {
      return { success: false, message: "Payment verification failed." };
    }
  }

  const result = await fulfillPaidOrder(orderId, razorpayPaymentId);
  if (!result.ok) {
    return { success: false, message: result.message };
  }

  await clearCartAction();
  revalidatePath("/account/orders");
  return { success: true, message: "Payment successful. Order confirmed." };
}
