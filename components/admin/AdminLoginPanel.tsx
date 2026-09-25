"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound, ArrowLeft } from "lucide-react";

export default function AdminLoginPanel() {
  const router = useRouter();

  // Mode: "login" | "forgot-email" | "forgot-reset"
  const [mode, setMode] = useState<"login" | "forgot-email" | "forgot-reset">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpToken, setOtpToken] = useState("");

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Handle Admin Login ──────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid admin credentials. Please try again.");
        setIsLoading(false);
        return;
      }

      router.refresh();
      window.location.href = "/admin";
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  // ── Send OTP for Forgot Password ────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError("Please enter your admin email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Unable to send verification code.");
        setIsLoading(false);
        return;
      }

      setOtpToken(data.otpToken);
      setSuccessMsg("Verification code sent to your admin email.");
      setMode("forgot-reset");
    } catch {
      setError("Failed to connect to authentication server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Verify OTP & Update Password ────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // Step A: Verify OTP
      const verifyRes = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: email.trim(),
          otp: otp.trim(),
          otpToken,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || "Invalid or expired verification code.");
        setIsLoading(false);
        return;
      }

      // Step B: Set new password
      const resetRes = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: email.trim(),
          resetToken: verifyData.resetToken,
          newPassword,
        }),
      });

      const resetData = await resetRes.json();
      if (!resetRes.ok || !resetData.success) {
        setError(resetData.error || "Failed to update password.");
        setIsLoading(false);
        return;
      }

      // Success
      setSuccessMsg("Admin password updated successfully! Please sign in.");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpToken("");
      setMode("login");
    } catch {
      setError("An error occurred while resetting password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0C2218] flex items-center justify-center p-3 relative overflow-hidden">
      {/* Autofill dark background override */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #133324 inset !important;
          box-shadow: 0 0 0 1000px #133324 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Subtle background glow elements */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#183D2B] rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#C9A84C] rounded-full blur-3xl opacity-15 pointer-events-none" />

      {/* Main Container - Compact size, rounded-md */}
      <div className="w-full max-w-[340px] sm:max-w-[350px] bg-[#102D20] border border-white/10 rounded-md shadow-2xl p-5 sm:p-6 relative z-10 text-white">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="px-2">
            <Image
              src="/logo.png"
              alt="Aurelle Cosmetics Logo"
              width={130}
              height={60}
              className="h-7 w-auto object-contain filter brightness-110"
              priority
            />
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-3.5 p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-md flex items-start gap-2 text-[11px] text-emerald-200 animate-in fade-in duration-200">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-3.5 p-2.5 bg-red-950/60 border border-red-500/40 rounded-md flex items-start gap-2 text-[11px] text-red-200 animate-in fade-in duration-200">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ── MODE 1: Standard Login Form ──────────────────────── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 pointer-events-none">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter email"
                  className="w-full h-9 pl-8 pr-3 bg-white/5 border border-white/15 rounded-md text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot-email");
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] text-[#C9A84C] hover:text-[#D4B55E] transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 pointer-events-none">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 pl-8 pr-9 bg-white/5 border border-white/15 rounded-md text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-white/40 hover:text-white/80 p-0.5 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded-md bg-[#C9A84C] hover:bg-[#D4B55E] text-[#102D20] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer mt-1"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          </form>
        )}

        {/* ── MODE 2: Forgot Password - Enter Email ────────────── */}
        {mode === "forgot-email" && (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <div className="text-center mb-1">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Reset Admin Password
              </h2>
              <p className="text-[11px] text-white/60 mt-0.5 leading-tight">
                Enter your admin email to receive an OTP code.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 pointer-events-none">
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter email"
                  className="w-full h-9 pl-8 pr-3 bg-white/5 border border-white/15 rounded-md text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded-md bg-[#C9A84C] hover:bg-[#D4B55E] text-[#102D20] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Sending Code..." : "Send Verification Code"}</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-[11px] text-white/50 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ── MODE 3: Forgot Password - Enter OTP & New Password ── */}
        {mode === "forgot-reset" && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="text-center mb-1">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1">
                <KeyRound size={13} className="text-[#C9A84C]" />
                Enter OTP & New Password
              </h2>
              <p className="text-[11px] text-white/60 mt-0.5 truncate">
                Code sent to <span className="text-white/90 font-medium">{email}</span>
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full h-9 px-3 text-center tracking-[6px] font-mono text-sm bg-white/5 border border-white/15 rounded-md text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 pointer-events-none">
                  <Lock size={14} />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 pl-8 pr-9 bg-white/5 border border-white/15 rounded-md text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 text-white/40 hover:text-white/80 p-0.5 transition-colors"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white/75 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-white/40 pointer-events-none">
                  <Lock size={14} />
                </span>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-9 pl-8 pr-3 bg-white/5 border border-white/15 rounded-md text-xs text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]/25 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 rounded-md bg-[#C9A84C] hover:bg-[#D4B55E] text-[#102D20] font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? "Updating..." : "Update Password & Return"}</span>
              <ArrowRight size={13} strokeWidth={2.5} />
            </button>

            <div className="pt-1 flex items-center justify-between text-[11px]">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSendOtp}
                className="text-[#C9A84C] hover:text-[#D4B55E] transition-colors cursor-pointer"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="text-white/50 hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}

        {/* Back to storefront link */}
        <div className="mt-4 pt-3.5 border-t border-white/10 text-center">
          <Link
            href="/"
            className="text-[11px] text-white/50 hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>← Return to Aurelle Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
