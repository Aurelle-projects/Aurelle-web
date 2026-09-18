"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface FamilyBannerProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string | null;
}

export default function FamilyBanner({
  title: initialTitle = "FOR THE WHOLE FAMILY",
  subtitle: initialSubtitle = "Everyday beauty, personal care and lifestyle essentials for every member of the family.",
  imageUrl: initialImageUrl,
}: FamilyBannerProps) {
  const [content, setContent] = useState({
    title: initialTitle,
    subtitle: initialSubtitle,
    imageUrl: initialImageUrl ?? null,
  });

  useEffect(() => {
    async function loadFamilyData() {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

      // 1. Try server API first (permanent data/hero.json)
      try {
        const res = await fetch("/api/admin/hero");
        const data = await res.json();
        if (data.success && data.hero) {
          const h = data.hero;
          if (h.family_title || h.family_image_public_id || h.family_image_url) {
            setContent({
              title: h.family_title || initialTitle,
              subtitle: h.family_subtitle || initialSubtitle,
              imageUrl: h.family_image_public_id
                ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_900,h_700,c_fill,g_auto/${h.family_image_public_id}`
                : h.family_image_url || null,
            });
            return;
          }
        }
      } catch {
        // Fall through to localStorage
      }

      // 2. Fallback: check localStorage (aurelle_storefront_ui has full data)
      try {
        const saved = localStorage.getItem("aurelle_storefront_ui");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.family_title || parsed.family_image_public_id || parsed.family_image_url) {
            setContent({
              title: parsed.family_title || initialTitle,
              subtitle: parsed.family_subtitle || initialSubtitle,
              imageUrl: parsed.family_image_public_id
                ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_900,h_700,c_fill,g_auto/${parsed.family_image_public_id}`
                : parsed.family_image_url || null,
            });
            return;
          }
        }
      } catch {
        // Ignore
      }

      // 3. Legacy fallback: aurelle_admin_settings
      try {
        const saved = localStorage.getItem("aurelle_admin_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.family_title || parsed.family_image_public_id) {
            setContent((prev) => ({
              title: parsed.family_title || prev.title,
              subtitle: parsed.family_subtitle || prev.subtitle,
              imageUrl: parsed.family_image_public_id
                ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_900,h_700,c_fill,g_auto/${parsed.family_image_public_id}`
                : prev.imageUrl,
            }));
          }
        }
      } catch {
        // Ignore
      }
    }

    loadFamilyData();
  }, [initialTitle, initialSubtitle]);

  return (
    <section className="bg-[#F7F5EF] py-12 md:py-16" aria-label="Family Collection">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-[#DCCFB9]/50 shadow-sm grid grid-cols-1 md:grid-cols-2">

          {/* Left: Text content */}
          <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12 lg:p-14">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#183D2B] bg-[#183D2B]/[0.07] px-3 py-1 rounded-full mb-4 w-fit">
              Lifestyle Collection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1D211F] leading-tight tracking-tight mb-3">
              {content.title}
            </h2>
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#5C6460] mb-7 max-w-md">
              {content.subtitle}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white px-6 py-3 rounded-full text-[11px] font-extrabold tracking-[0.12em] uppercase transition-all duration-200 hover:-translate-y-0.5 shadow-md shadow-[#183D2B]/20 w-fit"
            >
              <span>Explore Family Essentials</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Right: Image (uploaded via admin) or placeholder */}
          <div className="relative min-h-[260px] sm:min-h-[300px] md:min-h-[360px] bg-gradient-to-br from-[#EDE8DE] to-[#D9CEBF] flex items-center justify-center overflow-hidden">
            {content.imageUrl ? (
              <Image
                src={content.imageUrl}
                alt={content.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              /* Placeholder — admin uploads the family image */
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
                  <span className="text-2xl" aria-hidden="true">👨‍👩‍👧‍👦</span>
                </div>
                <div>
                  <p className="font-serif text-base font-bold text-[#183D2B]">AURELLE</p>
                  <p className="text-[10px] font-semibold tracking-widest text-[#8E9590] uppercase mt-1">
                    FAMILY CARE
                  </p>
                </div>
                <p className="text-[10px] text-[#8E9590] leading-relaxed mt-2 max-w-[180px]">
                  Upload family image via<br />Admin → Hero &amp; Storefront UI
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

