import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminPassword, safeCompare } from "@/lib/auth/adminPassword";
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  getAdminCookieOptions,
} from "@/lib/auth/adminSession";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`admin-login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check configured admin credentials (from .env.local)
    const envAdminEmail = process.env.ADMIN_EMAIL?.trim();
    const envAdminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!envAdminEmail) {
      console.error("[Admin Auth Login Error]: ADMIN_EMAIL environment variable is not configured.");
      return NextResponse.json(
        { success: false, error: "Admin authentication is not configured." },
        { status: 500 }
      );
    }

    const configuredAdminEmail = envAdminEmail.toLowerCase();
    const configuredAdminPassword = envAdminPassword;

    let isAuthenticated = false;

    if (safeCompare(cleanEmail, configuredAdminEmail)) {
      // Check if a custom password hash exists in site_settings
      try {
        let credSetting = null;

        // Query site_settings with server client (publishable key)
        try {
          const supabase = await createClient();
          const { data } = await (supabase as any)
            .from("site_settings")
            .select("value")
            .eq("key", "admin_custom_credentials")
            .maybeSingle();
          credSetting = data;
        } catch (clientErr) {
          console.warn("[Admin login site_settings server check]:", clientErr);
        }

        // Fallback to admin client if needed
        if (!credSetting) {
          try {
            const supabaseAdmin = createAdminClient() as any;
            const { data } = await supabaseAdmin
              .from("site_settings")
              .select("value")
              .eq("key", "admin_custom_credentials")
              .maybeSingle();
            credSetting = data;
          } catch (adminClientErr) {
            console.warn("[Admin login site_settings admin check]:", adminClientErr);
          }
        }

        if (credSetting?.value?.hash && credSetting?.value?.salt) {
          if (verifyAdminPassword(cleanPassword, credSetting.value.salt, credSetting.value.hash)) {
            isAuthenticated = true;
          }
        } else if (configuredAdminPassword && safeCompare(cleanPassword, configuredAdminPassword)) {
          isAuthenticated = true;
        }
      } catch (dbErr) {
        console.warn("[Admin login site_settings check]:", dbErr);
        if (configuredAdminPassword && safeCompare(cleanPassword, configuredAdminPassword)) {
          isAuthenticated = true;
        }
      }
    }

    // 2. Also check Supabase Auth if credentials didn't match yet
    if (!isAuthenticated) {
      try {
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!authError && authData?.user) {
          if (safeCompare(cleanEmail, configuredAdminEmail)) {
            isAuthenticated = true;
          } else {
            // Verify admin role in profiles table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile } = await (supabase as any)
              .from("profiles")
              .select("role")
              .eq("id", authData.user.id)
              .maybeSingle();

            if (profile?.role === "admin" || profile?.role === "super_admin") {
              isAuthenticated = true;
            }
          }
        }
      } catch {
        // Fallback to primary check
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Invalid admin email or password." },
        { status: 401 }
      );
    }

    // Set cryptographically signed secure admin session cookie
    const sessionToken = createAdminSessionToken(cleanEmail, "admin");
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, getAdminCookieOptions());

    return response;
  } catch (error) {
    console.error("[Admin Auth Login Error]:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during authentication." },
      { status: 500 }
    );
  }
}
