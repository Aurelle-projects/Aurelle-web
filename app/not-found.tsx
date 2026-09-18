import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F7F5EF] flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-lg mx-auto flex flex-col items-center gap-5">
        {/* Giant 404 */}
        <p className="text-[7rem] sm:text-[9rem] font-extrabold text-[#E9E1D2] leading-none tracking-tighter select-none" aria-hidden="true">
          404
        </p>

        {/* Icon */}
        <div className="text-[#A8B7A3] -mt-4" aria-hidden="true">
          <Package size={56} strokeWidth={1} />
        </div>

        {/* Copy */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1D211F] tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#102D20] transition-colors shadow-sm"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#183D2B] text-[#183D2B] text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#183D2B] hover:text-white transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
