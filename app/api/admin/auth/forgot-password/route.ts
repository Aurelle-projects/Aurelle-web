import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateOtp,
  createOtpToken,
  verifyOtpToken,
  createResetToken,
  verifyResetToken,
  sendOtpEmail,
} from "@/lib/auth/otp";
import { hashAdminPassword, safeCompare } from "@/lib/auth/adminPassword";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "send-otp";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ success: false, error: "Email address is required." }, { status: 400 });
    }

    const envAdminEmail = process.env.ADMIN_EMAIL?.trim();

    if (!envAdminEmail) {
      console.error("[Admin Forgot Password Error]: ADMIN_EMAIL environment variable is not configured.");
      return NextResponse.json(
        { success: false, error: "Admin authentication is not configured." },
        { status: 500 }
      );
    }

    const configuredAdminEmail = envAdminEmail.toLowerCase();

    // Verify the email matches the configured admin email
    if (!safeCompare(email, configuredAdminEmail)) {
      return NextResponse.json(
        { success: false, error: "This email address is not recognized as an administrator." },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 1: SEND OTP
    // ─────────────────────────────────────────────────────────────
    if (action === "send-otp") {
      const ip = getClientIp(request);
      const rl = checkRateLimit(`admin-otp:${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
      if (!rl.success) {
        return NextResponse.json(
          { success: false, error: "Too many reset code requests. Please wait 15 minutes before requesting a new code." },
          { status: 429 }
        );
      }

      const otp = generateOtp();
      const otpToken = createOtpToken(email, otp);

      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        return NextResponse.json(
          { success: false, error: emailResult.error || "Failed to send verification code email." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your admin email.",
        otpToken,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: VERIFY OTP
    // ─────────────────────────────────────────────────────────────
    if (action === "verify-otp") {
      const { otp, otpToken } = body;

      if (!otp || typeof otp !== "string" || !otpToken) {
        return NextResponse.json(
          { success: false, error: "Please enter the 6-digit verification code." },
          { status: 400 }
        );
      }

      const isValid = verifyOtpToken(email, otp, otpToken);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired verification code. Please check and try again." },
          { status: 400 }
        );
      }

      const resetToken = createResetToken(email);

      return NextResponse.json({
        success: true,
        message: "Verification code confirmed.",
        resetToken,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: RESET PASSWORD
    // ─────────────────────────────────────────────────────────────
    if (action === "reset-password") {
      const { resetToken, newPassword } = body;

      if (!resetToken || !newPassword || typeof newPassword !== "string") {
        return NextResponse.json(
          { success: false, error: "New password is required." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const isTokenValid = verifyResetToken(email, resetToken);
      if (!isTokenValid) {
        return NextResponse.json(
          { success: false, error: "Reset session has expired. Please request a new verification code." },
          { status: 400 }
        );
      }

      // Hash and store the custom admin password
      const { salt, hash } = hashAdminPassword(newPassword);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabaseAdmin = createAdminClient() as any;

      const { error: saveError } = await supabaseAdmin.from("site_settings").upsert({
        key: "admin_custom_credentials",
        value: {
          salt,
          hash,
          updated_at: new Date().toISOString(),
        },
      });

      if (saveError) {
        console.error("[Admin Reset Password Error]:", saveError);
        return NextResponse.json(
          { success: false, error: "Failed to update admin password." },
          { status: 500 }
        );
      }

      // Also update in Supabase Auth if an admin user exists
      try {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = userList?.users?.find(
          (u: { email?: string }) => u.email?.toLowerCase() === email
        );
        if (adminUser?.id) {
          await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
            password: newPassword,
            email_confirm: true,
          });
        }
      } catch (authErr) {
        console.warn("[Admin Auth Sync Notice]:", authErr);
      }

      return NextResponse.json({
        success: true,
        message: "Admin password updated successfully. You can now log in with your new password.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[Admin Forgot Password Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request." },
      { status: 500 }
    );
  }
}
