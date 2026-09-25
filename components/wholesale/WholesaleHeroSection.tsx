"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

interface WholesaleHeroSectionProps {
  heroData?: {
    hero_title?: string | null;
    hero_subtitle?: string | null;
    hero_tagline?: string | null;
    background_image_url?: string | null;
    background_image_public_id?: string | null;
    banner_image_url?: string | null;
    banner_url?: string | null;
    image_url?: string | null;
    desktop_image_url?: string | null;
    mobile_image_url?: string | null;
    mobile_image_public_id?: string | null;
    [key: string]: any;
  } | null;
  bannerFallback?: string | null;
}

export default function WholesaleHeroSection({
  heroData,
  bannerFallback,
}: WholesaleHeroSectionProps) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

  const rawBgUrl =
    heroData?.background_image_url ||
    heroData?.banner_image_url ||
    heroData?.banner_url ||
    heroData?.image_url ||
    heroData?.desktop_image_url ||
    heroData?.url ||
    bannerFallback ||
    null;

  const rawBgPublicId =
    heroData?.background_image_public_id ||
    heroData?.banner_public_id ||
    heroData?.public_id ||
    null;

  const desktopImg =
    rawBgUrl ||
    (rawBgPublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920,h_1000,c_fill,g_auto/${rawBgPublicId}`
      : null);

  const rawMobileUrl =
    heroData?.mobile_image_url ||
    heroData?.mobile_banner_url ||
    null;

  const rawMobilePublicId =
    heroData?.mobile_image_public_id ||
    heroData?.mobile_public_id ||
    null;

  const mobileImg =
    rawMobileUrl ||
    (rawMobilePublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800,h_1200,c_fill,g_auto/${rawMobilePublicId}`
      : null) ||
    desktopImg;

  const hasBanner = Boolean(desktopImg || mobileImg);

  const title =
    heroData?.hero_title || "Direct B2B Beauty & Cosmetics Distribution";
  const subtitle =
    heroData?.hero_subtitle ||
    "Access verified wholesale pricing, low starter MOQs, and consolidated GCC carton & pallet logistics for licensed pharmacies, salons, and beauty retailers.";
  const tagline = heroData?.hero_tagline || "UAE & GCC Commercial Trade Network";

  return (
    <section
      className="relative overflow-hidden min-h-[calc(100dvh-4rem)] md:min-h-[calc(100dvh-5rem)] flex flex-col justify-end md:justify-center py-12 md:py-24 bg-black text-white"
      aria-label="Wholesale B2B Hero"
    >
      {/* ── Desktop & Mobile Full-Bleed Banner Image ── */}
      {desktopImg && (
        <div className="hidden sm:block absolute inset-0 z-0" aria-hidden="true">
          <Image
            src={desktopImg}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradient black only overlay behind content */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 to-transparent pointer-events-none" />
        </div>
      )}

      {mobileImg && (
        <div className="sm:hidden absolute inset-0 z-0" aria-hidden="true">
          <Image
            src={mobileImg}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradient black only overlay for mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />
        </div>
      )}

      {/* ── Content Container (No box, clean text on gradient black) ── */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-2xl space-y-5 text-left">
          {/* Overline tagline */}
          <div className="text-xs uppercase tracking-widest font-semibold text-[#DCCFB9]">
            <span>{tagline}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-5xl font-sans tracking-tight leading-[1.12] text-white drop-shadow-md">
            {title}
          </h1>

          {/* Subtitle - hidden on mobile */}
          <p className="hidden sm:block text-sm leading-relaxed max-w-2xl text-white/85 drop-shadow-xs">
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/wholesale/shop"
              className="px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs cursor-pointer bg-white text-[#14231B] hover:bg-[#FAF8F5]"
            >
              <Package size={15} className="text-[#14231B]" />
              <span>Explore Products</span>
            </Link>

            <Link
              href="/wholesale/contact"
              className="px-6 py-3.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-xs cursor-pointer bg-black/40 hover:bg-black/60 text-white border border-white/25 backdrop-blur-xs"
            >
              <span>Contact Us</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

