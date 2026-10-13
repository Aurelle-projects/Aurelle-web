import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Globe,
  Award,
  Leaf,
  Star,
  Smile,
  Truck,
  Gem,
  CheckCircle,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_ABOUT_SETTINGS,
  type AboutPageSettings,
} from "@/app/api/admin/about/route";

const SITE_URL = "https://aurellecosmeticshop.com";

export const revalidate = 60; // 60s cache

export async function generateMetadata() {
  try {
    const supabase = createAdminClient();
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "about_page")
      .maybeSingle();

    const settings: AboutPageSettings = {
      ...DEFAULT_ABOUT_SETTINGS,
      ...(data?.value || {}),
    };

    const title = settings.meta_title || DEFAULT_ABOUT_SETTINGS.meta_title;
    const description = settings.meta_description || DEFAULT_ABOUT_SETTINGS.meta_description;

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/about` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/about`,
        type: "website",
        images: [
          {
            url: settings.story_image_url || `${SITE_URL}/og-image.jpg`,
            width: 1200,
            height: 630,
            alt: "About Aurelle Cosmetics UAE",
          },
        ],
      },
    };
  } catch {
    return {
      title: DEFAULT_ABOUT_SETTINGS.meta_title,
      description: DEFAULT_ABOUT_SETTINGS.meta_description,
      alternates: { canonical: `${SITE_URL}/about` },
    };
  }
}

function renderPillarIcon(iconName: string) {
  const props = { size: 20 };
  switch (iconName) {
    case "ShieldCheck":
      return <ShieldCheck {...props} />;
    case "Globe":
      return <Globe {...props} />;
    case "Heart":
      return <Heart {...props} />;
    case "Award":
      return <Award {...props} />;
    case "Leaf":
      return <Leaf {...props} />;
    case "Star":
      return <Star {...props} />;
    case "Smile":
      return <Smile {...props} />;
    case "Truck":
      return <Truck {...props} />;
    case "Gem":
      return <Gem {...props} />;
    case "CheckCircle":
      return <CheckCircle {...props} />;
    case "Sparkles":
    default:
      return <Sparkles {...props} />;
  }
}

export default async function AboutPage() {
  let settings: AboutPageSettings = DEFAULT_ABOUT_SETTINGS;

  try {
    const supabase = createAdminClient();
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "about_page")
      .maybeSingle();

    if (data?.value) {
      settings = {
        ...DEFAULT_ABOUT_SETTINGS,
        ...data.value,
        pillars:
          Array.isArray(data.value.pillars) && data.value.pillars.length === 4
            ? data.value.pillars
            : DEFAULT_ABOUT_SETTINGS.pillars,
      };
    }
  } catch (err) {
    console.error("[AboutPage] Error fetching about_page settings:", err);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        {/* ─── Editorial Hero ─── */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          {settings.hero_badge && (
            <span className="inline-block px-3.5 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
              {settings.hero_badge}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#1D211F] tracking-tight">
            {settings.hero_title}
          </h1>
          {settings.hero_quote && (
            <p className="text-base sm:text-lg text-[#5C6460] font-serif italic leading-relaxed">
              {settings.hero_quote}
            </p>
          )}
        </div>

        {/* ─── Narrative Section ─── */}
        <div className="bg-white rounded-md border border-[#DCCFB9]/60 p-8 sm:p-12 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            {settings.story_tagline && (
              <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
                {settings.story_tagline}
              </span>
            )}
            <h2 className="text-2xl font-serif font-bold text-[#1D211F]">
              {settings.story_title}
            </h2>
            {settings.story_paragraph_1 && (
              <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed whitespace-pre-line">
                {settings.story_paragraph_1}
              </p>
            )}
            {settings.story_paragraph_2 && (
              <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed whitespace-pre-line">
                {settings.story_paragraph_2}
              </p>
            )}
          </div>

          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#F7F5EF] border border-[#DCCFB9]/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                settings.story_image_url ||
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
              }
              alt="Aurelle formulation aesthetic"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ─── 4 Brand Pillars ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {settings.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-sm border border-[#DCCFB9]/60 shadow-xs space-y-2.5 transition-all hover:shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                {renderPillarIcon(pillar.icon)}
              </div>
              <h3 className="font-serif font-bold text-base text-[#1D211F]">
                {pillar.title}
              </h3>
              <p className="text-xs text-[#5C6460] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* ─── CTA Card ─── */}
        <div className="bg-[#183D2B] text-white rounded-md p-8 sm:p-12 text-center space-y-4 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            {settings.cta_title}
          </h2>
          {settings.cta_description && (
            <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
              {settings.cta_description}
            </p>
          )}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={settings.cta_button_link || "/shop"}
              className="px-6 py-3 bg-[#C9A84C] text-[#102D20] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-amber-400 transition-colors shadow-sm"
            >
              {settings.cta_button_text || "Shop The Collection"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
