"use client";

import React from "react";
import Link from "next/link";
import { Building2, ArrowRight, ShieldCheck, Truck, PackageCheck } from "lucide-react";

export default function B2BHomeCTASection() {
  return (
    <section className="py-16 sm:py-20 bg-[#FAF8F5] border-t border-b border-[#EDE9DF]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#183D2B] text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
          {/* Subtle background decoration */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-amber-400/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-8 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs text-amber-200 text-xs font-bold uppercase tracking-widest border border-white/10">
                <Building2 size={14} />
                Are You a Business?
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-medium leading-tight text-white">
                Become an Aurelle Wholesale Partner
              </h2>

              <p className="text-sm sm:text-base text-neutral-200 max-w-2xl font-light leading-relaxed">
                Direct B2B beauty distribution, genuine cosmetics supply, low starter MOQs, and consolidated GCC logistics for verified pharmacies, salons, e-commerce stores, and retailers.
              </p>

              {/* Feature pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-200 bg-white/5 rounded-lg p-3 border border-white/10">
                  <ShieldCheck size={18} className="text-amber-300 shrink-0" />
                  <span>Verified GCC Trade Desk</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-200 bg-white/5 rounded-lg p-3 border border-white/10">
                  <PackageCheck size={18} className="text-amber-300 shrink-0" />
                  <span>Low Starter MOQs</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-200 bg-white/5 rounded-lg p-3 border border-white/10">
                  <Truck size={18} className="text-amber-300 shrink-0" />
                  <span>Consolidated GCC Logistics</span>
                </div>
              </div>
            </div>

            {/* Right Action Column */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center lg:items-end">
              <Link
                href="/wholesale/register"
                className="w-full sm:w-auto lg:w-full px-8 py-4 rounded-xl bg-white hover:bg-neutral-100 text-[#183D2B] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Apply for Wholesale Account</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/wholesale"
                className="w-full sm:w-auto lg:w-full px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all text-center"
              >
                Explore Wholesale Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
