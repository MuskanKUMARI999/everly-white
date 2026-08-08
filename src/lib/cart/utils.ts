import { cookies } from "next/headers";

const GUEST_COOKIE = "ew_guest_id";

export async function getGuestId() {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

export async function setGuestId(guestId: string) {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function getOrCreateGuestId() {
  const existing = await getGuestId();
  if (existing) return existing;
  const guestId = crypto.randomUUID();
  await setGuestId(guestId);
  return guestId;
}
