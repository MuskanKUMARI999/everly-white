import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { User } from "@supabase/supabase-js";

/**
 * Attaches a guest's past orders to their account.
 *
 * Someone who checked out without signing in has their order stored against an
 * email address and no user id. Order history is queried by user id, so those
 * orders stay invisible after they create an account — and because the invoice
 * download authorises on ownership, they cannot get their tax invoice either.
 * This closes that gap on sign-in.
 *
 * WHY MATCHING ON EMAIL IS SAFE HERE
 *
 * The address is only trusted because Supabase is configured with email
 * confirmation on (`mailer_autoconfirm: false`), so an account cannot reach a
 * signed-in state without someone having opened a link sent to that mailbox.
 * The check below is belt and braces on top of that: if confirmation is ever
 * switched off, this stops claiming rather than quietly handing one person's
 * orders — name, address, phone and purchase history — to whoever typed their
 * address into the signup form.
 *
 * Runs on every sign-in rather than once. It is idempotent (only rows with no
 * owner are touched), and it also covers the case where an existing customer
 * checks out while signed out and only signs in later.
 *
 * Never throws: a failure here must not stop someone logging in. Callers log.
 */
export async function claimGuestOrders(user: User): Promise<number> {
  const email = user.email?.trim().toLowerCase();
  if (!email) return 0;

  // Supabase sets this once the address has been verified. No timestamp means
  // the address is unproven, and an unproven address must not claim anything.
  if (!user.email_confirmed_at) {
    console.warn(`Not claiming guest orders for ${user.id}: email is not confirmed.`);
    return 0;
  }

  const supabase = createServiceClient();

  // Conditional on user_id IS NULL, so an order already belonging to somebody
  // can never be reassigned — including by a second account that happens to
  // share the address later.
  const { data, error } = await supabase
    .from("orders")
    .update({ user_id: user.id })
    .eq("guest_email", email)
    .is("user_id", null)
    .select("id");

  if (error) {
    console.error(`Failed to claim guest orders for ${user.id}:`, error.message);
    return 0;
  }

  return data?.length ?? 0;
}
