"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveGstState } from "@/lib/invoices/gstStates";
import { SHIPPING_COUNTRY } from "@/lib/site";
import type { Tables } from "@/lib/supabase/database.types";

export type FormResult = {
  success: boolean;
  message: string;
};

export type Address = Tables<"addresses">;

export async function getAddressesByUser(userId?: string): Promise<Address[]> {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  const targetUserId = userId ?? user.user?.id;
  if (!targetUserId) return [];

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", targetUserId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching addresses:", error);
    return [];
  }

  return (data as Address[]) ?? [];
}

// "layout", not the default "page". Every caller below changes something rendered outside
// /account itself: addresses show on /account/address, and the profile name is drawn by the
// account layout's sidebar. A page-type revalidate reaches neither, so edits appeared to do
// nothing until a hard reload.
function revalidateAccount() {
  revalidatePath("/account", "layout");
}

async function unsetOtherDefaults(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, excludeId?: string) {
  const query = supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);

  if (excludeId) {
    query.neq("id", excludeId);
  }

  await query;
}

function validateAddress(formData: FormData): Omit<Tables<"addresses">, "id" | "user_id" | "created_at" | "updated_at"> | FormResult {
  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const line1 = (formData.get("line1") as string)?.trim();
  const line2 = (formData.get("line2") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim();
  const state = (formData.get("state") as string)?.trim();
  const pinCode = (formData.get("pinCode") as string)?.trim();
  // Fixed server-side, never read from the form. The shop is India-only by construction (free
  // shipping "across India", a 6-digit PIN rule, and GST invoices whose tax split is computed from
  // a table of the 36 Indian states — an unrecognised state fails the invoice rather than guessing).
  // The address form shows this as read-only; hardcoding it here means a forged POST can't smuggle
  // in a country the shop cannot ship, price or invoice.
  const country = SHIPPING_COUNTRY;
  const isDefault = formData.get("isDefault") === "true";

  if (!fullName || !phone || !line1 || !city || !state || !pinCode) {
    return { success: false, message: "Please fill in all required address fields." };
  }

  if (!/^\d{6}$/.test(pinCode)) {
    return { success: false, message: "Please enter a valid 6-digit PIN code." };
  }

  if (!/^[\d\s\-+()]{7,20}$/.test(phone)) {
    return { success: false, message: "Please enter a valid phone number." };
  }

  // The form offers a fixed list, but a saved address is copied onto an order at
  // checkout and from there onto a tax invoice, where the state decides the GST
  // split. Resolving it here rejects anything unrecognised and stores the
  // canonical spelling, so the invoice never has to interpret it.
  const resolvedState = resolveGstState(state);
  if (!resolvedState) {
    return { success: false, message: "Please choose a valid state." };
  }

  return {
    full_name: fullName,
    phone,
    line1,
    line2,
    city,
    state: resolvedState.name,
    pin_code: pinCode,
    country,
    is_default: isDefault,
  };
}

export async function addAddress(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: "You must be signed in to add an address." };
  }

  const validated = validateAddress(formData);
  if ("success" in validated) {
    return validated;
  }

  if (validated.is_default) {
    await unsetOtherDefaults(supabase, userId);
  }

  const { error } = await supabase.from("addresses").insert({
    ...validated,
    user_id: userId,
  });

  if (error) {
    console.error("Error adding address:", error);
    return { success: false, message: error.message };
  }

  revalidateAccount();
  return { success: true, message: "Address added successfully." };
}

export async function updateAddress(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: "You must be signed in to update an address." };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, message: "Address ID is missing." };
  }

  const validated = validateAddress(formData);
  if ("success" in validated) {
    return validated;
  }

  if (validated.is_default) {
    await unsetOtherDefaults(supabase, userId, id);
  }

  const { error } = await supabase
    .from("addresses")
    .update({ ...validated, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating address:", error);
    return { success: false, message: error.message };
  }

  revalidateAccount();
  return { success: true, message: "Address updated successfully." };
}

// Promoting one saved address straight from its card. Previously the only way to change the
// default was to open the edit form, tick the checkbox and re-submit the whole address.
export async function setDefaultAddress(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: "You must be signed in to change your default address." };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, message: "Address ID is missing." };
  }

  // Promote first, demote second. The other order would leave the account with no default at all
  // if the promotion then failed — and checkout preselects the default, so "no default" silently
  // changes which address an order ships to. Two defaults would merely look odd for one request.
  const { data: promoted, error } = await supabase
    .from("addresses")
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("Error setting default address:", error);
    return { success: false, message: error.message };
  }
  // No row matched: either it is not this user's address, or it has since been deleted.
  if (!promoted?.length) {
    return { success: false, message: "That address could not be found." };
  }

  await unsetOtherDefaults(supabase, userId, id);

  revalidateAccount();
  return { success: true, message: "Default address updated." };
}

export async function deleteAddress(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: "You must be signed in to delete an address." };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, message: "Address ID is missing." };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting address:", error);
    return { success: false, message: error.message };
  }

  // Deleting the default used to leave the account with none, and checkout preselects the default —
  // so the next order would quietly ship to whichever address happened to be oldest. Keep the
  // invariant instead: if any addresses remain, exactly one of them is the default.
  const { data: remaining } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (remaining?.length && !remaining.some((address) => address.is_default)) {
    await supabase
      .from("addresses")
      .update({ is_default: true })
      .eq("id", remaining[0].id)
      .eq("user_id", userId);
  }

  revalidateAccount();
  return { success: true, message: "Address deleted successfully." };
}

export async function updateProfile(
  prevState: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return { success: false, message: "You must be signed in to update your profile." };
  }

  const fullName = (formData.get("fullName") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!fullName) {
    return { success: false, message: "Full name is required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, message: error.message };
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  revalidateAccount();
  return { success: true, message: "Profile updated successfully." };
}
