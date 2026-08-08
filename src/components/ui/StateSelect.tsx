"use client";

import { GST_STATES } from "@/lib/invoices/gstStates";

/**
 * State picker for delivery addresses.
 *
 * This was a free-text box, which put GST correctness at the mercy of typing.
 * The delivery state decides whether a sale is taxed as CGST + SGST (buyer in
 * Assam, where the shop is registered) or IGST (everywhere else) — so
 * "Bengaluru", "KA" or a slip like "Karnatka" left the invoice unable to tell
 * which, and the code will not guess. Choosing from a fixed list removes the
 * whole class of problem at the point of entry rather than trying to recover
 * from it later.
 *
 * Works controlled (pass `value` + `onChange`) or uncontrolled (pass
 * `defaultValue`), because the checkout form holds its fields in React state
 * while the address book uses plain form defaults.
 */

// "Other Territory" (code 97) is a real GST place of supply but not somewhere a
// parcel goes; listing it in a delivery form would only invite mis-selection.
// resolveGstState still understands it if it turns up in existing data.
const OPTIONS = GST_STATES.filter((s) => s.code !== "97");

export function StateSelect({
  name = "state",
  value,
  defaultValue,
  onChange,
  required,
  className = "",
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
}) {
  const current = value ?? defaultValue ?? "";
  const isKnown = OPTIONS.some((s) => s.name === current);

  // React warns if both are supplied, so pick exactly one mode.
  const binding =
    value !== undefined
      ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value) }
      : {
          defaultValue,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
        };

  return (
    <select
      name={name}
      aria-label="State"
      // Keeps the browser's saved-address autofill working, as the text input did.
      autoComplete="address-level1"
      required={required}
      className={className}
      {...binding}
    >
      <option value="">State</option>

      {/* An address saved before this list existed keeps whatever it held, so
          editing an unrelated field cannot silently rewrite someone's address. */}
      {current !== "" && !isKnown && <option value={current}>{current}</option>}

      {OPTIONS.map((state) => (
        <option key={state.code} value={state.name}>
          {state.name}
        </option>
      ))}
    </select>
  );
}
