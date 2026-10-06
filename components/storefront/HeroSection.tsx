"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface HeroBannerItem {
  id?: string;
  title?: string | null;
  subtitle?: string | null;
  overline?: string | null;
  hero_tagline?: string | null;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  background_image_url?: string | null;
  background_image_public_id?: string | null;
  mobile_image_url?: string | null;
  mobile_image_public_id?: string | null;
  product_image_url?: string | null;
  product_image_public_id?: string | null;
  link_url?: string | null;
  link_text?: string | null;
  cta_primary_text?: string | null;
  cta_primary_href?: string | null;
  position?: string;
  sort_order?: number;
  is_active?: boolean;
}

interface HeroSectionProps {
  title?: string | null;
  subtitle?: string | null;
  heroData?: unknown;
  banners?: HeroBannerItem[];
}

const AUTOPLAY_INTERVAL = 6000; // 6 seconds per slide
const SWIPE_THRESHOLD = 45; // Minimum horizontal pixel delta to trigger swipe

export default function HeroSection({
  title: initialTitle,
  subtitle: initialSubtitle,
  heroData,
  banners: propBanners,
}: HeroSectionProps) {
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch tracking for mobile swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      setIsDesktop(window.innerWidth >= 640);
      const headerEl =
        document.getElementById("sticky-header-wrapper") ||
        document.querySelector("header")?.parentElement ||
        document.querySelector("header");
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Normalize banners list: priority to propBanners, fallback to heroData, fallback to default
  const slides: HeroBannerItem[] = (
    propBanners && propBanners.length > 0
      ? propBanners
      : heroData
      ? [heroData as HeroBannerItem]
      : initialTitle
      ? [
          {
            title: initialTitle,
            subtitle: initialSubtitle,
          },
        ]
      : []
  ).filter(Boolean);

  const totalSlides = slides.length;
  const hasMultipleSlides = totalSlides > 1;

  // Safe navigation functions
  const nextSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [hasMultipleSlides, totalSlides]);

  const prevSlide = useCallback(() => {
    if (!hasMultipleSlides) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [hasMultipleSlides, totalSlides]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Autoplay management
  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [hasMultipleSlides, isPaused, nextSlide]);

  // Touch swipe handlers with vertical scroll preservation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
    touchEndX.current = null;
    touchEndY.current = null;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchEndX.current = e.touches[0].clientX;
      touchEndY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current !== null &&
      touchEndX.current !== null &&
      touchStartY.current !== null &&
      touchEndY.current !== null
    ) {
      const deltaX = touchStartX.current - touchEndX.current;
      const deltaY = touchStartY.current - touchEndY.current;

      // Only handle horizontal swipe if horizontal movement is significantly greater than vertical movement
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          // Swiped left -> Next slide
          nextSlide();
        } else {
          // Swiped right -> Prev slide
          prevSlide();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    setIsPaused(false);
  };

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

  return (
    <section
      className="relative overflow-hidden bg-[#122419] text-white flex flex-col justify-end sm:justify-center h-[480px] sm:h-auto select-none"
      aria-label="Aurelle Hero"
      style={
        isDesktop
          ? {
              minHeight: headerHeight
                ? `calc(100dvh - ${headerHeight}px)`
                : "calc(100dvh - 140px)",
            }
          : undefined
      }
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Slide Content & Backgrounds ── */}
      {slides.map((slide, index) => {
        const isActive = index === (totalSlides > 0 ? currentIndex % totalSlides : 0);

        const rawBgUrl =
          slide.image_url ||
          slide.background_image_url ||
          slide.product_image_url;
        const rawBgPublicId =
          slide.image_public_id ||
          slide.background_image_public_id ||
          slide.product_image_public_id;

        const desktopImg =
          rawBgUrl ||
          (rawBgPublicId
            ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920,h_1000,c_fill,g_auto/${rawBgPublicId}`
            : null);

        const rawMobileUrl = slide.mobile_image_url;
        const rawMobilePublicId = slide.mobile_image_public_id;
        const mobileImg =
          rawMobileUrl ||
          (rawMobilePublicId
            ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800,h_1200,c_fill,g_auto/${rawMobilePublicId}`
            : desktopImg);

        const rawTitle = slide.title || slide.hero_title || initialTitle || "";
        const heroSubtitle = slide.subtitle || slide.hero_subtitle || initialSubtitle || "";
        const ctaText = slide.link_text || slide.cta_primary_text || "SHOP COLLECTION";
        const ctaHref = slide.link_url || slide.cta_primary_href || "/shop";
        const overline = slide.overline || slide.hero_tagline || "";

        const cleanCtaText = ctaText.replace(/[\s→\->]+$/, "").trim();

        const titleLines = rawTitle
          ? rawTitle.includes("\n")
            ? rawTitle.split(/\n+/).map((l) => l.trim()).filter(Boolean)
            : [rawTitle]
          : [];

        return (
          <div
            key={slide.id || `slide-${index}`}
            className={`absolute inset-0 flex flex-col justify-end sm:justify-center transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!isActive}
          >
            {/* ── 1. Full-Bleed Banner Image: desktop vs mobile ── */}
            {/* Desktop image (hidden on mobile) */}
            {desktopImg && (
              <div className="hidden sm:block absolute inset-0 z-0" aria-hidden="true">
                <Image
                  src={desktopImg}
                  alt={rawTitle || "Aurelle Everyday Essentials"}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                {/* Left-to-right shading overlay */}
                <div className="absolute inset-y-0 left-0 w-full sm:w-[75%] lg:w-[60%] bg-gradient-to-r from-[#122419]/88 via-[#122419]/60 via-45% to-transparent pointer-events-none" />
              </div>
            )}

            {/* Mobile image (hidden on desktop) */}
            {mobileImg && (
              <div className="sm:hidden absolute inset-0 z-0" aria-hidden="true">
                <Image
                  src={mobileImg}
                  alt={rawTitle || "Aurelle Everyday Essentials"}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover object-center"
                />
                {/* Bottom-up shading overlay on mobile */}
                <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#122419]/95 via-[#122419]/70 via-60% to-transparent pointer-events-none" />
              </div>
            )}

            {/* Fallback clean background when no images uploaded */}
            {!desktopImg && !mobileImg && (
              <div className="absolute inset-0 z-0 pointer-events-none bg-[#122419]" aria-hidden="true" />
            )}

            {/* ── 2. Content Container (Identical positioning & styling) ── */}
            <div
              className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full
                flex items-end justify-center pb-10
                sm:items-center sm:justify-start sm:my-auto sm:py-14 lg:py-16"
            >
              <div className="max-w-[560px] w-full sm:w-auto text-center sm:text-left">
                {/* Overline — hidden on mobile */}
                {overline && (
                  <p className="hidden sm:block text-[9px] font-bold tracking-[0.22em] uppercase text-[#A8B7A3] mb-3 sm:mb-4 drop-shadow-xs">
                    {overline}
                  </p>
                )}

                {/* Headline */}
                {rawTitle && (
                  <h1 className="font-serif text-2xl sm:text-3xl md:text-6xl font-extrabold text-white leading-[1.03] tracking-tight mb-4 sm:mb-5 uppercase drop-shadow-lg">
                    {titleLines.map((line, idx) => (
                      <span key={idx} className="block">
                        {line}
                      </span>
                    ))}
                  </h1>
                )}

                {/* Subtitle — hidden on mobile */}
                {heroSubtitle && (
                  <p className="hidden sm:block text-sm mb-7 sm:mb-8 max-w-[430px] drop-shadow-sm">
                    {heroSubtitle}
                  </p>
                )}

                {/* CTA Button */}
                {cleanCtaText && (
                  <div className="flex justify-center sm:justify-start">
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-2.5 bg-white text-[#183D2B] hover:bg-[#F7F5EF] px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs font-extrabold tracking-[0.14em] uppercase transition-all duration-200 shadow-md hover:shadow-2xl hover:-translate-y-0.5 group"
                    >
                      <span>{cleanCtaText}</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Fallback if no slides exist at all */}
      {slides.length === 0 && (
        <div className="absolute inset-0 z-0 bg-[#122419]" aria-hidden="true" />
      )}

      {/* ── 3. Desktop Subtle Navigation Arrows (Only when 2+ slides exist) ── */}
      {hasMultipleSlides && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              prevSlide();
            }}
            className="hidden sm:flex absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white backdrop-blur-xs transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              nextSlide();
            }}
            className="hidden sm:flex absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 items-center justify-center w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white backdrop-blur-xs transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight size={20} />
          </button>

          {/* ── 4. Subtle Slide Pagination Dots ── */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
            {slides.map((_, dotIdx) => {
              const isCurrent = dotIdx === currentIndex;
              return (
                <button
                  key={`dot-${dotIdx}`}
                  type="button"
                  onClick={() => goToSlide(dotIdx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "w-6 bg-white shadow-xs"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  aria-current={isCurrent ? "true" : undefined}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
