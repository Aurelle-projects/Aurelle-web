import React from "react";

export default function HomeLoading() {
  return (
    <div className="bg-white min-h-screen animate-pulse overflow-hidden" aria-label="Loading Aurelle Home">
      {/* ─── 1. Hero Banner Skeleton ─────────────────────────────── */}
      <section className="relative bg-[#122419] h-[480px] sm:h-[540px] md:h-[620px] flex flex-col justify-end sm:justify-center px-4 sm:px-8 md:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full pb-8 sm:pb-0 space-y-4 sm:space-y-6">
          {/* Overline tag */}
          <div className="h-3 sm:h-4 w-28 sm:w-36 bg-white/20 rounded-none" />
          {/* Main Title lines */}
          <div className="space-y-2 sm:space-y-3">
            <div className="h-8 sm:h-12 md:h-14 w-3/4 max-w-xl bg-white/25 rounded-none" />
            <div className="h-8 sm:h-12 md:h-14 w-1/2 max-w-md bg-white/20 rounded-none" />
          </div>
          {/* Subtitle */}
          <div className="h-3.5 sm:h-4 w-2/3 max-w-sm bg-white/15 rounded-none" />
          {/* CTA Button */}
          <div className="pt-2">
            <div className="h-10 sm:h-11 w-40 bg-[#C9A84C]/40 rounded-none" />
          </div>
        </div>
      </section>

      {/* ─── 2. Trust Badges Skeleton ────────────────────────────── */}
      <section className="bg-[#FAF8F5] border-y border-[#EDE9DF]/70 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E9E4DC] shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-20 sm:w-24 bg-[#E9E4DC] rounded-none" />
                  <div className="h-2.5 w-14 sm:w-16 bg-[#E9E4DC]/60 rounded-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. Brand Strip Skeleton ─────────────────────────────── */}
      <section className="py-6 sm:py-8 border-b border-[#EDE9DF]/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 sm:h-10 w-24 sm:w-32 bg-[#E9E4DC]/60 rounded-none shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Shop by Category Skeleton ────────────────────────── */}
      <section className="py-8 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <div className="mb-6 sm:mb-8 text-start sm:text-center">
            <div className="h-5 sm:h-6 w-44 bg-[#E9E4DC] rounded-none sm:mx-auto" />
          </div>

          {/* Category Circle/Pill Track */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-hidden justify-start sm:justify-center">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2.5 shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#E9E4DC]" />
                <div className="h-3 w-16 bg-[#E9E4DC] rounded-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. New Arrivals Product Section Skeleton ────────────── */}
      <section className="py-8 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="h-5 sm:h-6 w-36 bg-[#E9E4DC] rounded-none" />
            <div className="h-3.5 w-20 bg-[#E9E4DC] rounded-none" />
          </div>

          {/* Product Cards Grid: 2 cols on mobile, 3 cols tablet, 6 cols desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2.5">
                {/* Product Image */}
                <div className="aspect-[3/4] w-full bg-[#E9E4DC] rounded-none" />
                {/* Brand */}
                <div className="h-2.5 w-16 bg-[#E9E4DC]/80 rounded-none" />
                {/* Name */}
                <div className="h-3.5 w-4/5 bg-[#E9E4DC] rounded-none" />
                {/* Price */}
                <div className="h-3.5 w-1/2 bg-[#E9E4DC]/90 rounded-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Promo Banners Skeleton ───────────────────────────── */}
      <section className="py-6 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="aspect-[16/9] sm:aspect-[21/9] bg-[#E9E4DC] rounded-none" />
            <div className="aspect-[16/9] sm:aspect-[21/9] bg-[#E9E4DC] rounded-none" />
          </div>
        </div>
      </section>

      {/* ─── 7. Best Selling Product Section Skeleton ────────────── */}
      <section className="py-8 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="h-5 sm:h-6 w-36 bg-[#E9E4DC] rounded-none" />
            <div className="h-3.5 w-20 bg-[#E9E4DC] rounded-none" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2.5">
                <div className="aspect-[3/4] w-full bg-[#E9E4DC] rounded-none" />
                <div className="h-2.5 w-16 bg-[#E9E4DC]/80 rounded-none" />
                <div className="h-3.5 w-4/5 bg-[#E9E4DC] rounded-none" />
                <div className="h-3.5 w-1/2 bg-[#E9E4DC]/90 rounded-none" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
