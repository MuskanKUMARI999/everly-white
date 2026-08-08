"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getGuestId } from "@/lib/cart/utils";
import { mergeGuestCart } from "@/lib/cart/actions";
import { mergeGuestWishlist } from "@/lib/wishlist/actions";
import { claimGuestOrders } from "@/lib/orders/claim";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";

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

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    // The email link hits Supabase's verify endpoint, which redirects here with a `code`.
    // The callback route exchanges it for a session before landing on /reset-password.
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
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

  // Verified on a throwaway client rather than the request's own: signing in on `supabase` would
  // rewrite the session cookies as a side effect of what is meant to be a read-only check.
  // persistSession is off, so the token this issues lives only for the length of this call.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return { success: false, message: "Your current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, message: error.message };
  }

  // No revalidate: a password isn't rendered anywhere, so there's no stale UI to refresh.
  return { success: true, message: "Your password has been updated." };
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
