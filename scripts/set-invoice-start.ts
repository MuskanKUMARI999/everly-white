import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

/**
 * Sets the number the invoice series starts from.
 *
 * WHY THIS IS A SCRIPT AND NOT A BUTTON IN THE ADMIN PANEL
 *
 * A GST invoice series has to run consecutively, with no duplicates and no
 * gaps. That is why the number is allocated by the database, in the same
 * transaction that writes the invoice — nothing in the running application can
 * choose its own. Moving the counter is a one-off setup action (typically
 * "our books already reach 41, so the website should start at 42"), not
 * something anyone should be able to do from a web page by accident.
 *
 * Same reasoning as scripts/make-admin.ts: consequential, rare, and better
 * behind terminal access than behind a click.
 *
 * Usage:
 *   npx tsx scripts/set-invoice-start.ts <next-number> [financial-year]
 *
 *   npx tsx scripts/set-invoice-start.ts 42            -> next invoice is 0042
 *   npx tsx scripts/set-invoice-start.ts 1 2027-28     -> next year starts at 0001
 */

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

/** Indian financial year: 1 April to 31 March, written "2026-27". */
function currentFinancialYear(): string {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

async function main() {
  const [, , nextArg, yearArg] = process.argv;

  if (!nextArg) {
    console.error("Usage: npx tsx scripts/set-invoice-start.ts <next-number> [financial-year]");
    console.error("Example: npx tsx scripts/set-invoice-start.ts 42");
    process.exit(1);
  }

  const nextNumber = Number(nextArg);
  if (!Number.isInteger(nextNumber) || nextNumber < 1) {
    console.error(`"${nextArg}" is not a whole number of 1 or more.`);
    process.exit(1);
  }

  const financialYear = yearArg?.trim() || currentFinancialYear();
  if (!/^\d{4}-\d{2}$/.test(financialYear)) {
    console.error(`"${financialYear}" is not a financial year. Expected a form like 2026-27.`);
    process.exit(1);
  }

  // The counter stores the LAST number used, so the next one is that plus one.
  const lastSerial = nextNumber - 1;

  // Refuse to move the counter backwards past invoices that already exist:
  // reusing a number would put two different sales under one invoice number,
  // which is the exact failure the series is meant to prevent.
  const { data: clashes, error: clashError } = await supabase
    .from("invoices")
    .select("invoice_number, serial")
    .eq("financial_year", financialYear)
    .gte("serial", nextNumber)
    .order("serial", { ascending: true });

  if (clashError) {
    console.error("Could not check existing invoices:", clashError.message);
    process.exit(1);
  }

  if (clashes && clashes.length > 0) {
    console.error(
      `Cannot start at ${nextNumber}: ${clashes.length} invoice(s) in ${financialYear} already use that number or higher.`,
    );
    console.error(`  first clash: ${clashes[0].invoice_number}`);
    console.error("Pick a number above the highest one already issued.");
    process.exit(1);
  }

  const { data: existing } = await supabase
    .from("invoice_counters")
    .select("last_serial")
    .eq("financial_year", financialYear)
    .maybeSingle();

  const { count: issued } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("financial_year", financialYear);

  console.log(`Financial year:        ${financialYear}`);
  console.log(`Invoices issued so far: ${issued ?? 0}`);
  console.log(`Counter is now at:      ${existing?.last_serial ?? 0}`);
  console.log(`Next invoice would be:  ${String(nextNumber).padStart(4, "0")}`);

  if (!(await confirm(`\nStart the ${financialYear} series at ${nextNumber}?`))) {
    console.log("Cancelled.");
    return;
  }

  const { error } = await supabase
    .from("invoice_counters")
    .upsert({ financial_year: financialYear, last_serial: lastSerial }, { onConflict: "financial_year" });

  if (error) {
    console.error("Failed:", error.message);
    process.exit(1);
  }

  console.log(
    `\n✅ The next invoice raised in ${financialYear} will be numbered ${String(nextNumber).padStart(4, "0")}.`,
  );
  console.log("   Numbering continues consecutively from there on its own.");
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
