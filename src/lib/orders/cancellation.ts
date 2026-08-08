import type { Tables } from "@/lib/supabase/database.types";

// How long after placing an order a customer may still cancel it themselves. After this, they must
// contact support. Kept here as the single source of truth for both the UI (button + message) and
// the server action (authoritative re-check).
export const CANCEL_WINDOW_HOURS = 4;

type CancellableOrder = Pick<Tables<"orders">, "status" | "created_at">;

export type CancellationReason = "ok" | "shipped" | "terminal" | "expired";

export interface CancellationInfo {
  cancellable: boolean;
  /** created_at + the cancellation window. */
  deadline: Date;
  reason: CancellationReason;
}

export function getCancellationInfo(
  order: CancellableOrder,
  now: Date = new Date(),
): CancellationInfo {
  const created = new Date(order.created_at);
  const deadline = new Date(created.getTime() + CANCEL_WINDOW_HOURS * 60 * 60 * 1000);

  const terminal = order.status === "cancelled" || order.status === "refunded";
  const shipped = order.status === "shipped" || order.status === "delivered";
  const withinWindow = now.getTime() <= deadline.getTime();

  if (terminal) return { cancellable: false, deadline, reason: "terminal" };
  if (shipped) return { cancellable: false, deadline, reason: "shipped" };
  if (!withinWindow) return { cancellable: false, deadline, reason: "expired" };
  return { cancellable: true, deadline, reason: "ok" };
}
