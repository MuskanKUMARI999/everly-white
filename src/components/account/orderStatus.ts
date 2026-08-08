/**
 * Colour treatment for an order's status label in the account section.
 *
 * Keyed on the real `order_status` enum from the database (lowercase), not display text —
 * see `Database["public"]["Enums"]["order_status"]`.
 */
export function statusColorClass(status: string) {
  switch (status) {
    case "delivered":
      return "text-brown";
    case "shipped":
      return "text-terracotta";
    case "cancelled":
      return "text-neutral-300 line-through";
    default:
      // pending · confirmed · processing — in flight, nothing to call out yet.
      return "text-neutral-400";
  }
}

export function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
