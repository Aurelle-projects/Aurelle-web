"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroSectionProps {
  title?: string | null;
  subtitle?: string | null;
  heroData?: unknown;
}

export default function HeroSection({
  title: initialTitle,
  subtitle: initialSubtitle,
  heroData,
}: HeroSectionProps) {
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

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

  const data = heroData as {
    background_image_public_id?: string;
    background_image_url?: string;
    product_image_public_id?: string;
    product_image_url?: string;
    mobile_image_url?: string;
    mobile_image_public_id?: string;
    cta_primary_text?: string;
    cta_primary_href?: string;
    overline?: string;
    hero_tagline?: string;
    hero_title?: string;
    hero_subtitle?: string;
  } | null;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

  const rawBgUrl = data?.background_image_url;
  const rawBgPublicId = data?.background_image_public_id;
  const desktopImg =
    rawBgUrl ||
    (rawBgPublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920,h_1000,c_fill,g_auto/${rawBgPublicId}`
      : null);

  // Mobile-specific image (falls back to desktop if not set)
  const rawMobileUrl = data?.mobile_image_url;
  const rawMobilePublicId = data?.mobile_image_public_id;
  const mobileImg =
    rawMobileUrl ||
    (rawMobilePublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800,h_1200,c_fill,g_auto/${rawMobilePublicId}`
      : desktopImg);

  const rawTitle = data?.hero_title ?? initialTitle ?? "";
  const heroSubtitle = data?.hero_subtitle ?? initialSubtitle ?? "";
  const ctaText = data?.cta_primary_text || "SHOP COLLECTION";
  const ctaHref = data?.cta_primary_href || "/shop";
  const overline = data?.overline || data?.hero_tagline || "";

  // Clean CTA text to prevent double arrows (e.g. "SHOP COLLECTION → →")
  const cleanCtaText = ctaText.replace(/[\s→\->]+$/, "").trim();

  // Split title if newlines are present, or render directly
  const titleLines = rawTitle
    ? rawTitle.includes("\n")
      ? rawTitle.split(/\n+/).map((l) => l.trim()).filter(Boolean)
      : [rawTitle]
    : [];

  return (
    <section
      className="relative overflow-hidden bg-[#122419] text-white flex flex-col justify-end sm:justify-center h-[420px] sm:h-auto"
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
    >
      {/* ── 1. Full-Bleed Banner Image: desktop vs mobile ── */}
      {/* Desktop image (hidden on mobile) */}
      {desktopImg && (
        <div className="hidden sm:block absolute inset-0 z-0" aria-hidden="true">
          <Image
            src={desktopImg}
            alt="Aurelle Everyday Essentials"
            fill
            priority
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
            alt="Aurelle Everyday Essentials"
            fill
            priority
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


      {/* ── 3. Content Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full
        flex items-end justify-center pb-10
        sm:items-center sm:justify-start sm:my-auto sm:py-14 lg:py-16">
        <div className="max-w-[560px] w-full sm:w-auto text-center sm:text-left">
          {/* Overline — hidden on mobile */}
          {overline && (
            <p className="hidden sm:block text-[9px] font-bold tracking-[0.22em] uppercase text-[#A8B7A3] mb-3 sm:mb-4 drop-shadow-xs">
              {overline}
            </p>
          )}

          {/* Headline */}
          {rawTitle && (
            <h1
              className="font-serif text-2xl sm:text-3xl md:text-6xl font-extrabold text-white leading-[1.03] tracking-tight mb-4 sm:mb-5 uppercase drop-shadow-lg"
            >
              {titleLines.map((line, idx) => (
                <span key={idx} className="block">{line}</span>
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
    </section>
  );
}
