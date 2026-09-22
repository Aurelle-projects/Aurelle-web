"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BrandSectionProps {
  brands: Brand[];
}

export default function BrandSection({ brands }: BrandSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  const [shouldScroll, setShouldScroll] = useState(false);
  const [paused, setPaused] = useState(false);

  // Duplicate brands for seamless infinite loop (only when auto-scrolling)
  const items = shouldScroll ? [...brands, ...brands] : brands;

  // Determine if brands overflow the container width
  useEffect(() => {
    function check() {
      const container = containerRef.current;
      if (!container) return;
      const cardWidth = 144 + 16; // w-36 (144px) + gap-4 (16px)
      const totalWidth = brands.length * cardWidth;
      setShouldScroll(totalWidth > container.clientWidth);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [brands]);

  // Auto-scroll animation — only when shouldScroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !shouldScroll) {
      if (track) track.style.transform = "translateX(0)";
      return;
    }

    const speed = 0.6;

    function animate() {
      if (!track) return;
      if (!paused) {
        posRef.current += speed;
        const half = track.scrollWidth / 2;
        if (posRef.current >= half) posRef.current = 0;
        track.style.transform = `translateX(-${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [shouldScroll, paused]);

  if (brands.length === 0) return null;

  return (
    <section
      className="brand-section-root py-10 md:py-16 relative"
      aria-label="Shop by Brand"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="text-xl font-bold text-[#14231B] mb-6 sm:text-center uppercase tracking-wide">
          Shop by Brand
        </h2>
      </div>

      {/* Edge fade gradients — only when auto-scrolling */}
      {shouldScroll && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10"
            style={{ background: "linear-gradient(to right, #FAFAF8, transparent)" }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10"
            style={{ background: "linear-gradient(to left, #FAFAF8, transparent)" }}
          />
        </>
      )}

      {/*
        When overflowing: overflow-hidden + rAF auto-scroll (pauses on hover)
        When fitting:     overflow-x-auto native scroll (finger swipe on mobile), scrollbar hidden
      */}
      <div
        ref={containerRef}
        className={`px-4 ${
          shouldScroll
            ? "overflow-hidden"
            : "overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        }`}
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        onMouseEnter={() => shouldScroll && setPaused(true)}
        onMouseLeave={() => shouldScroll && setPaused(false)}
      >
        <div
          ref={trackRef}
          className={`flex gap-4 will-change-transform ${
            !shouldScroll ? "justify-center flex-wrap w-full" : ""
          }`}
          style={shouldScroll ? { width: "max-content" } : undefined}
        >
          {items.map((brand, idx) => (
            <Link
              key={`${brand.id}-${idx}`}
              href={`/shop?brand=${encodeURIComponent(brand.slug)}`}
              className="group flex-shrink-0 flex flex-col items-center gap-2"
              aria-label={`Shop ${brand.name}`}
            >
              {/* Logo card — logo centered */}
              <div className="w-36 h-20 rounded-sm bg-white flex items-center justify-center hover:border-[#183D2B]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="h-10 w-auto max-w-[108px] object-contain mx-auto group-hover:scale-105 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#F7F5EF] flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold text-[#183D2B]">
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Brand name — outside the card */}
              <span className="text-xs font-semibold text-[#1D211F] text-center leading-tight w-36 truncate">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .brand-section-root { background-color: #FAFAF8; }
      `}</style>
    </section>
  );
}
