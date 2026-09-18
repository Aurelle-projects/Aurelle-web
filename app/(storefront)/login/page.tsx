"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Briefcase, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [userType, setUserType] = useState<"retail" | "wholesale">("retail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (userType === "wholesale") {
        router.push("/wholesale");
      } else {
        router.push("/shop");
      }
    }, 800);
  }

  function handleDemoAdmin() {
    router.push("/admin");
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-20 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-md p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:scale-[1.02] transition-transform">
            <Image
              src="/logo.png"
              alt="Aurelle Logo"
              width={160}
              height={80}
              className="h-10 w-auto object-contain mx-auto"
              priority
            />
          </Link>
          <h1 className="text-xl font-serif font-bold text-[#1D211F]">
            {mode === "login" ? "Welcome Back to Aurelle" : "Create an Aurelle Account"}
          </h1>
          <p className="text-xs text-[#5C6460]">
            Everyday beauty, personal care and elevated lifestyle essentials.
          </p>
        </div>

        {/* Account Mode Tabs */}
        <div className="flex bg-[#F7F5EF] p-1 rounded-xl border border-[#DCCFB9]/40">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "login"
                ? "bg-white text-[#183D2B] shadow-xs"
                : "text-[#5C6460] hover:text-[#1D211F]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-white text-[#183D2B] shadow-xs"
                : "text-[#5C6460] hover:text-[#1D211F]"
            }`}
          >
            Register
          </button>
        </div>

        {/* User Type Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUserType("retail")}
            className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
              userType === "retail"
                ? "border-[#183D2B] bg-[#183D2B]/5 text-[#183D2B]"
                : "border-[#DCCFB9]/50 text-[#5C6460] hover:bg-[#F7F5EF]"
            }`}
          >
            <User size={14} />
            <span>Retail Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setUserType("wholesale")}
            className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
              userType === "wholesale"
                ? "border-[#183D2B] bg-[#183D2B]/5 text-[#183D2B]"
                : "border-[#DCCFB9]/50 text-[#5C6460] hover:bg-[#F7F5EF]"
            }`}
          >
            <Briefcase size={14} />
            <span>B2B Wholesale</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Fatima Al-Nuaimi"
                className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.ae"
              className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                Password
              </label>
              {mode === "login" && (
                <a href="#" className="text-[11px] text-[#183D2B] hover:underline">
                  Forgot?
                </a>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 rounded-full bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>{isLoading ? "Signing In..." : mode === "login" ? "Sign In" : "Create Account"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Demo Fast Navigation Button */}
        <div className="pt-2 border-t border-[#DCCFB9]/30 text-center space-y-2">
          <p className="text-[11px] text-[#5C6460]">Staff or Operator access?</p>
          <button
            type="button"
            onClick={handleDemoAdmin}
            className="w-full py-2 px-4 rounded-xl border border-[#DCCFB9] hover:bg-[#183D2B] hover:text-white text-xs font-bold text-[#183D2B] transition-colors"
          >
            Open Admin Console →
          </button>
        </div>
      </div>
    </div>
  );
}
