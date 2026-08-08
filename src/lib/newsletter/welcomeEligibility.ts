import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Whether the welcome offer is still worth showing this visitor.
 *
 * The popup pitches WELCOME5 — a discount on a *first* order — plus a newsletter join. Showing it
 * to someone who has already done either reads as a mistake, but simply hiding it from every
 * signed-in customer would be wrong too: having an account is not the same as having bought
 * something. Plenty of people register, never order, and are exactly who the offer is for.
 *
 * So the test is engagement, not authentication: hide it once they have placed an order or joined
 * the list, and keep showing it otherwise.
 *
 * Guests always qualify — there is no identity to check them against.
 *
 * Uses the service client for two reasons: newsletter_subscribers is deliberately unreadable by
 * customers under RLS (so an RLS-respecting client would always report "not subscribed"), and both
 * lookups are HEAD counts that return no rows, only whether at least one match exists.
 */
export async function qualifiesForWelcomeOffer(
  userId: string | undefined,
  email: string | undefined,
): Promise<boolean> {
  if (!userId) return true;

  const supabase = createServiceClient();

  const [orders, subscription] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .limit(1),
    email
      ? supabase
          .from("newsletter_subscribers")
          .select("id", { count: "exact", head: true })
          .eq("email", email.trim().toLowerCase())
          .limit(1)
      : Promise.resolve({ count: 0, error: null }),
  ]);

  // On a query error, fall back to showing the popup: a missed suppression is a mildly redundant
  // offer, whereas failing closed would silently kill the offer for everyone if a query broke.
  const hasOrdered = (orders.count ?? 0) > 0;
  const hasSubscribed = (subscription.count ?? 0) > 0;

  return !hasOrdered && !hasSubscribed;
}
