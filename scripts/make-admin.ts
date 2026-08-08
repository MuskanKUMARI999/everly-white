import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} (y/n) `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

async function findUserByEmail(email: string) {
  // supabase-js has no direct "get user by email" admin call, so list and match —
  // fine at this app's scale (mirrors the same lookup used by the admin Customers page).
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function main() {
  const [, , emailArg, modeArg] = process.argv;
  const remove = modeArg === "remove";

  if (!emailArg) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email> [remove]");
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();

  const action = remove ? "Remove admin access from" : "Grant admin access to";
  const ok = await confirm(`${action} ${email}?`);
  if (!ok) {
    console.log("Cancelled.");
    return;
  }

  // 1. Update the pre-authorization list. This works whether or not the person has an account yet:
  //    the signup trigger reads admin_emails, so pre-authorized emails become admin on sign-up.
  if (remove) {
    const { error } = await supabase.from("admin_emails").delete().eq("email", email);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("admin_emails").upsert({ email }, { onConflict: "email" });
    if (error) throw error;
  }

  // 2. If they already have an account, flip their existing profile now so it takes effect without
  //    waiting for them to sign up again.
  const user = await findUserByEmail(email);
  if (user) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: !remove })
      .eq("id", user.id);
    if (error) throw error;
  }

  if (remove) {
    console.log(
      `✅ ${email} removed from the admin list.` +
        (user ? " Their account's admin access is revoked (takes effect on next page load)." : ""),
    );
  } else {
    console.log(
      user
        ? `✅ ${email} is now an admin. Takes effect on their next page load.`
        : `✅ ${email} is pre-authorized as admin. They'll have access automatically the moment they sign up.`,
    );
  }
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
