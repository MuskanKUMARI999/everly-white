import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";
import { getGuestId } from "@/lib/cart/utils";
import { mergeGuestCart } from "@/lib/cart/actions";
import { mergeGuestWishlist } from "@/lib/wishlist/actions";
import { claimGuestOrders } from "@/lib/orders/claim";
import { siteUrl } from "@/lib/site";

// Exchanges the credential from a Supabase auth email link (email confirmation, password recovery)
// for a session, writing the session cookies onto the redirect response, then forwards to `next`.
//
// Two link shapes arrive here, because Supabase picks between them:
//   ?code=…                        the PKCE flow, used when the sign-up/reset began in this browser
//   ?token_hash=…&type=signup      the plain verification token, used by a customised email
//                                  template and when no PKCE flow state exists
// Both are handled, so a confirmation link works whichever one the project sends.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // Never redirect to request.nextUrl.origin: behind the host's reverse proxy that is the internal
  // bind address (https://0.0.0.0:3000), not the public domain the customer clicked from.
  const origin = siteUrl();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only allow same-origin relative paths as the post-auth destination to prevent open redirects.
  const next = safeRedirectPath(searchParams.get("next"), "/");

  // A dead recovery link belongs on "request a new one"; a dead confirmation link belongs on sign
  // in, where the account (already created) can be reached. Sending a new customer to the password
  // reset page told them nothing about what had gone wrong.
  const isRecovery = type === "recovery" || next.startsWith("/reset-password");
  const failure = isRecovery
    ? `${origin}/forgot-password?error=invalid_link`
    : `${origin}/login?error=invalid_link`;

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(failure);
  }

  const response = NextResponse.redirect(`${origin}${next}`);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type!, token_hash: tokenHash! });
  if (error) {
    return NextResponse.redirect(failure);
  }

  // This is where a NEW signup actually becomes signed in — they confirm by email
  // and land here, never passing through the sign-in action. Without these, a
  // person who filled a cart or saved a wishlist while browsing signed-out, then
  // registered, would find both empty on arrival: the merges only ran on sign-in.
  //
  // Every step is best-effort. The session has already been established, and
  // failing the redirect over a merge would leave someone stranded on an error
  // page holding a link they cannot use twice.
  if (data.user) {
    const guestId = await getGuestId();
    if (guestId) {
      await mergeGuestCart(guestId).catch((e) =>
        console.error("Failed to merge guest cart on email confirmation:", e),
      );
      await mergeGuestWishlist(guestId).catch((e) =>
        console.error("Failed to merge guest wishlist on email confirmation:", e),
      );
    }

    await claimGuestOrders(data.user).catch((e) =>
      console.error("Failed to claim guest orders on email confirmation:", e),
    );
  }

  return response;
}
