"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProduct = any;

interface WholesaleNewArrivalsProps {
  products: AnyProduct[];
  viewAllHref?: string;
  maxProducts?: number;
}

/**
 * WholesaleNewArrivals
 *
 * Desktop (sm+): Static 5-col grid — all 5 cards fully visible.
 * Mobile (<sm):  Pure auto-sliding carousel, one card at a time.
 *                No prev/next buttons — dots only for position feedback.
 *                Auto-advances every 3.2 s, pauses on touch.
 */
export default function WholesaleNewArrivals({
  products,
  viewAllHref = "/wholesale/shop?filter=new-arrivals",
  maxProducts = 5,
}: WholesaleNewArrivalsProps) {
  const displayProducts = products.slice(0, maxProducts);
  const total = displayProducts.length;

  // Group products into pairs for 2-per-slide mobile carousel
  const slides: AnyProduct[][] = [];
  for (let i = 0; i < displayProducts.length; i += 2) {
    slides.push(displayProducts.slice(i, i + 2));
  }
  const slideCount = slides.length;

  const [mobileIdx, setMobileIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-advance through slides
  useEffect(() => {
    if (slideCount <= 1 || isPaused) return;
    autoRef.current = setInterval(() => {
      setMobileIdx((prev) => (prev + 1) % slideCount);
    }, 3200);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [slideCount, isPaused]);

  if (total === 0) return null;

  return (
    <section
      className="py-6 md:py-16 bg-white"
      aria-labelledby="wholesale-new-arrivals-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-8 sm:mb-10">
          <h2
            id="wholesale-new-arrivals-heading"
            className="md:text-xl text-lg font-bold text-[#14231B] uppercase tracking-wide"
          >
            New Arrivals
          </h2>
        </div>

        {/* DESKTOP: static 5-col grid, all cards visible */}
        <div
          className="hidden sm:grid grid-cols-5 gap-4 sm:gap-6 lg:gap-8"
          role="list"
          aria-label="Wholesale new arrival products"
        >
          {displayProducts.map((product: AnyProduct) => (
            <div key={product.id} role="listitem">
              <ProductCard product={product} badge="New Arrival" isWholesaleUser={true} />
            </div>
          ))}
        </div>

        {/* MOBILE: 2-cards-per-slide auto carousel, no buttons */}
        <div
          className="sm:hidden"
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="overflow-hidden w-full">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: "translateX(-" + (mobileIdx * 100) + "%)" }}
            >
              {slides.map((pair: AnyProduct[], slideIdx: number) => (
                <div
                  key={"slide-" + slideIdx}
                  className="w-full flex-shrink-0 grid grid-cols-2 gap-3"
                  style={{ minWidth: "100%" }}
                >
                  {pair.map((product: AnyProduct) => (
                    <div key={product.id}>
                      <ProductCard product={product} badge="New Arrival" isWholesaleUser={true} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators — one per slide */}
          {slideCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-5">
              {slides.map((_: AnyProduct[], idx: number) => (
                <button
                  key={"dot-" + idx}
                  type="button"
                  onClick={() => { setMobileIdx(idx); setIsPaused(false); }}
                  aria-label={"Go to slide " + (idx + 1)}
                  aria-current={idx === mobileIdx ? "true" : undefined}
                  className={[
                    "rounded-full transition-all duration-300 cursor-pointer",
                    idx === mobileIdx
                      ? "w-6 h-2 bg-[#183D2B]"
                      : "w-2 h-2 bg-[#DCCFB9]",
                  ].join(" ")}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All button */}
        <div className="mt-10 sm:mt-14 text-center">
          <Link
            href={viewAllHref}
            className="inline-flex items-center justify-center px-9 py-3.5 border border-[#1D211F] bg-transparent text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-200 rounded-none cursor-pointer"
          >
            View All New Arrivals
          </Link>
        </div>

      </div>
    </section>
  );
}