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
      className="relative overflow-hidden bg-[#122419] text-white"
      aria-label="Aurelle Hero"
      style={{ minHeight: "clamp(520px, 62vw, 680px)" }}
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
          {/* Seamless left-to-right gradient overlay so white text on left is always 100% crisp & readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#122419]/95 via-[#122419]/80 via-35% sm:via-45% lg:via-42% to-transparent pointer-events-none" />
          {/* Subtle top and bottom atmospheric vignette */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#122419]/40 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#122419]/50 to-transparent pointer-events-none" />
        </div>
      ) : (
        /* Fallback dark botanical organic gradient when no image uploaded */
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-r from-[#122419] via-[#162F21] to-[#122419]" />
          <div className="absolute -left-24 -top-24 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(40,78,54,0.45)_0%,transparent_70%)]" />
        </div>
      )}

      {/* ── 2. Brand Pillars on Top Right (Care, Beauty, Wellness, Lifestyle) ── */}
      <div className="hidden sm:flex absolute right-6 lg:right-12 xl:right-16 top-8 lg:top-12 z-20 flex-col items-end gap-1.5 sm:gap-2 pointer-events-none drop-shadow-md">
        {["CARE", "BEAUTY", "WELLNESS", "LIFESTYLE"].map((word) => (
          <span
            key={word}
            className="font-serif text-[11px] lg:text-[13px] tracking-[0.26em] text-[#E0D7C6]/90 uppercase font-medium"
          >
            {word}
          </span>
        ))}
      </div>

      {/* ── 3. Content Container ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center min-h-[520px] sm:min-h-[560px] lg:min-h-[620px] py-12 md:py-16">
        <div className="max-w-[560px]">
          {/* Overline */}
          <p className="text-[11px] sm:text-[12px] font-bold tracking-[0.22em] uppercase text-[#A8B7A3] mb-3 sm:mb-4 drop-shadow-xs">
            {overline}
          </p>

          {/* Headline matching exact reference design */}
          <h1
            className="font-serif font-extrabold text-white leading-[1.03] tracking-tight mb-4 sm:mb-5 uppercase drop-shadow-lg"
            style={{ fontSize: "clamp(2.5rem, 5.2vw, 4.25rem)" }}
          >
            <span className="block">{line1}</span>
            {line2 && <span className="block">{line2}</span>}
            {line3 && <span className="block">{line3}</span>}
          </h1>

          {/* Subtitle */}
          <p className="text-[#E2DFD8] text-sm sm:text-[15px] leading-relaxed mb-7 sm:mb-8 max-w-[430px] font-light drop-shadow-sm">
            {heroSubtitle}
          </p>

          {/* CTA Button */}
          <div>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2.5 bg-white text-[#183D2B] hover:bg-[#F7F5EF] px-8 py-3.5 sm:py-4 rounded-full text-[11px] sm:text-xs font-extrabold tracking-[0.14em] uppercase transition-all duration-200 shadow-md hover:shadow-2xl hover:-translate-y-0.5 group"
            >
              <span>{cleanCtaText}</span>
              <ArrowRight size={15} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
