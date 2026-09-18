import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, Heart, Globe } from "lucide-react";

export const metadata = {
  title: "About Aurelle | Aurelle Cosmetics Trading FZ-LLC",
  description:
    "Learn about Aurelle Cosmetics Trading FZ-LLC, our Dubai heritage, formulation ethos, and commitment to elevating everyday beauty and wellness.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#FAF8F5] min-h-screen py-12 md:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Editorial Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Our Heritage & Purpose
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-[#1D211F] tracking-tight">
            Everyday Essentials. Elevated.
          </h1>
          <p className="text-base sm:text-lg text-[#5C6460] font-serif italic leading-relaxed">
            “True luxury lies in the elevation of everyday moments — the morning wash, the spritz of oud, the soothing restorative oil.”
          </p>
        </div>

        {/* Narrative Section 1 */}
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 p-8 sm:p-12 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
              Founded in Dubai, UAE
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#1D211F]">
              Born From a Desire for Daily Perfection
            </h2>
            <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed">
              Headquartered in the vibrant cosmetic trade hub of Dubai, <strong>Aurelle Cosmetics Trading FZ-LLC</strong> was established to bridge the gap between unattainable high-glamour cosmetics and basic utilitarian hygiene.
            </p>
            <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed">
              We believe that every product entering your home — whether a hydrating peptide serum, an artisanal linen mist, or a tear-free infant wash — should inspire calm, confidence, and sensorial pleasure.
            </p>
          </div>

          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-[#F7F5EF] border border-[#DCCFB9]/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
              alt="Aurelle formulation aesthetic"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 4 Brand Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              Elevated Formulations
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Dermatologist-developed bio-actives, cold-pressed botanicals, and high-potency marine collagens.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              100% Authentic Sourcing
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Every single product is verified, batch-tested, and tracked with full chain-of-custody documentation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <Globe size={20} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              Built for the Gulf
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Formulated specifically to endure air-conditioning dryness, intense sun exposure, and regional humidity.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <Heart size={20} />
            </div>
            <h3 className="font-serif font-bold text-base text-[#1D211F]">
              Family-Centric
            </h3>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Safe, gentle, and cruelty-free options crafted for infants, adolescents, and adults alike.
            </p>
          </div>
        </div>

        {/* CTA Card */}
        <div className="bg-[#183D2B] text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-md">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Experience Aurelle Today
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            Discover our collection of 10 thoughtfully curated categories or connect with our commercial wholesale division.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/shop"
              className="px-6 py-3 bg-[#C9A84C] text-[#102D20] font-bold text-xs uppercase tracking-wider rounded-full hover:bg-amber-400 transition-colors"
            >
              Shop The Collection
            </Link>
            <Link
              href="/wholesale"
              className="px-6 py-3 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-full hover:bg-white/20 border border-white/20 transition-colors"
            >
              Wholesale Opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
