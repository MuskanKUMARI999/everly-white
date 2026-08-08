"use client";

import { useActionState } from "react";
import Link from "next/link";
import { cancelOrder } from "@/lib/orders/actions";
import { getCancellationInfo, CANCEL_WINDOW_HOURS } from "@/lib/orders/cancellation";
import { formatDateTime } from "@/lib/format/datetime";
import type { Tables } from "@/lib/supabase/database.types";

type CancelControlOrder = Pick<Tables<"orders">, "id" | "status" | "created_at">;

export function CancelOrderControl({ order }: { order: CancelControlOrder }) {
  const [state, action, isPending] = useActionState(cancelOrder, null);
  const info = getCancellationInfo(order);

  // After a successful cancel the page revalidates and re-renders this order as cancelled; show a
  // brief confirmation until that swap lands.
  if (state?.success) {
    return <p className="mt-3 font-body text-sm text-brown">{state.message}</p>;
  }

  // Nothing to offer once an order has shipped or is already in a terminal state.
  if (info.reason === "shipped" || info.reason === "terminal") return null;

  if (info.reason === "expired") {
    return (
      <p className="mt-3 font-body text-xs text-neutral-300">
        The {CANCEL_WINDOW_HOURS}-hour cancellation window for this order has passed. For any issues,{" "}
        <Link href="/contact" className="text-brown underline underline-offset-2 hover:text-neutral-500">
          contact us
        </Link>
        .
      </p>
    );
  }

  const deadlineLabel = formatDateTime(info.deadline, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Cancel this order? If it was paid, your refund will be initiated automatically.",
          )
        ) {
          e.preventDefault();
        }
      }}
      className="mt-4 flex flex-col gap-2 border-t border-neutral-100 pt-4"
    >
      <input type="hidden" name="orderId" value={order.id} />
      <p className="font-body text-xs text-neutral-400">
        Ordered by mistake? You can cancel this order until{" "}
        <span className="font-medium text-neutral-500">{deadlineLabel}</span> — {CANCEL_WINDOW_HOURS}{" "}
        hours after placing it. After that it can no longer be cancelled.
      </p>
      {state?.success === false && (
        <p className="font-body text-xs text-terracotta">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer disabled:cursor-not-allowed w-fit border border-neutral-300 px-4 py-2 font-heading text-[11px] uppercase tracking-widest text-neutral-500 transition-colors hover:border-terracotta hover:text-terracotta disabled:opacity-50"
      >
        {isPending ? "Cancelling…" : "Cancel Order"}
      </button>
    </form>
  );
}
