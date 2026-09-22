// ============================================================
// AURELLE — NEXT.JS MIDDLEWARE
// Runs on every matched route.
// Responsibilities:
//   1. Refresh Supabase auth session cookies
//   2. Protect authenticated routes
//   3. Protect admin routes with role check
// ============================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

// Routes that require authentication
const PROTECTED_ROUTES = ["/account"];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

// Routes that require wholesale approval
const WHOLESALE_PORTAL_ROUTES = ["/wholesale/portal"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Refresh session — do not remove this
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ─── Redirect unauthenticated users from protected routes ─────────────────
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ─── Admin routes ──────────────────────────────────────────────────────────
  // Handled directly by AdminLayout which serves the dedicated AdminLoginPanel
  // when unauthenticated, so admins log in directly on /admin without customer redirect.

  // ─── Protect wholesale portal routes ──────────────────────────────────────
  const isWholesalePortal = WHOLESALE_PORTAL_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isWholesalePortal) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "wholesale_customer") {
      return NextResponse.redirect(new URL("/wholesale", request.url));
    }
  }

  // ─── Redirect authenticated users away from auth pages ────────────────────
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets (images, fonts, etc.)
     * - Stripe webhook (must receive raw body, handled by route)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
