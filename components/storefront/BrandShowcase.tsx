"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ShowcaseImage {
  url: string | null;
  public_id?: string | null;
}

interface BrandShowcaseProps {
  heading?: string | null;
  description?: string | null;
  images?: ShowcaseImage[];
}

export default function BrandShowcase({
  heading,
  description,
  images = [],
}: BrandShowcaseProps) {
  // Filter valid image URLs
  const validImages = images.filter((img) => img && Boolean(img.url));

  // If no content has been configured by admin, do not render
  if (!heading && !description && validImages.length === 0) {
    return null;
  }

  // Ensure 6 slots for the 3x2 grid if images exist
  const displayImages = validImages.slice(0, 6);

  // Parse multi-part headings separated by '|'
  const rawParts = (heading || "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const mainHeading = rawParts[0] || heading || "Effortless Beauty For Every Occasion";
  const featurePillars = rawParts.slice(1);

  // Parse description and extract CTA button if present
  let cleanDesc = description || "";
  let ctaText = "Explore the Aurelle Collection";
  let hasCustomCta = false;

  if (cleanDesc) {
    // Check if description ends with a call to action line like "Explore the Aurelle Collection"
    const ctaMatch = cleanDesc.match(
      /(?:Explore\s+the\s+Aurelle\s+Collection|Explore\s+the\s+Collection|Shop\s+the\s+Collection|Discover\s+More)\s*$/i
    );
    if (ctaMatch) {
      ctaText = ctaMatch[0].trim();
      hasCustomCta = true;
      cleanDesc = cleanDesc.slice(0, ctaMatch.index).trim();
    }
  }

  return (
    <section className="bg-white py-12 md:py-20 lg:py-24 border-t border-[#EDE9DF]/60" aria-labelledby="showcase-heading">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-20 items-center">
          {/* Left Column: 6-Image Editorial Mosaic (3 columns x 2 rows) */}
          {displayImages.length > 0 && (
            <div className="lg:col-span-7 xl:col-span-7">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 overflow-hidden rounded-2xl p-1 bg-[#FAF8F5] border border-[#EDE9DF]">
                {displayImages.map((item, index) => (
                  <div
                    key={index}
                    className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#F0EBE1] shadow-2xs group"
                  >
                    {item.url && (
                      <Image
                        src={item.url}
                        alt={`${mainHeading} image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 25vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Luxury Editorial Content */}
          <div
            className={`${
              displayImages.length > 0
                ? "lg:col-span-5 xl:col-span-5"
                : "lg:col-span-10 text-center max-w-2xl mx-auto"
            } flex flex-col justify-center space-y-6`}
          >
            {/* Editorial Accent */}
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-[1.5px] bg-[#183D2B]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#183D2B]">
                Curated by Aurelle
              </span>
            </div>

            {/* Primary Headline in Luxury Serif Font */}
            <h2
              id="showcase-heading"
              className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1D211F] tracking-tight leading-[1.18]"
            >
              {mainHeading}
            </h2>

            {/* Clean Description */}
            {cleanDesc && (
              <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed">
                {cleanDesc}
              </p>
            )}

            {/* Feature Pillars (Formatted from the client's '|' lines) */}
            {featurePillars.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-[#EDE9DF]">
                {featurePillars.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline gap-3 text-xs sm:text-sm text-[#1D211F]"
                  >
                    <span className="text-[#183D2B] font-serif text-base font-light select-none">
                      —
                    </span>
                    <span className="font-medium tracking-wide leading-relaxed text-[#2D332F]">
                      {pillar}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Luxury Call to Action Button */}
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-widest rounded-md shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <span>{ctaText}</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
