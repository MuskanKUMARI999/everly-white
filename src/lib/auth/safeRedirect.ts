/**
 * Validates a post-auth destination that arrived from the URL.
 *
 * A `?next=` value is attacker-controllable — anyone can send a customer a link to
 * `/login?next=https://evil.example/pay`. Redirecting to it after a successful sign-in is a classic
 * open redirect: the victim sees a genuine everlywhite.com login, then lands on a copy of the site
 * with their trust already established. Only same-origin *relative* paths are ever accepted.
 *
 * Rejected: absolute URLs (`https://evil.com`), protocol-relative (`//evil.com`), and the backslash
 * variant (`/\evil.com`) that some browsers normalise to `//`.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value || !value.startsWith("/")) return fallback;

  const second = value[1];
  if (second === "/" || second === "\\") return fallback;

  return value;
}
