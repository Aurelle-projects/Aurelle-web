"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import ComboCard from "@/components/product/ComboCard";
import { ComboOffer } from "@/types/combo";

interface CombosListingClientProps {
  initialCombos?: ComboOffer[];
}

export default function CombosListingClient({ initialCombos }: CombosListingClientProps) {
  const [combos, setCombos] = useState<ComboOffer[]>(initialCombos || []);
  const [loading, setLoading] = useState(!initialCombos || initialCombos.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCombos && initialCombos.length > 0) return;

    let isMounted = true;

    async function loadAllCombos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/combos?limit=100");
        const data = await res.json();
        if (isMounted) {
          if (res.ok && Array.isArray(data.combos)) {
            setCombos(data.combos);
          } else {
            setError(data.error || "Failed to load combo offers");
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("[CombosListingPage] Failed to fetch combos:", err);
          setError("An error occurred while loading combo offers.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAllCombos();

    return () => {
      isMounted = false;
    };
  }, [initialCombos]);

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 sm:py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5C6460] mb-8 sm:mb-10">
          <Link href="/" className="hover:text-[#183D2B] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="font-semibold text-[#183D2B]">Combo Offers</span>
        </nav>

        {/* Editorial Page Header */}
        <div className="border-b border-[#EDE9DF] pb-8 sm:pb-10 mb-8 sm:mb-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#183D2B]">
              Curated Combinations
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-serif text-[#14231B] leading-tight font-normal">
              Curated combinations for your everyday routine.
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-[#5C6460] leading-relaxed pt-1">
              Discover thoughtfully paired products designed to work beautifully together — with exclusive bundle savings.
            </p>
          </div>
        </div>

        {/* Combos Content Area */}
        {loading ? (
          /* Elegant Luxury Skeleton Grid */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="h-4 w-32 bg-[#EDE9DF] rounded-xs animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-[#EDE9DF] overflow-hidden flex flex-col animate-pulse"
                >
                  <div className="aspect-[4/3] w-full bg-[#EFECE6]" />
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-[#EDE9DF] rounded-xs w-3/4" />
                      <div className="h-3 bg-[#EDE9DF] rounded-xs w-1/2" />
                    </div>
                    <div className="pt-3 border-t border-[#EDE9DF] flex items-center justify-between">
                      <div className="h-4 bg-[#EDE9DF] rounded-xs w-20" />
                      <div className="h-8 bg-[#EDE9DF] rounded-xs w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error && combos.length === 0 ? (
          /* Error State with Retry */
          <div className="bg-white border border-[#EDE9DF] p-10 sm:p-14 text-center max-w-lg mx-auto space-y-4 my-8">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <RefreshCw size={20} />
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1D211F]">
              Unable to Load Combos
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => {
                setLoading(true);
                fetch("/api/combos?limit=100")
                  .then((res) => res.json())
                  .then((data) => {
                    if (Array.isArray(data.combos)) setCombos(data.combos);
                  })
                  .catch(() => {})
                  .finally(() => setLoading(false));
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#14231B] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : combos.length === 0 ? (
          /* Refined Empty State */
          <div className="bg-white border border-[#EDE9DF] p-10 sm:p-16 text-center max-w-xl mx-auto space-y-5 my-8">
            <div className="w-14 h-14 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mx-auto">
              <Sparkles size={24} className="text-[#C9A84C]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-serif text-[#1D211F]">
                No Curated Combos Available Right Now
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6460] max-w-md mx-auto leading-relaxed">
                We are currently crafting new exclusive product bundles and routines. In the meantime, explore our individual beauty and skincare essentials.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider hover:bg-[#14231B] transition-colors"
              >
                <span>Explore All Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          /* Active Combos Grid */
          <div>
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#183D2B]">
                All Curated Combos ({combos.length})
              </span>
            </div>

            {/* Dynamic balanced grid layout */}
            {combos.length === 1 && combos[0] ? (
              /* Single Combo: Centered feature card */
              <div className="max-w-md sm:max-w-lg mx-auto">
                <ComboCard combo={combos[0]} />
              </div>
            ) : combos.length === 2 ? (
              /* Two Combos: Centered 2-column layout */
              <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8 justify-center">
                {combos.map((combo) => (
                  <ComboCard key={combo.id} combo={combo} />
                ))}
              </div>
            ) : (
              /* Three or more Combos: Responsive grid (2 cols mobile, 2 tablet, 3 desktop) */
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8">
                {combos.map((combo) => (
                  <ComboCard key={combo.id} combo={combo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
