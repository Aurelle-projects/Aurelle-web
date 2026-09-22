"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Check, X, ArrowLeft, Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AccountAuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

type AuthMode = "login" | "signup" | "forgot-email" | "forgot-otp" | "forgot-reset";

export default function AccountAuthModal({
  open,
  onClose,
  initialMode = "login",
}: AccountAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password flow state
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setError(null);
    setMessage(null);
    setOtp("");
    setOtpToken(null);
    setResetToken(null);
    setNewPassword("");
    setConfirmPassword("");
  }, [open, initialMode]);

  if (!open) return null;

  // Handle Login & Signup
  async function handleAuthSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signup") {
        // Direct signup without email verification: user is created confirmed
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            fullName,
            mobile,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Unable to create account.");
        }

        // Automatically log the user in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If auto sign-in has any edge issue, ask them to sign in
          setMessage("Account created successfully! Please sign in.");
          setMode("login");
          setPassword("");
        } else {
          setMessage("Account created successfully! Welcome to Aurelle.");
          setTimeout(() => {
            onClose();
            window.location.assign("/");
          }, 800);
        }
      } else {
        // Standard Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        onClose();
        window.location.assign("/");
      }
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to complete authentication."
      );
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password: Step 1 - Send OTP (checks if email exists first)
  async function handleSendOtp(event?: React.FormEvent) {
    if (event) event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-otp",
          email,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to send verification code.");
      }

      setOtpToken(result.otpToken);
      setMessage(`A 6-digit verification code has been sent to ${email}.`);
      setMode("forgot-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to process request.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password: Step 2 - Verify OTP
  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email,
          otp,
          otpToken,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Invalid verification code.");
      }

      setResetToken(result.resetToken);
      setMessage(null);
      setMode("forgot-reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify code.");
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password: Step 3 - Reset Password
  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email,
          resetToken,
          newPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to reset password.");
      }

      // Success! Move back to login with pre-filled email
      setMode("login");
      setPassword("");
      setOtp("");
      setOtpToken(null);
      setResetToken(null);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password reset successfully! You can now log in with your new password.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1D211F]/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-auth-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-2xl sm:px-8 border border-[#EDE9DF]/60 transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#5C6460] hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
          aria-label="Close account dialog"
        >
          <X size={18} />
        </button>

        {/* ── HEADER ────────────────────────────────────────── */}
        <div className="text-center">
          <h2 id="account-auth-title" className="font-serif text-xl text-[#1D211F]">
            {mode === "login" && "Welcome Back to Aurelle"}
            {mode === "signup" && "Create an Aurelle Account"}
            {mode === "forgot-email" && "Reset Password"}
            {mode === "forgot-otp" && "Enter Verification Code"}
            {mode === "forgot-reset" && "Create New Password"}
          </h2>
          <p className="mt-1.5 text-xs text-[#5C6460]">
            {mode === "login" && "Sign in to access your orders, wishlist, and bag."}
            {mode === "signup" && "Everyday beauty, personal care and elevated lifestyle essentials."}
            {mode === "forgot-email" && "Enter your registered email address to receive a 6-digit OTP code."}
            {mode === "forgot-otp" && `We sent a 6-digit code to ${email}.`}
            {mode === "forgot-reset" && "Set a secure new password for your Aurelle account."}
          </p>
        </div>

        {/* ── TABS FOR SIGN IN / SIGN UP ───────────────────── */}
        {(mode === "login" || mode === "signup") && (
          <div className="mt-4 flex rounded-lg bg-[#F7F5EF] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-[#183D2B] shadow-xs"
                  : "text-[#5C6460] hover:text-[#183D2B]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === "signup"
                  ? "bg-white text-[#183D2B] shadow-xs"
                  : "text-[#5C6460] hover:text-[#183D2B]"
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* ── NOTIFICATION BANNERS ─────────────────────────── */}
        {message && (
          <div className="mt-4 flex items-start gap-2 rounded-md bg-[#183D2B]/10 border border-[#183D2B]/20 p-2.5 text-xs text-[#183D2B]">
            <Check size={16} className="mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* ── FORM: SIGN IN / SIGN UP ───────────────────────── */}
        {(mode === "login" || mode === "signup") && (
          <form onSubmit={handleAuthSubmit} className="mt-4 space-y-3">
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                />
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Mobile number"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                />
              </>
            )}

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
            />

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1D211F]">
                  Password
                </span>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-email");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-[11px] font-medium text-[#183D2B] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] pl-3.5 pr-9 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#183D2B] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#102D20] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* ── FORGOT PASSWORD: STEP 1 (EMAIL) ──────────────── */}
        {mode === "forgot-email" && (
          <form onSubmit={handleSendOtp} className="mt-4 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
            />

            <button
              type="submit"
              disabled={loading || !email}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#183D2B] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#102D20] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Checking email..." : "Send OTP"}
              <ArrowRight size={14} />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#5C6460] hover:text-[#183D2B] transition-colors"
              >
                <ArrowLeft size={13} />
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD: STEP 2 (OTP) ────────────────── */}
        {mode === "forgot-otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="h-11 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] text-center font-mono text-lg font-bold tracking-[8px] text-[#183D2B] outline-none transition-all placeholder:tracking-[4px] placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#183D2B] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#102D20] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify OTP"}
              <ShieldCheck size={14} />
            </button>

            <div className="flex items-center justify-between text-xs pt-1 text-[#5C6460]">
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading}
                className="text-[#183D2B] font-medium hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot-email");
                  setError(null);
                  setMessage(null);
                }}
                className="hover:text-[#183D2B] transition-colors"
              >
                Change Email
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD: STEP 3 (NEW PASSWORD) ───────── */}
        {mode === "forgot-reset" && (
          <form onSubmit={handleResetPassword} className="mt-4 space-y-3">
            <div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 characters)"
                  className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] pl-3.5 pr-9 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C938F] hover:text-[#183D2B]"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <input
              type={showNewPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="h-10 w-full rounded-md border border-[#EDE9DF] bg-[#F7F5EF] px-3.5 text-xs text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:border-[#183D2B] focus:bg-white focus:ring-1 focus:ring-[#183D2B]/20"
            />

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#183D2B] px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#102D20] disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Updating..." : "Reset Password"}
              <KeyRound size={14} />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#5C6460] hover:text-[#183D2B] transition-colors"
              >
                <ArrowLeft size={13} />
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
