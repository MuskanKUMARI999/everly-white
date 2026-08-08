// Where the storefront's surrounding chrome gets stripped back, in one place.
//
// Header and Footer each carried their own copy of these route lists. That is exactly how the
// welcome popup ended up interrupting checkout: it was added later, nobody remembered there was a
// list to add it to, and there was no single place that said "these routes are distraction-free".

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

// Bag-to-purchase flow: no nav/footer distractions — just the logo and a way out.
const CHECKOUT_ROUTES = ["/cart", "/checkout"];

/** True on the auth screens, which fill the viewport exactly and render no footer below. */
export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.includes(pathname);
}

export function isCheckoutFlowRoute(pathname: string) {
  return CHECKOUT_ROUTES.includes(pathname);
}

/** Header collapses to a bare logo here, and Footer renders nothing at all. */
export function isMinimalChromeRoute(pathname: string) {
  return isAuthRoute(pathname) || isCheckoutFlowRoute(pathname);
}

/**
 * The admin panel. It is nested under the root layout (there is no route group separating it), so
 * without this it inherits the whole storefront: the "Free Shipping across India" announcement bar,
 * the mega-menu header with a cart icon, and the four-column marketing footer — all wrapped around
 * AdminShell's own sidebar.
 *
 * Distinct from isMinimalChromeRoute on purpose: that one leaves a centred logo behind, which is
 * right for checkout but wrong here, because AdminShell already provides its own header. Admin gets
 * no storefront chrome at all.
 */
export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * The welcome popup is a marketing interruption, so it is suppressed everywhere the customer is
 * mid-task rather than browsing:
 *  - the whole bag-to-purchase flow and the auth screens (same routes the chrome hides on),
 *  - /reset-password, which the chrome does still render on but where a modal over someone
 *    recovering their account is plainly wrong,
 *  - /admin, which is the shop owner's back office — staff should never be pitched a customer
 *    newsletter and a first-order discount code.
 */
export function shouldSuppressWelcomePopup(pathname: string) {
  return (
    isMinimalChromeRoute(pathname) || pathname === "/reset-password" || isAdminRoute(pathname)
  );
}
