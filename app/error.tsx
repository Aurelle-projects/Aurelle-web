"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F7F5EF] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-md mx-auto flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
          <AlertTriangle size={28} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-[#1D211F] tracking-tight">
            Something went wrong
          </h1>
          <p className="text-sm text-[#5C6460] leading-relaxed">
            We encountered an unexpected issue. Your cart and data are safe.
            Please try again or return to the homepage.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#102D20] transition-colors shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-[#DCCFB9] text-[#1D211F] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#F7F5EF] transition-colors"
          >
            Go Home
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="text-[11px] text-[#8E9590] font-mono mt-2">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
