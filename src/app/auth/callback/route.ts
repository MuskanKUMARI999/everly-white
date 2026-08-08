import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";
import { getGuestId } from "@/lib/cart/utils";
import { mergeGuestCart } from "@/lib/cart/actions";
import { mergeGuestWishlist } from "@/lib/wishlist/actions";
import { claimGuestOrders } from "@/lib/orders/claim";

// Exchanges the `code` from a Supabase auth email link (password recovery, email confirmation)
// for a session, writing the session cookies onto the redirect response, then forwards to `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  // Only allow same-origin relative paths as the post-auth destination to prevent open redirects.
  const next = safeRedirectPath(searchParams.get("next"), "/");

  if (!code) {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
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
