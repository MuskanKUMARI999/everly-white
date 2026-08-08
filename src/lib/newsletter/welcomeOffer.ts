/**
 * The signup incentive, in one place.
 *
 * The welcome popup shows this code on screen and the welcome email repeats it, so they must not
 * drift apart — a subscriber promised 5% off who receives a different code in their inbox has a
 * broken checkout. The code itself is seeded in the database by migration 012.
 */
export const WELCOME_CODE = "WELCOME5";

/** Human-readable value of the offer, used in both the popup copy and the email. */
export const WELCOME_DISCOUNT_LABEL = "5% off";
