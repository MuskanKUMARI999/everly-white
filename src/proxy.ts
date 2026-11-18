import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeRedirectPath } from "@/lib/auth/safeRedirect";
import { siteUrl } from "@/lib/site";

// Next 16 deprecated the `middleware` file convention and renamed it to `proxy` (same API, but it
// now defaults to the Node.js runtime instead of Edge). This file must sit beside `app/` — i.e.
// under src/, not the project root — or it is never loaded.
//
// Calling supabase.auth.getUser() here does double duty: it refreshes the session and writes the
// rotated auth cookies onto the response, which is what the Supabase SSR protocol requires on every
// request. That is why there is no separate updateSession() helper any more.

const protectedRoutes = ["/account", "/orders"];
const authRoutes = ["/login", "/signup", "/forgot-password"];

function isProtected(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname.startsWith(route));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (isProtected(pathname) && !user) {
    // Carry the page they were actually trying to reach, so signing in resumes it instead of
    // dumping them on the homepage. Query string included — /account/orders?x=1 must survive too.
    const loginUrl = new URL("/login", siteUrl());
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && user) {
    // Already signed in: honour ?next= if one is present (they followed a protected link and the
    // session was still valid), but never bounce back to another auth route — that would loop.
    const requested = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/account");
    const destination = isAuthRoute(new URL(requested, request.url).pathname)
      ? "/account"
      : requested;
    // Public origin, not request.url — behind the host's proxy that is https://0.0.0.0:3000.
    return NextResponse.redirect(new URL(destination, siteUrl()));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
