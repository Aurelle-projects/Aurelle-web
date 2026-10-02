"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ComboCard from "@/components/product/ComboCard";
import { ComboOffer } from "@/types/combo";

interface ComboOffersSectionProps {
  initialCombos?: ComboOffer[];
}

export default function ComboOffersSection({ initialCombos }: ComboOffersSectionProps) {
  const [combos, setCombos] = useState<ComboOffer[]>(initialCombos || []);
  const [loading, setLoading] = useState(!initialCombos);

  useEffect(() => {
    if (initialCombos && initialCombos.length > 0) return;

    async function loadFeaturedCombos() {
      try {
        const res = await fetch("/api/combos?featured=true&limit=6");
        const data = await res.json();
        if (res.ok && data.combos && data.combos.length > 0) {
          setCombos(data.combos);
        } else {
          // Fallback to any active combos
          const fallbackRes = await fetch("/api/combos?limit=6");
          const fallbackData = await fallbackRes.json();
          if (fallbackRes.ok && fallbackData.combos) {
            setCombos(fallbackData.combos);
          }
        }
      } catch (err) {
        console.error("[ComboOffersSection] Failed to load combos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedCombos();
  }, [initialCombos]);

  const homepageCombos = combos.slice(0, 4);

  // If loading or no active combos, do not render the section
  if (loading || homepageCombos.length === 0) {
    return null;
  }

  const count = homepageCombos.length;

  return (
    <section
      className="py-6 sm:py-10 md:py-14 bg-[#FAF8F5] border-y border-[#EDE9DF]"
      aria-labelledby="curated-combos-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-3 sm:mb-6 md:mb-7">
          <div className="max-w-xl">
            <p className="text-[14px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#183D2B] mb-0.5 sm:mb-1.5">
              Curated Combinations
            </p>
            <h2
              id="curated-combos-heading"
              className="text-xl sm:text-2xl md:text-3xl font-normal text-[#14231B] leading-tight"
            >
              Thoughtfully paired for better routines.
            </h2>
            <p className="hidden sm:block text-xs sm:text-sm text-[#5C6460] mt-1.5 leading-relaxed">
              Discover carefully selected product combinations designed to complement your everyday beauty routine — with exclusive savings.
            </p>
          </div>

          <Link
            href="/combos"
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold text-[#183D2B] hover:text-[#C9A84C] transition-colors group self-start sm:self-end pb-0.5 whitespace-nowrap mt-0.5 sm:mt-0"
          >
            <span>Explore all combos</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Dynamic Layout Based on Active Combos Count */}
        {count === 1 && homepageCombos[0] ? (
          /* Single Combo: Centered feature card with controlled width */
          <div className="max-w-md sm:max-w-lg mx-auto">
            <ComboCard combo={homepageCombos[0]} />
          </div>
        ) : count === 2 ? (
          /* Two Combos: 2-column layout (2x1 on mobile, 2 cols on desktop) */
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6 justify-center">
            {homepageCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : count === 3 ? (
          /* Three Combos: 2 cols on mobile (2+1), 3 cols on desktop */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
            {homepageCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          /* Four Combos: 2x2 grid on mobile, 2 cols on tablet, 4 cols on desktop */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {homepageCombos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
