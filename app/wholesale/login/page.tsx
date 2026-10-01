"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function WholesaleLoginContent() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams
    ? searchParams.get("redirect") || searchParams.get("next")
    : null;

  const target =
    redirectParam &&
    redirectParam.startsWith("/") &&
    !redirectParam.startsWith("//") &&
    redirectParam.startsWith("/wholesale")
      ? redirectParam
      : "/wholesale";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Forgot password sub-state
  const [forgotMode, setForgotMode] = useState<"none" | "email" | "otp" | "reset">("none");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPendingMessage(null);

    const supabase = createClient();

    try {
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError) {
        throw new Error("Invalid credentials.");
      }

      if (!authData?.user) {
        throw new Error("Invalid credentials.");
      }

      // Query role from profiles table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

      // Check wholesale pending status
      if (profile?.role === "wholesale_pending") {
        await supabase.auth.signOut();
        setPendingMessage(
          "Your wholesale application is currently pending admin review. You will receive an email confirmation as soon as your commercial account is approved."
        );
        return;
      }

      // Strictly enforce wholesale_customer role
      if (profile?.role !== "wholesale_customer") {
        await supabase.auth.signOut();
        throw new Error("Invalid credentials.");
      }

      // Success
      window.location.assign(target);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send reset code.");
      }
      setOtpToken(data.otpToken);
      setForgotMode("otp");
      setForgotMessage(`Verification code sent to ${email.trim()}`);
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: email.trim().toLowerCase(),
          otpToken,
          otp: otp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }
      setResetToken(data.resetToken);
      setForgotMode("reset");
      setForgotMessage("Code verified. Please set your new password.");
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password Step 3: Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: email.trim().toLowerCase(),
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setForgotMode("none");
      setPassword("");
      setForgotMessage("Password reset successfully! Please sign in with your new password.");
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/wholesale" className="inline-block hover:opacity-90 transition-opacity">
            <Image
              src="/Aurelle-Logo.png"
              alt="Aurelle B2B Wholesale Portal"
              width={180}
              height={54}
              priority
              className="h-11 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Portal Badge */}
        <div className="flex justify-center mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-wider">
            <Building2 size={13} />
            Wholesale B2B Portal
          </span>
        </div>

        <h1 className="text-center font-serif text-2xl sm:text-3xl font-medium text-[#1D211F] tracking-tight">
          {forgotMode === "none" && "Wholesale Account Login"}
          {forgotMode === "email" && "Reset Wholesale Password"}
          {forgotMode === "otp" && "Enter Verification Code"}
          {forgotMode === "reset" && "Set New Password"}
        </h1>
        <p className="mt-2 text-center text-xs sm:text-sm text-[#5C6460] max-w-sm mx-auto">
          {forgotMode === "none" &&
            "Sign in with your verified commercial wholesale credentials to access B2B pricing, box rates, and order fulfillment."}
          {forgotMode === "email" &&
            "Enter your registered business email address to receive a password reset verification code."}
          {forgotMode === "otp" && `We sent a 6-digit verification code to ${email}.`}
          {forgotMode === "reset" && "Create a secure new password for your wholesale account."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-2xl shadow-xl border border-[#EDE9DF]">
          {/* Notifications */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 font-medium animate-in fade-in duration-150">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {pendingMessage && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800 font-medium animate-in fade-in duration-150">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-700" />
              <span>{pendingMessage}</span>
            </div>
          )}

          {forgotMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800 font-medium animate-in fade-in duration-150">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-700" />
              <span>{forgotMessage}</span>
            </div>
          )}

          {/* MAIN LOGIN FORM */}
          {forgotMode === "none" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Business Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="w-full h-11 pl-10 pr-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode("email");
                      setError(null);
                      setPendingMessage(null);
                      setForgotMessage(null);
                    }}
                    className="text-xs font-bold text-[#183D2B] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B] cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to B2B Portal</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD: STEP 1 (EMAIL) */}
          {forgotMode === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Business Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="w-full h-11 pl-10 pr-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode("none");
                  setError(null);
                }}
                className="w-full py-2 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Return to Login</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD: STEP 2 (OTP) */}
          {forgotMode === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  6-Digit Verification Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full h-11 pl-10 pr-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-center text-sm font-mono font-bold tracking-widest text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full h-11 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify Code</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotMode("email");
                  setError(null);
                }}
                className="w-full py-2 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Email Step</span>
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD: STEP 3 (RESET) */}
          {forgotMode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
                  />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-3 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Update Password &amp; Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* Bottom Links */}
          <div className="mt-6 pt-6 border-t border-[#EDE9DF] space-y-3 text-center">
            <p className="text-xs text-[#5C6460]">
              Don&apos;t have a wholesale account yet?{" "}
              <Link
                href="/wholesale/register"
                className="font-bold text-[#183D2B] hover:underline"
              >
                Apply for B2B Registration
              </Link>
            </p>

            <div className="pt-2">
              <Link
                href="/"
                className="text-[11px] font-semibold text-[#8C938F] hover:text-[#183D2B] transition-colors"
              >
                &larr; Return to Retail Consumer Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WholesaleLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="text-xs text-[#8E9590]">Loading wholesale login...</div>
        </div>
      }
    >
      <WholesaleLoginContent />
    </Suspense>
  );
}
