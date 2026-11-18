"use client";
import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Lock, Truck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/inputStyles";
import { INDIA_PHONE_DIGITS, onlyDigits } from "@/components/ui/countryCodes";
import { StateSelect } from "@/components/ui/StateSelect";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { formatPrice } from "@/components/sections/productFormat";
import { useCart } from "@/components/cart/CartContext";
import { createOrder, verifyPayment, type OrderResult } from "@/lib/checkout/actions";
import type { FormResult } from "@/lib/cart/types";
import type { Address } from "@/lib/auth/profile-actions";

const assurances = [
  { Icon: Lock, label: "Secure Checkout" },
  { Icon: Truck, label: "Free Shipping" },
];

interface FormState {
  email: string;
  fullName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pin: string;
}

const initialForm: FormState = {
  email: "",
  fullName: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pin: "",
};

// Radio value for "type a fresh address" — the only choice a guest ever has.
const NEW_ADDRESS = "new";

// The seven shipping fields createOrder expects, resolved from whichever source the customer chose.
type ShippingFields = Omit<FormState, "email">;

export interface CheckoutContact {
  email: string;
  fullName: string;
  phone: string;
}

interface CheckoutContentProps {
  /**
   * Whether the server has Razorpay keys. Resolved server-side because only the server can see
   * them — this used to be inferred from `orderResult`, which is null until *after* the customer
   * presses pay, so a fully configured shop told every shopper their checkout was simulated while
   * they were still typing their address.
   */
  paymentsConfigured: boolean;
  /**
   * True when nobody is signed in. Guests have the Payment section and the pay button locked
   * until every required field holds a valid value; signed-in customers are left as they were.
   */
  isGuest: boolean;
  /** Signed-in customer's address book, already ordered default-first. Empty for guests. */
  savedAddresses: Address[];
  /** Profile details used to prefill the blank form. All empty strings for guests. */
  contact: CheckoutContact;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

// Selectable address card. Children are all phrasing content (spans, not divs) because a <label>
// may only contain phrasing content — nesting a <div> here would be invalid HTML.
function AddressChoice({
  value,
  checked,
  onSelect,
  children,
}: {
  value: string;
  checked: boolean;
  onSelect: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border p-5 transition-colors ${
        checked ? "border-brown bg-pink-100/40" : "border-neutral-100 hover:border-neutral-200"
      }`}
    >
      <input
        type="radio"
        name="shippingAddressChoice"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brown"
      />
      <span className="font-body text-sm leading-relaxed text-neutral-400">{children}</span>
    </label>
  );
}

function SectionHeading({ numeral, title }: { numeral: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-neutral-100 pb-3">
      <span className="font-heading text-sm italic text-brown">{numeral}</span>
      <h2 className="font-heading text-sm uppercase tracking-[0.2em] text-neutral-500">{title}</h2>
    </div>
  );
}

export function CheckoutContent({
  paymentsConfigured,
  isGuest,
  savedAddresses,
  contact,
}: CheckoutContentProps) {
  const {
    items,
    subtotal,
    discount,
    total,
    coupon,
    couponLabel,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isApplyingCoupon, startCouponTransition] = useTransition();
  const [form, setForm] = useState<FormState>({ ...initialForm, ...contact });
  // getAddressesByUser orders default-first, so entry 0 is the one to preselect — this is what
  // "mark one as default and it'll be selected for you at checkout" actually means.
  const [addressChoice, setAddressChoice] = useState(savedAddresses[0]?.id ?? NEW_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<FormResult | null>(null);
  // Captured at submit time: the confirmation screen must show who the order actually shipped to,
  // which is the chosen saved address, not whatever is sitting in the (possibly hidden) form.
  const [placedFor, setPlacedFor] = useState<{ name: string; email: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedAddress = savedAddresses.find((a) => a.id === addressChoice) ?? null;

  // Mirrors the checks in handleSubmit, so the section only unlocks once a submit would pass them.
  const guestFormComplete =
    /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
    form.fullName.trim() !== "" &&
    form.phone.trim().length === INDIA_PHONE_DIGITS &&
    form.address1.trim() !== "" &&
    form.city.trim() !== "" &&
    form.state.trim() !== "" &&
    /^\d{6}$/.test(form.pin.trim());
  const paymentLocked = isGuest && !guestFormComplete;

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    startCouponTransition(async () => {
      const result = await applyCoupon(couponCode);
      setCouponMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) setCouponCode("");
    });
  }

  function handleRemoveCoupon() {
    removeCoupon();
    setCouponCode("");
    setCouponMessage(null);
  }

  // One resolver for both sources, so validation and submission can never disagree about which
  // address is being used.
  function resolveShipping(): ShippingFields {
    if (selectedAddress) {
      return {
        fullName: selectedAddress.full_name,
        // Addresses saved under the old loose rule can hold "+91 98765 43210" or a spaced number.
        // Those never pass through the checkout field's own normalisation, so they are trimmed to
        // the national 10 digits here rather than being rejected by the action with nothing on
        // screen for the customer to correct.
        phone: onlyDigits(selectedAddress.phone).slice(-INDIA_PHONE_DIGITS),
        address1: selectedAddress.line1,
        address2: selectedAddress.line2 ?? "",
        city: selectedAddress.city,
        state: selectedAddress.state,
        pin: selectedAddress.pin_code,
      };
    }
    return {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pin: form.pin.trim(),
    };
  }

  async function openRazorpay(order: OrderResult) {
    try {
      await loadRazorpayScript();
      const options: RazorpayOptions = {
        key: order.razorpayKeyId!,
        // Must match the integer paisa amount the server sent to Razorpay (see createOrder).
        amount: Math.round(order.amount! * 100),
        currency: "INR",
        name: "Everly White",
        description: `Order ${order.orderNumber}`,
        order_id: order.razorpayOrderId!,
        handler: (response: RazorpayResponse) => {
          const fd = new FormData();
          fd.set("orderId", order.orderId!);
          fd.set("razorpayOrderId", response.razorpay_order_id);
          fd.set("razorpayPaymentId", response.razorpay_payment_id);
          fd.set("razorpaySignature", response.razorpay_signature);
          verifyPayment(null, fd).then((result) => {
            if (result.success) {
              clearCart();
            }
            setVerifyResult(result);
          });
        },
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#8B5E3C" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Razorpay error:", e);
      setError(e instanceof Error ? e.message : "Payment window could not be opened.");
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOrderResult(null);
    setVerifyResult(null);

    const email = form.email.trim();
    const shipping = resolveShipping();
    if (
      !email ||
      !shipping.fullName ||
      !shipping.phone ||
      !shipping.address1 ||
      !shipping.city ||
      !shipping.state ||
      !shipping.pin
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // Also re-checked for saved addresses — an older row could predate the 6-digit rule.
    if (!/^\d{6}$/.test(shipping.pin)) {
      setError(
        selectedAddress
          ? "The saved address has an invalid PIN code. Please update it in your address book."
          : "Please enter a valid 6-digit PIN code.",
      );
      return;
    }

    setPlacedFor({ name: shipping.fullName, email });

    const fd = new FormData();
    fd.set("email", email);
    fd.set("fullName", shipping.fullName);
    fd.set("phone", shipping.phone);
    fd.set("address1", shipping.address1);
    fd.set("address2", shipping.address2);
    fd.set("city", shipping.city);
    fd.set("state", shipping.state);
    fd.set("pin", shipping.pin);
    fd.set("couponCode", coupon ?? "");
    fd.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await createOrder(null, fd);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setOrderResult(result);
      if (result.razorpayOrderId && result.razorpayKeyId) {
        await openRazorpay(result);
      } else {
        const fd2 = new FormData();
        fd2.set("orderId", result.orderId!);
        fd2.set("razorpayOrderId", `demo_${result.orderNumber}`);
        fd2.set("razorpayPaymentId", `demo_${Date.now()}`);
        const verify = await verifyPayment(null, fd2);
        if (verify.success) {
          clearCart();
        }
        setVerifyResult(verify);
      }
    });
  }

  if (verifyResult?.success) {
    return (
      <div className="mx-auto max-w-130 px-6 py-24 text-center">
        <CheckCircle2 size={44} strokeWidth={1.2} className="mx-auto text-brown" />
        <Eyebrow>Order Confirmed</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-light text-neutral-500 sm:text-4xl">
          Thank You{placedFor?.name ? `, ${placedFor.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-4 font-body text-neutral-400">
          Your order{" "}
          <span className="font-semibold text-neutral-500">
            #{orderResult?.orderNumber ?? ""}
          </span>{" "}
          has been placed. We&rsquo;ve sent a confirmation to {placedFor?.email ?? ""}, and your pieces will be on their way soon.
        </p>
        <Button href="/products" variant="primary" className="mt-8">
          Continue Shopping
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-120 px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-light text-neutral-500">Your Cart Is Empty</h1>
        <p className="mt-3 font-body text-neutral-400">Add a piece to your bag before heading to checkout.</p>
        <Button href="/products" variant="primary" className="mt-8">
          Shop Now
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-content px-6 py-10 sm:px-10 sm:py-14 lg:px-10">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <form id="checkout-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <SectionHeading numeral="i" title="Contact" />
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Email Address"
              aria-label="Email Address"
              autoComplete="email"
              className={inputClasses}
            />
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading numeral="ii" title="Shipping Address" />

            {savedAddresses.length > 0 && (
              <div
                role="radiogroup"
                aria-label="Choose a shipping address"
                className="flex flex-col gap-3"
              >
                {savedAddresses.map((address) => (
                  <AddressChoice
                    key={address.id}
                    value={address.id}
                    checked={addressChoice === address.id}
                    onSelect={setAddressChoice}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-neutral-500">{address.full_name}</span>
                      {address.is_default && (
                        <span className="font-heading text-[10px] uppercase tracking-[0.1em] text-brown">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block">{address.phone}</span>
                    <span className="mt-1 block">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </span>
                    <span className="mt-1 block">
                      {address.city}, {address.state} &mdash; {address.pin_code}
                    </span>
                  </AddressChoice>
                ))}

                <AddressChoice
                  value={NEW_ADDRESS}
                  checked={addressChoice === NEW_ADDRESS}
                  onSelect={setAddressChoice}
                >
                  <span className="font-semibold text-neutral-500">
                    Ship to a different address
                  </span>
                </AddressChoice>
              </div>
            )}

            {!selectedAddress && (
              <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input
                required
                name="fullName"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Full Name"
                aria-label="Full Name"
                autoComplete="name"
                className={inputClasses}
              />
              <input
                required
                name="phone"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                // Digits only, capped at 10: this address ships within India (SHIPPING_COUNTRY),
                // so there is no country selector here and no other length to allow.
                onChange={(e) => update("phone", onlyDigits(e.target.value).slice(0, INDIA_PHONE_DIGITS))}
                maxLength={INDIA_PHONE_DIGITS}
                placeholder={`Phone Number (${INDIA_PHONE_DIGITS} digits)`}
                aria-label="Phone Number"
                autoComplete="tel"
                className={inputClasses}
              />
            </div>
            <input
              required
              name="address1"
              value={form.address1}
              onChange={(e) => update("address1", e.target.value)}
              placeholder="Address Line 1"
              aria-label="Address Line 1"
              autoComplete="address-line1"
              className={inputClasses}
            />
            <input
              name="address2"
              value={form.address2}
              onChange={(e) => update("address2", e.target.value)}
              placeholder="Address Line 2 (Optional)"
              aria-label="Address line 2 (optional)"
              autoComplete="address-line2"
              className={inputClasses}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <input
                required
                name="city"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="City"
                aria-label="City"
                autoComplete="address-level2"
                className={inputClasses}
              />
              <StateSelect
                required
                value={form.state}
                onChange={(value) => update("state", value)}
                className={inputClasses}
              />
              <input
                required
                name="pin"
                value={form.pin}
                onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="PIN Code"
                aria-label="PIN Code"
                inputMode="numeric"
                autoComplete="postal-code"
                className={inputClasses}
              />
            </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <SectionHeading numeral="iii" title="Shipping Method" />
            <div className="flex items-center justify-between border border-brown bg-pink-100/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border-[5px] border-brown" />
                <span className="font-body text-neutral-500">Standard Shipping</span>
              </div>
              <span className="font-heading text-[11px] uppercase tracking-widest text-brown">Free</span>
            </div>
          </div>

          <fieldset
            disabled={paymentLocked}
            aria-disabled={paymentLocked}
            className={`flex min-w-0 flex-col gap-4 transition-opacity duration-300 ${
              paymentLocked ? "pointer-events-none select-none opacity-40" : ""
            }`}
          >
            <SectionHeading numeral="iv" title="Payment" />
            <div className="flex items-center gap-3 border border-neutral-100 px-5 py-4">
              <Lock size={18} strokeWidth={1.4} className="shrink-0 text-brown" />
              <p className="font-body text-sm text-neutral-400">
                Secure checkout powered by{" "}
                <span className="font-semibold text-neutral-500">Razorpay</span> — you&rsquo;ll enter your
                payment details on the next step.
              </p>
            </div>
            <p className="font-body text-xs text-neutral-300">
              {orderResult?.razorpayOrderId
                ? "Razorpay checkout is ready. Complete the payment window to confirm your order."
                : paymentsConfigured
                  ? "You'll be taken to Razorpay's secure payment window once you place your order."
                  : "Payments aren't connected yet, so this is a simulated checkout — nothing will be charged."}
            </p>
          </fieldset>

          {/* Sits outside the fieldset so it isn't dimmed with the section it explains. */}
          {paymentLocked && (
            <p className="-mt-8 font-body text-xs text-brown" aria-live="polite">
              Complete your contact and shipping details above to continue to payment.
            </p>
          )}

          {error && (
            <p className="font-body text-sm text-terracotta" role="alert">
              {error}
            </p>
          )}
        </form>

        <div className="h-fit lg:sticky lg:top-24">
          <div className="border border-neutral-100 bg-pink-100/40 p-8">
            <h2 className="font-heading text-xl text-neutral-500">Order Summary</h2>

            <ul aria-label="Order items" className="mt-6 flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.slug} className="flex items-center gap-4">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden bg-white">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover object-left"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500">
                        {item.name}
                      </span>
                      <span className="font-body text-xs text-neutral-300">Qty {item.quantity}</span>
                    </div>
                    <span className="shrink-0 font-body text-sm text-neutral-400">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col gap-2 border-t border-neutral-200 pt-4 font-body text-neutral-400">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="text-neutral-500">{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-brown">
                  <span>Discount{couponLabel ? ` (${coupon})` : ""}</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span className="text-neutral-500">Free</span>
              </div>
            </div>

            {/* The FAQ, the welcome popup and the welcome email all tell customers to enter
                WELCOME5 "at checkout" — but the only input lived on /cart, so anyone who went
                straight from a product page to checkout had nowhere to type it. */}
            <div className="mt-4 border-t border-neutral-200 pt-4">
              {coupon ? (
                <div className="flex items-center justify-between font-body text-sm">
                  <span className="text-neutral-500">
                    Code <span className="font-semibold text-brown">{coupon}</span> applied
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="cursor-pointer font-heading text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-brown"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                // Deliberately not a <form>: this block sits inside the order-summary column, but
                // the submit Button below targets the checkout form by id. A nested form would be
                // invalid HTML, and Enter in the code box would try to place the order.
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Coupon Code"
                    aria-label="Coupon code"
                    className={`${inputClasses} !py-2.5`}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    icon={false}
                    disabled={isApplyingCoupon}
                    onClick={handleApplyCoupon}
                    className="shrink-0 !py-2.5"
                  >
                    {isApplyingCoupon ? "Applying…" : "Apply"}
                  </Button>
                </div>
              )}
              {couponMessage && (
                <p
                  className={`mt-2 font-body text-xs ${
                    couponMessage.type === "error" ? "text-terracotta" : "text-brown"
                  }`}
                >
                  {couponMessage.text}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 font-heading text-neutral-500">
              <span className="text-sm uppercase tracking-widest">Total</span>
              <span className="text-lg">{formatPrice(total)}</span>
            </div>

            <Button
              type="submit"
              form="checkout-form"
              variant="primary"
              icon={false}
              disabled={isPending || paymentLocked}
              className="mt-6 w-full justify-center"
            >
              {isPending ? "Processing…" : `Pay ${formatPrice(total)} Securely`}
            </Button>

            <Link
              href="/cart"
              className="mt-4 block text-center font-heading text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-brown"
            >
              Back To Cart
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {assurances.map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <Icon size={18} strokeWidth={1.4} className="text-brown" />
                <span className="font-body text-[11px] leading-snug text-neutral-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
