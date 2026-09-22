"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export interface CategoryWithImages {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  image_url: string | null;
  image_public_id: string | null;
  subcategories: { name: string; slug: string }[];
}

interface Props {
  initialCategories: CategoryWithImages[];
}

export default function CategoriesPageClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<CategoryWithImages[]>(initialCategories);

  // Sync with localStorage so newly uploaded admin images show up live immediately
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aurelle_categories_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories((prev) =>
            prev.map((cat) => {
              const matched = parsed.find((p: { slug: string }) => p.slug === cat.slug);
              if (matched && (matched.image_public_id || matched.image_url)) {
                return {
                  ...cat,
                  image_public_id: matched.image_public_id || cat.image_public_id,
                  image_url: matched.image_url || cat.image_url,
                };
              }
              return cat;
            })
          );
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";

  if (!categories || categories.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16" aria-label="Loading categories">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden animate-pulse flex flex-col justify-between">
              <div className="h-48 sm:h-52 md:h-56 bg-[#F0EBE1]" />
              <div className="p-6 space-y-3">
                <div className="h-5 bg-[#F0EBE1] rounded-full w-2/3" />
                <div className="h-3 bg-[#F0EBE1] rounded-full w-full" />
                <div className="h-3 bg-[#F0EBE1] rounded-full w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {categories.map((category) => {
          const imageUrl = category.image_public_id
            ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800,h_550,c_fill,g_auto/${category.image_public_id}`
            : category.image_url ?? null;

          return (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              scroll={true}
              onClick={() => {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }}
              className="group bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs overflow-hidden hover:shadow-xl hover:border-[#183D2B]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* ── Visual Media Container ────────────────────────────── */}
                <div className="relative h-48 sm:h-52 md:h-56 bg-gradient-to-br from-[#F4EDE2] to-[#E5D8C8] overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    /* Fallback Letter Avatar */
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDE8DE] to-[#D9CEBF]">
                      <span className="font-serif text-5xl sm:text-6xl font-light text-[#183D2B]/25 select-none group-hover:scale-110 transition-transform duration-500">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Soft Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />

                  {/* Top Badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#183D2B] text-[11px] font-extrabold tracking-widest shadow-xs">
                      #{String(category.sort_order).padStart(2, "0")}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white/95 text-[10px] font-semibold tracking-wider uppercase">
                      <Sparkles size={11} className="text-[#C9A84C]" />
                      <span>Collection</span>
                    </span>
                  </div>
                </div>

                {/* ── Content Details ────────────────────────────────────── */}
                <div className="p-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1D211F] group-hover:text-[#183D2B] transition-colors mb-2 leading-tight tracking-tight">
                    {category.name}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-[#5C6460] leading-relaxed mb-5 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Subcategories preview chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <span
                        key={sub.slug}
                        className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DCCFB9]/60 text-[11px] font-medium text-[#5C6460] rounded-full group-hover:border-[#183D2B]/30 transition-colors"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {category.subcategories.length > 4 && (
                      <span className="px-2 py-1 bg-[#F4EDE2]/70 text-[10px] font-bold text-[#8E9590] rounded-full">
                        +{category.subcategories.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer CTA ─────────────────────────────────────────── */}
              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center justify-between pt-4 border-t border-[#DCCFB9]/35 text-[#183D2B] text-xs font-bold uppercase tracking-wider group-hover:text-[#C9A84C] transition-colors">
                  <span>Explore Collection</span>
                  <div className="w-8 h-8 rounded-full bg-[#183D2B]/5 group-hover:bg-[#183D2B] group-hover:text-white flex items-center justify-center transition-all duration-300">
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
