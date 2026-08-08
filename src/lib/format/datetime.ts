// Dates are shown in India Standard Time everywhere, always — never in the server's timezone.
//
// Every timestamp is stored in UTC (correct), but `toLocaleDateString("en-IN", …)` only sets the
// *format* — day-before-month — and takes its timezone from whatever the runtime happens to be. A
// dev machine set to Asia/Calcutta therefore renders correct dates while a cloud host running UTC
// renders different ones from the same data, with nothing to indicate it.
//
// India is UTC+5:30, so anything placed between 00:00 and 05:29 IST falls on the previous UTC day.
// Left alone, an order placed at 01:45 IST on the 28th would display as the 27th in production.
// Pinning the zone here makes local and deployed output identical.
//
// No "server-only": client components format dates too.

export const SITE_TIME_ZONE = "Asia/Kolkata";

type DateInput = string | number | Date;

/** A real instant (a stored timestamp), rendered as a date in IST. */
export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
) {
  return new Date(value).toLocaleDateString("en-IN", {
    ...options,
    timeZone: SITE_TIME_ZONE,
  });
}

/** A real instant rendered with both date and time, in IST. */
export function formatDateTime(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
) {
  return new Date(value).toLocaleString("en-IN", {
    ...options,
    timeZone: SITE_TIME_ZONE,
  });
}

/**
 * A bare calendar day ("2026-07-28"), as produced by the sales-chart query.
 *
 * These carry no time, and `new Date("2026-07-28")` parses as UTC midnight — so this pins UTC
 * rather than IST. Converting a midnight-UTC instant into another zone is exactly the shift this
 * module exists to prevent; the string already *is* the intended day.
 */
export function formatDayKey(
  key: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) {
  return new Date(`${key}T00:00:00Z`).toLocaleDateString("en-IN", {
    ...options,
    timeZone: "UTC",
  });
}

/**
 * The IST calendar day an instant falls on, as "YYYY-MM-DD".
 *
 * Used for grouping orders into daily buckets. `en-CA` is the shortest route to ISO-ordered output
 * from Intl, and the zone is what actually does the work.
 */
export function istDayKey(value: DateInput) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
