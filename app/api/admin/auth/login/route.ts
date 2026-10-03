import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminPassword, safeCompare } from "@/lib/auth/adminPassword";
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  getAdminCookieOptions,
} from "@/lib/auth/adminSession";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Check configured admin credentials (from .env.local or defaults)
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "admin@aurelle.ae").toLowerCase().trim();
    const configuredAdminPassword = (process.env.ADMIN_PASSWORD || "admin123").trim();

    let isAuthenticated = false;

    if (safeCompare(cleanEmail, configuredAdminEmail)) {
      // Check if a custom password hash exists in site_settings
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabaseAdmin = createAdminClient() as any;
        const { data: credSetting } = await supabaseAdmin
          .from("site_settings")
          .select("value")
          .eq("key", "admin_custom_credentials")
          .maybeSingle();

        if (credSetting?.value?.hash && credSetting?.value?.salt) {
          if (verifyAdminPassword(cleanPassword, credSetting.value.salt, credSetting.value.hash)) {
            isAuthenticated = true;
          }
        } else if (safeCompare(cleanPassword, configuredAdminPassword)) {
          isAuthenticated = true;
        }
      } catch (dbErr) {
        console.warn("[Admin login site_settings check]:", dbErr);
        if (safeCompare(cleanPassword, configuredAdminPassword)) {
          isAuthenticated = true;
        }
      }
    }

    // 2. Also check Supabase Auth if credentials didn't match env default
    if (!isAuthenticated) {
      try {
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (!authError && authData.user) {
          // Verify admin role in profiles table
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profile } = await (supabase as any)
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

          if (profile?.role === "admin" || profile?.role === "super_admin") {
            isAuthenticated = true;
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
