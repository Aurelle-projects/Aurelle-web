"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

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
  const [heroSettings, setHeroSettings] = useState({
    overline: "NATURAL CARE FOR A BRIGHTER YOU",
    title: initialTitle || "EVERYDAY\nESSENTIALS.\nELEVATED.",
    subtitle:
      initialSubtitle ||
      "Beauty, personal care and lifestyle products for every member of the family.",
    ctaText: "SHOP COLLECTION",
    ctaLink: "/shop",
    bgPublicId: "",
    bgUrl: "",
    productImagePublicId: "",
    productImageUrl: "",
  });

  useEffect(() => {
    try {
      // 1. Check primary admin store
      const uiSaved = localStorage.getItem("aurelle_storefront_ui");
      if (uiSaved) {
        const parsed = JSON.parse(uiSaved);
        setHeroSettings((prev) => ({
          ...prev,
          title: parsed.hero_title || prev.title,
          subtitle: parsed.hero_subtitle || prev.subtitle,
          ctaText: parsed.cta_primary_text || prev.ctaText,
          ctaLink: parsed.cta_primary_href || prev.ctaLink,
          bgPublicId: parsed.background_image_public_id || prev.bgPublicId,
          bgUrl: parsed.background_image_url || prev.bgUrl,
          productImagePublicId: parsed.product_image_public_id || prev.productImagePublicId,
          productImageUrl: parsed.product_image_url || prev.productImageUrl,
        }));
      }

      // 2. Check legacy admin settings
      const adminSaved = localStorage.getItem("aurelle_admin_settings");
      if (adminSaved) {
        const parsed = JSON.parse(adminSaved);
        setHeroSettings((prev) => ({
          ...prev,
          title: parsed.hero_title || prev.title,
          subtitle: parsed.hero_subtitle || prev.subtitle,
          ctaText: parsed.hero_cta_text || prev.ctaText,
          ctaLink: parsed.hero_cta_link || prev.ctaLink,
          bgPublicId: parsed.hero_bg_public_id || prev.bgPublicId,
          productImagePublicId: parsed.hero_product_image_public_id || prev.productImagePublicId,
        }));
      }
    } catch {
      // Ignore
    }
  }, []);

  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl =
        document.getElementById("sticky-header-wrapper") ||
        document.querySelector("header")?.parentElement ||
        document.querySelector("header");
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);
    return () => window.removeEventListener("resize", updateHeaderHeight);
  }, []);

  const data = heroData as {
    background_image_public_id?: string;
    background_image_url?: string;
    product_image_public_id?: string;
    product_image_url?: string;
    cta_primary_text?: string;
    cta_primary_href?: string;
    overline?: string;
    hero_title?: string;
    hero_subtitle?: string;
  } | null;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

  const rawBgUrl = data?.background_image_url || heroSettings.bgUrl;
  const rawBgPublicId = data?.background_image_public_id || heroSettings.bgPublicId;
  const bgImageUrl =
    rawBgUrl ||
    (rawBgPublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920,h_1000,c_fill,g_auto/${rawBgPublicId}`
      : null);

  const rawProdUrl = data?.product_image_url || heroSettings.productImageUrl;
  const rawProdPublicId = data?.product_image_public_id || heroSettings.productImagePublicId;
  let heroImg =
    rawProdUrl ||
    (rawProdPublicId
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1920,h_1000,c_fill,g_auto/${rawProdPublicId}`
      : null);

  // Fallback to background image if user uploaded the photo under background banner
  if (!heroImg && bgImageUrl) {
    heroImg = bgImageUrl;
  }

  const rawTitle = data?.hero_title || initialTitle || heroSettings.title;
  const heroSubtitle = data?.hero_subtitle || initialSubtitle || heroSettings.subtitle;
  const ctaText = data?.cta_primary_text || heroSettings.ctaText;
  const ctaHref = data?.cta_primary_href || heroSettings.ctaLink;
  const overline = data?.overline || heroSettings.overline;

  // Clean CTA text to prevent double arrows (e.g. "SHOP COLLECTION → →")
  const cleanCtaText = ctaText.replace(/[\s→\->]+$/, "").trim();

  // Format 3 lines matching reference: EVERYDAY / ESSENTIALS. / ELEVATED.
  let line1 = "EVERYDAY";
  let line2 = "ESSENTIALS.";
  let line3 = "ELEVATED.";

  if (rawTitle.includes("\n")) {
    const lines = rawTitle.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 3) {
      line1 = lines[0] ?? "EVERYDAY";
      line2 = lines[1] ?? "ESSENTIALS.";
      line3 = lines.slice(2).join(" ");
    } else if (lines.length === 2) {
      line1 = lines[0] ?? "EVERYDAY";
      line2 = lines[1] ?? "ESSENTIALS.";
      line3 = "";
    } else if (lines.length === 1) {
      line1 = lines[0] ?? "EVERYDAY";
      line2 = "";
      line3 = "";
    }
  }

  return (
    <section
      className="relative overflow-hidden bg-[#122419] text-white flex flex-col justify-end sm:justify-center"
      aria-label="Aurelle Hero"
      style={{
        minHeight: headerHeight ? `calc(100dvh - ${headerHeight}px)` : "calc(100dvh - 140px)",
      }}
    >
      {/* ── 1. Full-Bleed Banner Image (Edge-to-Edge across entire Hero) ── */}
      {heroImg ? (
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <Image
            src={heroImg}
            alt="Aurelle Everyday Essentials"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[75%_center] sm:object-[70%_center] lg:object-[65%_center] xl:object-center"
          />
          {/* Soft green shading — left-to-right on desktop, bottom-up on mobile */}
          <div className="hidden sm:block absolute inset-y-0 left-0 w-full sm:w-[75%] lg:w-[60%] bg-gradient-to-r from-[#122419]/88 via-[#122419]/60 via-45% to-transparent pointer-events-none" />
          <div className="sm:hidden absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#122419]/95 via-[#122419]/70 via-60% to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Fallback clean background when no image uploaded */
        <div className="absolute inset-0 z-0 pointer-events-none bg-[#122419]" aria-hidden="true" />
      )}


      {/* ── 3. Content Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full
        flex items-end justify-center pb-10
        sm:items-center sm:justify-start sm:my-auto sm:py-14 lg:py-16">
        <div className="max-w-[560px] w-full sm:w-auto text-center sm:text-left">
          {/* Overline — hidden on mobile */}
          <p className="hidden sm:block text-[9px] font-bold tracking-[0.22em] uppercase text-[#A8B7A3] mb-3 sm:mb-4 drop-shadow-xs">
            {overline}
          </p>

          {/* Headline */}
          <h1
            className="font-serif text-2xl sm:text-3xl md:text-6xl font-extrabold text-white leading-[1.03] tracking-tight mb-4 sm:mb-5 uppercase drop-shadow-lg"
          >
            {/* Mobile: line1 + line2 on same line, line3 below */}
            <span className="block sm:hidden">
              {line1}{line2 ? ` ${line2}` : ""}
            </span>
            {line3 && <span className="block sm:hidden">{line3}</span>}
            {/* Desktop: each line separate */}
            <span className="hidden sm:block">{line1}</span>
            {line2 && <span className="hidden sm:block">{line2}</span>}
            {line3 && <span className="hidden sm:block">{line3}</span>}
          </h1>

          {/* Subtitle — hidden on mobile */}
          <p className="hidden sm:block text-sm mb-7 sm:mb-8 max-w-[430px] drop-shadow-sm">
            {heroSubtitle}
          </p>

          {/* CTA Button */}
          <div className="flex justify-center sm:justify-start">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 bg-white text-[#183D2B] hover:bg-[#F7F5EF] px-8 py-3.5 sm:py-4 text-[11px] sm:text-xs font-extrabold tracking-[0.14em] uppercase transition-all duration-200 shadow-md hover:shadow-2xl hover:-translate-y-0.5 group"
            >
              <span>{cleanCtaText}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
