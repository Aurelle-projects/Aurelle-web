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

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || "send-otp";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // ─────────────────────────────────────────────────────────────
    // STEP 1: SEND OTP (Forgot Password Request)
    // ─────────────────────────────────────────────────────────────
    if (action === "send-otp") {
      // 1. Check whether the email exists in the database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id, email")
        .ilike("email", email)
        .maybeSingle();

      let userExists = !!profile;

      if (!userExists) {
        // Fallback check against auth.users
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const matched = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email
        );
        if (matched) {
          userExists = true;
        }
      }

      // If email does NOT exist in the database, return appropriate error message
      if (!userExists) {
        return NextResponse.json(
          { error: "No account found with this email address. Please check your email or sign up." },
          { status: 404 }
        );
      }

      // 2. If email exists, generate a 6-digit OTP and send via Brevo
      const otp = generateOtp();
      const otpToken = createOtpToken(email, otp);

      const emailResult = await sendOtpEmail(email, otp);
      if (!emailResult.success) {
        return NextResponse.json(
          { error: emailResult.error || "Failed to send verification code email." },
          { status: 502 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Verification code sent to your email.",
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
          { error: "Please enter the 6-digit verification code." },
          { status: 400 }
        );
      }

      const isValid = verifyOtpToken(email, otp, otpToken);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired verification code. Please check and try again." },
          { status: 400 }
        );
      }

      // Generate a short-lived token to authorise password reset
      const resetToken = createResetToken(email);

      return NextResponse.json({
        success: true,
        message: "Code verified successfully.",
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
          { error: "New password is required." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const isTokenValid = verifyResetToken(email, resetToken);
      if (!isTokenValid) {
        return NextResponse.json(
          { error: "Reset session has expired. Please request a new verification code." },
          { status: 400 }
        );
      }

      // Find user ID to update password
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabaseAdmin as any)
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      let targetUserId = profile?.id;

      if (!targetUserId) {
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const matched = userList?.users?.find(
          (u) => u.email?.toLowerCase() === email
        );
        targetUserId = matched?.id;
      }

      if (!targetUserId) {
        return NextResponse.json(
          { error: "User account could not be located." },
          { status: 404 }
        );
      }

      // Update the user's password directly in auth.users
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        {
          password: newPassword,
          email_confirm: true,
        }
      );

      if (updateError) {
        console.error("[ForgotPassword] updateUserById error:", updateError);
        return NextResponse.json(
          { error: updateError.message || "Failed to update password." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Password has been successfully reset. You can now log in with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
  } catch (error) {
    console.error("[ForgotPassword] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to process your request." },
      { status: 500 }
    );
  }
}
