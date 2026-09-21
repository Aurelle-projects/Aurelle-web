import React from "react";
import Link from "next/link";
import Image from "next/image";

interface PromoBannersProps {
  leftTagline?: string;
  leftTitle?: string;
  leftDiscount?: string;
  leftBtnText?: string;
  leftBtnLink?: string;
  leftImageUrl?: string | null;
  rightTagline?: string;
  rightTitle?: string;
  rightDiscount?: string;
  rightBtnText?: string;
  rightBtnLink?: string;
  rightImageUrl?: string | null;
}

export default function PromoBanners({
  leftTagline = "",
  leftTitle = "",
  leftDiscount = "",
  leftBtnText = "",
  leftBtnLink = "/shop",
  leftImageUrl = null,
  rightTagline = "",
  rightTitle = "",
  rightDiscount = "",
  rightBtnText = "",
  rightBtnLink = "/shop",
  rightImageUrl = null,
}: PromoBannersProps) {
  const hasLeft = Boolean(leftTagline || leftTitle || leftDiscount || leftImageUrl);
  const hasRight = Boolean(rightTagline || rightTitle || rightDiscount || rightImageUrl);

  if (!hasLeft && !hasRight) {
    return null;
  }

  return (
    <section className="bg-white py-6 md:py-16" aria-label="Special Offers and Promotions">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">

          {/* ── Left Banner: Primary Campaign (e.g. Christmas 30% off) ────── */}
          <div className="lg:col-span-8 bg-[#F5F5F5] rounded-none px-8 sm:px-10 lg:px-12 py-8 sm:py-0 h-auto sm:h-[300px] flex flex-col sm:flex-row items-center justify-between relative overflow-hidden">
            {/* Text details */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left z-10 sm:max-w-[50%] shrink-0">
              {leftTagline && (
                <span className="text-xs sm:text-[13px] font-medium tracking-[0.25em] text-[#5C6460] uppercase mb-1">
                  {leftTagline}
                </span>
              )}
              {leftTitle && (
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1D211F] font-normal leading-tight mb-2">
                  {leftTitle}
                </h2>
              )}
              {leftDiscount && (
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1D211F] tracking-tight mb-6">
                  {leftDiscount}
                </p>
              )}
              <Link
                href={leftBtnLink || "/shop"}
                className="inline-flex items-center justify-center px-8 py-3 border border-[#1D211F] bg-transparent text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] text-xs font-semibold tracking-wider uppercase transition-all duration-200 rounded-none cursor-pointer"
              >
                {leftBtnText || "Shop Now"}
              </Link>
            </div>

            {/* Campaign Visual — only renders if uploaded from admin */}
            {leftImageUrl && (
              <div className="relative w-full sm:w-[50%] h-[200px] sm:h-[300px] shrink-0 mt-6 -mb-8 sm:mt-0 sm:mb-0 flex items-end justify-center sm:justify-end">
                <Image
                  src={leftImageUrl}
                  alt={leftTitle || "Promotional banner"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-contain object-bottom sm:object-right-bottom pointer-events-none"
                  priority={false}
                />
              </div>
            )}
          </div>

          {/* ── Right Banner: Secondary Campaign (e.g. Next Purchase 15% off) ── */}
          <div className="lg:col-span-4 bg-[#EAEAEA] rounded-none px-8 sm:px-10 py-0 h-[240px] sm:h-[300px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            {/* Optional background image if uploaded */}
            {rightImageUrl && (
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <Image
                  src={rightImageUrl}
                  alt={rightTitle || "Promotional banner"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 30vw"
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex flex-col items-center z-10">
              {rightTagline && (
                <span className="text-xs sm:text-[13px] font-medium tracking-[0.25em] text-[#5C6460] uppercase mb-1">
                  {rightTagline}
                </span>
              )}
              {rightTitle && (
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1D211F] font-normal leading-tight mb-2">
                  {rightTitle}
                </h2>
              )}
              {rightDiscount && (
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1D211F] tracking-tight mb-6">
                  {rightDiscount}
                </p>
              )}
              <Link
                href={rightBtnLink || "/shop"}
                className="inline-flex items-center justify-center px-8 py-3 border border-[#1D211F] bg-transparent text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] text-xs font-semibold tracking-wider uppercase transition-all duration-200 rounded-none cursor-pointer"
              >
                {rightBtnText || "Shop Now"}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
