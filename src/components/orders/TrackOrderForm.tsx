"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/inputStyles";
import { OrderCard } from "@/components/orders/OrderCard";
import { trackOrder } from "@/lib/orders/actions";

export function TrackOrderForm() {
  const [state, action, isPending] = useActionState(trackOrder, null);
  // Held so the invoice download below can re-submit it. The address is proof of
  // identity for a guest with no session, and the download route re-checks it on
  // every request rather than trusting that this lookup once succeeded.
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <form action={action} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="orderNumber" className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            Order Number
          </label>
          <input
            required
            id="orderNumber"
            name="orderNumber"
            placeholder="e.g. EW1AB2C3D4"
            autoComplete="off"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-500">
            Email Address
          </label>
          <input
            required
            id="email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email used at checkout"
            autoComplete="email"
            className={inputClasses}
          />
        </div>

        {state && !state.success && (
          <p className="font-body text-sm text-terracotta" role="alert">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          icon={false}
          disabled={isPending}
          className="mt-2 w-full justify-center"
        >
          {isPending ? "Searching…" : "Track Order"}
        </Button>
      </form>

      {state?.success && state.order && (
        <div className="flex flex-col gap-4">
          <p className="font-heading text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            Your Order
          </p>
          <OrderCard order={state.order} />

          {/* Only offered once payment has landed — an unpaid order has no invoice,
              and the route would answer 409, which a plain form post would show as
              a bare error page. */}
          {(state.order.payment_status === "paid" ||
            state.order.payment_status === "refunded") && (
            <form
              method="POST"
              action={`/api/invoices/${encodeURIComponent(state.order.order_number)}`}
            >
              {/* Posted rather than put in the URL so the address stays out of
                  browser history and server access logs. */}
              <input type="hidden" name="email" value={email} />
              <button
                type="submit"
                className="cursor-pointer inline-block border border-neutral-200 px-4 py-2 font-heading text-[13px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-brown hover:text-brown"
              >
                Download Invoice
              </button>
            </form>
          )}

          <p className="font-body text-sm text-neutral-300">
            Have an account?{" "}
            <Link href="/login" className="text-brown underline underline-offset-4">
              Sign in
            </Link>{" "}
            to see all your orders in one place.
          </p>
        </div>
      )}
    </div>
  );
}
