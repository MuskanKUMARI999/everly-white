// How an admin edit form's blanks are read: "leave it empty and it stays as it is."
//
// Every edit form in the panel arrives pre-filled, so the only thing an empty box ever meant was
// "I did not type anything here" — yet the update actions wrote that emptiness straight to the
// row, which turned saving one corrected line into a quiet erasure of everything left untouched.
// Each update action now reads its fields through these helpers instead, so a blank field resolves
// to the value already stored and only a real entry changes anything.
//
// Three kinds of blank are deliberately left outside the rule, because there the emptiness is a
// choice rather than an omission:
//   - a dropdown, which offers "None" as an option and always posts the option that is selected;
//   - a checkbox, which is on or off and never blank;
//   - an image field whose Clear button was pressed — that posts `<name>__cleared` beside the
//     empty box, which is the difference between "remove this picture" and "I left it alone".
//
// Pure, and kept out of actions.ts for the same reason collectionMetadata.ts is: that file carries
// "use server" and may only export async functions, so nothing in it can be exercised directly.

/** Suffix of the companion field an image picker posts when its Clear button was pressed. */
export const CLEARED_SUFFIX = "__cleared";

/** The trimmed text of a submitted field, or null when it was absent or left blank. */
export function submittedText(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

/** True when the form explicitly asked for this field to be emptied. */
export function wasCleared(formData: FormData, name: string): boolean {
  return formData.get(`${name}${CLEARED_SUFFIX}`) === "1";
}

/**
 * An optional text column: the entry if there is one, null if the field was explicitly cleared,
 * and otherwise whatever is already on the row.
 */
export function keepText(formData: FormData, name: string, current: string | null): string | null {
  const value = submittedText(formData.get(name));
  if (value !== null) return value;
  return wasCleared(formData, name) ? null : current;
}

/**
 * A column that cannot be empty (a product's name, a banner's image). Blank keeps the stored
 * value, and there is no clearing it — an empty title is not a state the storefront can render.
 */
export function keepRequiredText(formData: FormData, name: string, current: string): string {
  return submittedText(formData.get(name)) ?? current;
}

/**
 * An optional number column. A value that is not a number at all is treated as no entry rather
 * than as null: the browser already refuses non-numeric input, so anything else reaching here is
 * a hand-made post, and keeping the stored figure is the safer reading of it.
 */
export function keepNumber(formData: FormData, name: string, current: number | null): number | null {
  const raw = submittedText(formData.get(name));
  if (raw === null) return wasCleared(formData, name) ? null : current;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : current;
}

/** A number column that cannot be empty — a position, a stock count, a price. */
export function keepRequiredNumber(formData: FormData, name: string, current: number): number {
  const raw = submittedText(formData.get(name));
  if (raw === null) return current;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : current;
}

/**
 * A dropdown, which posts the option that is selected — including the empty "None" one. Absent
 * from the submission (a partial form that does not render the field) still means "leave it".
 */
export function selectedOption(
  formData: FormData,
  name: string,
  current: string | null,
): string | null {
  const raw = formData.get(name);
  if (typeof raw !== "string") return current;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}
