"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";

export default function AdminLoginPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@aurelle.ae");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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

      // Refresh to reload server layout with authenticated session
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setError("An unexpected error occurred. Please check your network and try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0C2218] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background glow elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#183D2B] rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C9A84C] rounded-full blur-3xl opacity-15 pointer-events-none" />

      <div className="w-full max-w-md bg-[#102D20] border border-white/10 rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10 text-white">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 mb-4 shadow-inner">
            <Image
              src="/logo.png"
              alt="Aurelle Cosmetics Logo"
              width={160}
              height={80}
              className="h-10 w-auto object-contain filter brightness-110"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[10.5px] font-bold tracking-widest text-[#C9A84C] bg-[#C9A84C]/15 border border-[#C9A84C]/30 rounded-full uppercase mb-3">
            <ShieldCheck size={13} />
            <span>Admin Console</span>
          </div>

          <h1 className="text-xl font-serif font-bold text-white tracking-wide">
            Management Portal
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Enter your admin credentials to access the dashboard.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-white/75 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-white/40 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aurelle.ae"
                className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/75 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-white/40 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 pl-10 pr-11 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-white/40 hover:text-white/80 p-1 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Quick Credential Hint */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11.5px] text-white/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium">Default Credentials:</span>
              <span className="text-[#C9A84C] font-mono text-[11px]">admin@aurelle.ae</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/80 font-medium">Default Password:</span>
              <span className="text-[#C9A84C] font-mono text-[11px]">admin123</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#C9A84C] hover:bg-[#D4B55E] text-[#102D20] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <span>{isLoading ? "Authenticating..." : "Sign In to Dashboard"}</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </form>

        {/* Back to storefront link */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <Link
            href="/"
            className="text-xs text-white/50 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <span>← Return to Aurelle Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
