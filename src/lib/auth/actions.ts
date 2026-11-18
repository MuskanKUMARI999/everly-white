"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getGuestId } from "@/lib/cart/utils";
import { mergeGuestCart } from "@/lib/cart/actions";
import { mergeGuestWishlist } from "@/lib/wishlist/actions";
import { claimGuestOrders } from "@/lib/orders/claim";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";
import { siteUrl } from "@/lib/site";
import {
  isValidPhoneDigits,
  onlyDigits,
  parseStoredPhone,
  phoneDigitsHint,
} from "@/components/ui/countryCodes";

export interface AuthResult {
  success: boolean;
  message: string;
}

export async function signUp(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const fullName = formData.get("fullName") as string;
  const phone = (formData.get("phone") as string)?.trim() ?? "";
  const agreed = formData.get("agreed") === "true";

  if (!email?.trim() || !password || !fullName?.trim()) {
    return { success: false, message: "Please fill in all fields." };
  }
  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords don't match." };
  }
  if (!agreed) {
    return { success: false, message: "Please agree to the Terms & Conditions to continue." };
  }

  // Re-checked here, not just in the form: the client gate is a convenience, and this action is a
  // public endpoint that anything can POST to. phoneCountry/phoneNational are what the form sends;
  // falling back to parsing the combined value keeps the action usable on its own.
  if (phone) {
    const parsed = parseStoredPhone(phone);
    const iso = (formData.get("phoneCountry") as string) || parsed.iso;
    const national = onlyDigits((formData.get("phoneNational") as string) || parsed.national);

    if (!isValidPhoneDigits(iso, national)) {
      return {
        success: false,
        message: `Please enter a valid phone number (${phoneDigitsHint(iso)}).`,
      };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      // Without this, Supabase points the confirmation email at the project's default Site URL —
      // the bare homepage — which drops the `?code=` on a page that has no idea what to do with it.
      // The account was confirmed but no session cookie was ever written, so the customer landed
      // back on the site still signed out, being told to sign in all over again. Routing the link
      // through the callback exchanges the code for a session first, so the click alone signs them
      // in and drops them on the homepage. This URL must be in the Supabase dashboard's Redirect
      // URLs allow-list, or Supabase silently falls back to the Site URL and the bug returns.
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/`,
      // phone is carried on the auth user's metadata; the handle_new_user trigger copies both
      // into profiles when the row is created (see 021_signup_phone.sql).
      data: { full_name: fullName.trim(), phone: phone || null },
    },
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (data.user?.identities?.length === 0) {
    return {
      success: false,
      message: "An account with this email already exists. Please sign in.",
    };
  }

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Account created. Please check your email to confirm your account.",
  };
}

export async function signIn(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email?.trim() || !password) {
    return { success: false, message: "Please enter your email and password." };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  const guestId = await getGuestId();
  if (guestId) {
    await mergeGuestCart(guestId).catch((mergeError) => {
      console.error("Failed to merge guest cart on sign-in:", mergeError);
    });
    await mergeGuestWishlist(guestId).catch((mergeError) => {
      console.error("Failed to merge guest wishlist on sign-in:", mergeError);
    });
  }

  // Orders placed before this account existed are matched by confirmed email and
  // attached now, so past purchases (and their tax invoices) appear in the
  // account rather than being stranded on a guest checkout.
  if (signInData.user) {
    await claimGuestOrders(signInData.user).catch((claimError) => {
      console.error("Failed to claim guest orders on sign-in:", claimError);
    });
  }

  revalidatePath("/", "layout");
  // Resume whatever they were trying to reach before being asked to sign in. Validated here rather
  // than trusted from the form — the hidden field is just as attacker-controllable as the URL.
  redirect(safeRedirectPath(formData.get("next") as string | null, "/"));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function resetPassword(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  if (!email?.trim()) {
    return { success: false, message: "Please enter your email address." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    // The email link hits Supabase's verify endpoint, which redirects here with a `code`.
    // The callback route exchanges it for a session before landing on /reset-password.
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "If an account exists, a password reset link has been sent.",
  };
}

export async function updatePassword(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  // The recovery link established a session via /auth/callback; without it there's no user to
  // update, so a stale/expired link lands here with no session and we refuse rather than error out.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: "Your reset link is invalid or has expired. Please request a new one.",
    };
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password) {
    return { success: false, message: "Please enter a new password." };
  }
  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords don't match." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Your password has been updated. You can now sign in." };
}

// Distinct from updatePassword above: that one serves the emailed recovery link, where possession
// of the link is the proof of identity. This one runs inside the account, where the signed-in
// session is the only thing standing between a borrowed laptop and a full account takeover — so it
// insists on the current password as well.
export async function changePassword(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, message: "You must be signed in to change your password." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!currentPassword || !password || !confirmPassword) {
    return { success: false, message: "Please fill in all three password fields." };
  }
  if (password.length < 8) {
    return { success: false, message: "Your new password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Your new passwords don't match." };
  }
  if (password === currentPassword) {
    return { success: false, message: "Your new password must be different from your current one." };
  }

  if (!(await isCurrentPassword(user.email, currentPassword))) {
    return { success: false, message: "Your current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, message: error.message };
  }

  // No revalidate: a password isn't rendered anywhere, so there's no stale UI to refresh.
  return { success: true, message: "Your password has been updated." };
}

// Verified on a throwaway client rather than the request's own: signing in on the request client
// would rewrite the session cookies as a side effect of what is meant to be a read-only check.
// persistSession is off, so the token this issues lives only for the length of this call.
async function isCurrentPassword(email: string, password: string): Promise<boolean> {
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await verifier.auth.signInWithPassword({ email, password });
  return !error;
}

// Orders the shop still has to act on. Deleting the account mid-delivery would leave the customer
// unable to track or cancel it from their account. Pending is not included: an unpaid checkout
// that was abandoned stays pending forever and must not block anyone.
const IN_PROGRESS_ORDER_STATUSES = ["confirmed", "processing", "shipped"] as const;

// Permanent: the auth user is deleted, which cascades the profile, addresses, cart and wishlist
// (see the foreign keys in 001 and 028). Orders and reviews are kept with user_id cleared, because
// they are the shop's sales and tax records. The same email can then sign up again and gets a
// fresh, empty account — see migration 043 for why its old orders stay detached.
export async function deleteAccount(
  prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { success: false, message: "You must be signed in to delete your account." };
  }

  const password = formData.get("password") as string;
  const confirmation = ((formData.get("confirmation") as string) ?? "").trim();

  if (confirmation !== "DELETE") {
    return { success: false, message: "Please type DELETE to confirm." };
  }
  if (!password) {
    return { success: false, message: "Please enter your password." };
  }
  // Same reasoning as changePassword: a signed-in session on a borrowed laptop must not be enough
  // to wipe someone's account.
  if (!(await isCurrentPassword(user.email, password))) {
    return { success: false, message: "Your password is incorrect." };
  }

  const service = createServiceClient();

  const { data: profile } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin) {
    return {
      success: false,
      message: "Admin accounts can't be deleted from here. Remove admin access first.",
    };
  }

  const { count: activeOrders, error: ordersError } = await service
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", IN_PROGRESS_ORDER_STATUSES);
  if (ordersError) {
    console.error("Failed to check orders before account deletion:", ordersError);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (activeOrders) {
    return {
      success: false,
      message:
        "You have an order that is still on its way. You can delete your account once it has been delivered, or contact us for help.",
    };
  }

  // Keep the address on the orders (admin, tax invoices, order tracking) in a column that
  // claimGuestOrders never reads, and take it out of guest_email so a new account with this email
  // does not pick these orders back up.
  const { error: detachError } = await service
    .from("orders")
    .update({ former_account_email: user.email.trim().toLowerCase(), guest_email: null })
    .eq("user_id", user.id);
  if (detachError) {
    console.error("Failed to detach orders before account deletion:", detachError);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error(`Failed to delete account ${user.id}:`, deleteError);
    return { success: false, message: "Your account could not be deleted. Please try again." };
  }

  // The user no longer exists, so only clear this browser's session cookies; a global sign-out
  // would just fail against a deleted user.
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}
