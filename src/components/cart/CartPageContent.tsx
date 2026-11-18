"use client";

import { useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Minus, Plus, ShoppingBag, TriangleAlert, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/inputStyles";
import { CollectionEyebrow as Eyebrow } from "@/components/collection/Eyebrow";
import { formatPrice } from "@/components/sections/productFormat";
import { useCart } from "@/components/cart/CartContext";
import { MAX_QUANTITY, maxOrderableQuantity } from "@/lib/cart/types";

const assurances = [
  { Icon: Lock, label: "Secure Checkout" },
  { Icon: Truck, label: "Free Shipping" },
];

function EmptyCart() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <ShoppingBag size={40} strokeWidth={1.2} className="text-neutral-200" />
      <h2 className="mt-5 font-heading text-2xl text-neutral-500">Your Cart Is Empty</h2>
      <p className="mt-2 max-w-[40ch] font-body text-neutral-300">
        Looks like you haven&rsquo;t added any pieces yet — go on, find one to fall in love with.
      </p>
      <Button href="/products" variant="primary" className="mt-8">
        Continue Shopping
      </Button>
    </div>
  );
}

export function CartPageContent() {
  const { items, subtotal, discount, total, coupon, couponLabel, applyCoupon, removeCoupon, updateQuantity, removeItem } =
    useCart();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isApplying, startApplyTransition] = useTransition();

  function handleApply(e: FormEvent) {
    e.preventDefault();
    startApplyTransition(async () => {
      const result = await applyCoupon(code);
      setMessage({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) setCode("");
    });
  }

  function handleRemoveCoupon() {
    removeCoupon();
    setCode("");
    setMessage(null);
  }

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-content px-6 sm:px-10 lg:px-10">
        <div className="text-center">
          <Eyebrow>{items.length > 0 ? `${items.length} Item${items.length > 1 ? "s" : ""}` : "Your Bag"}</Eyebrow>
          <h1 className="mt-3 font-heading text-3xl text-neutral-500 sm:text-4xl">Shopping Cart</h1>
        </div>

        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <ul aria-label="Cart items" className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
              {items.map((item) => (
                <li key={item.slug} className="flex gap-5 py-6">
                  <Link href={`/products/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden bg-pink-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover object-left"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-body text-[13px] uppercase tracking-[0.04em] text-neutral-500 hover:text-brown"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 font-body text-sm text-neutral-300">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.slug)}
                        className="cursor-pointer -m-2 shrink-0 p-2 text-neutral-300 transition-colors hover:text-brown"
                      >
                        <X size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* flex-wrap because at 320px the stepper (104px) leaves only ~52px beside it,
                        which is narrower than the price. Without wrapping the price shrinks and breaks
                        at its space into "₹" / "8,800.00" across two lines. */}
                    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                      <div className="flex shrink-0 items-center border border-neutral-100">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="cursor-pointer disabled:cursor-not-allowed p-2.5 text-neutral-400 transition-colors hover:text-brown disabled:opacity-40"
                        >
                          <Minus size={13} strokeWidth={1.5} />
                        </button>
                        <span
                          aria-live="polite"
                          aria-label={`Quantity: ${item.quantity}`}
                          className="w-9 text-center font-body text-sm text-neutral-500"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                          disabled={item.quantity >= maxOrderableQuantity(item.stock)}
                          className="cursor-pointer disabled:cursor-not-allowed p-2.5 text-neutral-400 transition-colors hover:text-brown disabled:opacity-40"
                        >
                          <Plus size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                      {/* ml-auto keeps the price hard right on the line of its own it takes when the
                          row wraps, where justify-between would otherwise park it at the start. */}
                      <div className="ml-auto shrink-0 text-right">
                        <p className="font-body text-neutral-500">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {/* Matches the product page's low-stock strip, one step smaller: this
                            repeats per cart row, so a full-size block on every line would shout
                            over the totals it sits beside. */}
                        {item.quantity >= maxOrderableQuantity(item.stock) &&
                          item.stock < MAX_QUANTITY && (
                            <p
                              role="status"
                              className="mt-1.5 inline-flex items-center gap-1.5 border border-terracotta/40 bg-terracotta/8 px-2.5 py-1 font-body text-sm font-semibold text-terracotta"
                            >
                              <TriangleAlert size={14} strokeWidth={1.8} className="shrink-0" />
                              Only {item.stock} left
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="h-fit">
              <div className="border border-neutral-100 bg-pink-100/40 p-8">
                <h2 className="font-heading text-xl text-neutral-500">Order Summary</h2>
                <div className="mt-6 flex flex-col gap-2 font-body text-neutral-400">
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
                </div>
                {/* Was "Shipping and taxes calculated at checkout", which contradicted
                    both the Free Shipping badge above and the tax-inclusive pricing the
                    invoice is built on — it implied charges were still to be added. */}
                <p className="mt-2 font-body text-sm text-neutral-300">
                  Free shipping across India. All prices include GST.
                </p>

                <div className="mt-6 border-t border-neutral-200 pt-6">
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
                    <form onSubmit={handleApply} className="flex gap-2">
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Coupon Code"
                        aria-label="Coupon code"
                        className={`${inputClasses} !py-2.5`}
                      />
                      <Button
                        type="submit"
                        variant="secondary"
                        icon={false}
                        disabled={isApplying}
                        className="shrink-0 !py-2.5"
                      >
                        {isApplying ? "Applying…" : "Apply"}
                      </Button>
                    </form>
                  )}
                  {message && (
                    <p
                      className={`mt-2 font-body text-xs ${
                        message.type === "error" ? "text-terracotta" : "text-brown"
                      }`}
                    >
                      {message.text}
                    </p>
                  )}
                </div>

                {discount > 0 && (
                  <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4 font-heading text-neutral-500">
                    <span className="text-sm uppercase tracking-widest">Total</span>
                    <span className="text-lg">{formatPrice(total)}</span>
                  </div>
                )}

                <Button href="/checkout" variant="primary" icon={false} className="mt-6 w-full justify-center">
                  Proceed to Checkout
                </Button>

                <Link
                  href="/products"
                  className="mt-4 block text-center font-heading text-[11px] uppercase tracking-widest text-neutral-400 transition-colors hover:text-brown"
                >
                  Continue Shopping
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
        )}
      </div>
    </section>
  );
}
