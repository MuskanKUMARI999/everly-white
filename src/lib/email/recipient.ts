import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Resolve the email address to notify for an order.
 *
 * Guest orders carry the address directly; orders placed by a signed-in customer only store a
 * user_id, so the address has to come from the auth table. Requires a service-role client.
 */
export async function resolveOrderRecipient(
  supabase: SupabaseClient<Database>,
  order: { guest_email: string | null; user_id: string | null },
): Promise<string | null> {
  if (order.guest_email) return order.guest_email;
  if (!order.user_id) return null;

  const { data, error } = await supabase.auth.admin.getUserById(order.user_id);
  if (error) {
    console.error("Failed to resolve order recipient:", error);
    return null;
  }
  return data.user?.email ?? null;
}
