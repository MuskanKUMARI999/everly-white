import { Fragment } from "react";
import { formatPrice } from "@/components/sections/productFormat";
import { formatDate as formatIstDate } from "@/lib/format/datetime";
import type { OrderWithItems } from "@/lib/data/orders";

function formatDate(date: string) {
  return formatIstDate(date, { day: "numeric", month: "long", year: "numeric" });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Linear fulfilment steps shown as a progress timeline. "processing" shares the
// "Confirmed" stage (order accepted, being prepared, not yet shipped).
const TIMELINE_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

const STATUS_STEP_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_STEP_INDEX[status] ?? 0;

  return (
    <div className="mt-5 flex items-start">
      {TIMELINE_STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const isLast = i === TIMELINE_STEPS.length - 1;
        return (
          <Fragment key={step.key}>
            <div className="flex w-16 shrink-0 flex-col items-center text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border font-heading text-[11px] ${
                  reached
                    ? "border-brown bg-brown text-beige-light"
                    : "border-neutral-200 bg-white text-neutral-300"
                }`}
              >
                {reached ? "✓" : i + 1}
              </span>
              <span
                className={`mt-1.5 font-heading text-[9px] uppercase tracking-widest ${
                  reached ? "text-brown" : "text-neutral-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`mt-3.5 h-px flex-1 ${i < currentIndex ? "bg-brown" : "bg-neutral-200"}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// Presentational order summary shared by the account order history and the public order tracker.
// Pure (no client hooks / server-only APIs) so it renders in either a server or client tree.
export function OrderCard({ order }: { order: OrderWithItems }) {
  const isTerminated = order.status === "cancelled" || order.status === "refunded";
  const hasTracking = Boolean(order.courier || order.tracking_number);

  return (
    <div className="border border-neutral-100 bg-pink-100/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-4">
        <div>
          <p className="font-heading text-[11px] uppercase tracking-widest text-neutral-400">
            Order #{order.order_number}
          </p>
          <p className="mt-1 font-body text-sm text-neutral-300">{formatDate(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-[11px] uppercase tracking-widest text-brown">
            {capitalize(order.status)}
          </p>
          <p className="mt-1 font-heading text-lg text-neutral-500">{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Fulfilment progress */}
      {isTerminated ? (
        <p className="mt-4 font-body text-sm italic text-neutral-400">
          {order.status === "cancelled"
            ? "This order was cancelled."
            : "This order was refunded."}
        </p>
      ) : (
        <OrderTimeline status={order.status} />
      )}

      {/* Tracking details (once shipped) */}
      {hasTracking && !isTerminated && (
        <div className="mt-5 border border-neutral-100 bg-white/60 px-4 py-3">
          <p className="font-heading text-[10px] uppercase tracking-widest text-neutral-400">
            Shipment
          </p>
          <p className="mt-1 font-body text-sm text-neutral-500">
            {order.courier && (
              <>
                Shipped via <span className="font-medium">{order.courier}</span>
              </>
            )}
            {order.courier && order.tracking_number ? " — " : ""}
            {order.tracking_number && (
              <>
                Tracking No.{" "}
                <span className="font-medium tracking-wide">{order.tracking_number}</span>
              </>
            )}
          </p>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {order.order_items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between font-body text-sm text-neutral-400"
          >
            <span>
              {item.product_name} × {item.quantity}
            </span>
            <span>{formatPrice(item.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
