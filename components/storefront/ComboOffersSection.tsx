"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Layers, ShoppingBag } from "lucide-react";
import ComboCard from "@/components/product/ComboCard";
import { ComboOffer } from "@/types/combo";

export default function ComboOffersSection() {
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  if (loading || combos.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-[#FAF8F5] via-[#F5EFE6] to-[#FAF8F5] border-y border-[#DCCFB9]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#DCCFB9]/60 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#102D20] text-white text-[10.5px] font-bold uppercase tracking-widest rounded-full shadow-xs border border-[#C9A84C]/40">
              <Sparkles size={11} className="text-[#C9A84C]" />
              <span>Value Bundles</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#183D2B] font-serif">
              Curated Combo Offers
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6460]">
              Complete daily regimens bundled for maximum synergy and exclusive retail savings.
            </p>
          </div>

          <Link
            href="/shop?category=combos"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183D2B] hover:text-[#C9A84C] transition-colors group self-start sm:self-auto"
          >
            <span>Explore All Combos</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </div>
    </section>
  );
}
