"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  TrendingUp,
  ShoppingBag,
  Briefcase,
  Layers,
  Sliders,
  Package,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [stats] = useState({
    totalRevenue: "14,850",
    totalOrders: "42",
    totalCategories: "10",
    pendingWholesale: "3",
  });

  return (
    <div className="flex flex-col">
      <AdminHeader
        title="Executive Overview"
        subtitle="Real-time performance, catalog management, and operations for Aurelle Cosmetics Trading FZ-LLC."
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* ── 1. KPI Cards Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/50 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6460]">Gross Revenue</span>
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#C9A84C] flex items-center justify-center border border-amber-200/60">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1D211F] tracking-tight">AED {stats.totalRevenue}</div>
            <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
              <span>+18.4%</span>
              <span className="text-[#8E9590]">vs last month</span>
            </p>
          </div>

          {/* Orders */}
          <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/50 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6460]">Customer Orders</span>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-[#183D2B] flex items-center justify-center border border-emerald-200/60">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1D211F] tracking-tight">{stats.totalOrders}</div>
            <p className="text-xs font-medium text-emerald-600 mt-1">5 awaiting fulfillment</p>
          </div>

          {/* Categories */}
          <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/50 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6460]">Categories & Catalog</span>
              <div className="w-10 h-10 rounded-lg bg-[#A8B7A3]/20 text-[#183D2B] flex items-center justify-center border border-[#A8B7A3]/40">
                <Layers size={20} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1D211F] tracking-tight">{stats.totalCategories} Categories</div>
            <p className="text-xs font-medium text-[#5C6460] mt-1">50+ subcategories</p>
          </div>

          {/* Wholesale */}
          <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/50 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C6460]">Wholesale B2B</span>
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/60">
                <Briefcase size={20} />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-[#1D211F] tracking-tight">{stats.pendingWholesale} Pending</div>
            <p className="text-xs font-medium text-orange-600 mt-1">Trade licenses to review</p>
          </div>
        </div>

        {/* ── 2. Core Management Action Cards ─────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1D211F] tracking-tight">Catalog & Storefront Management</h2>
            <span className="text-xs text-[#5C6460]">Direct controls for all commerce assets</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Categories */}
            <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col justify-between hover:border-[#183D2B]/50 transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mb-3.5 group-hover:bg-[#183D2B] group-hover:text-white transition-colors">
                  <Layers size={22} />
                </div>
                <h3 className="text-base font-bold text-[#1D211F] mb-1.5">10 E-Commerce Categories</h3>
                <p className="text-xs text-[#5C6460] leading-relaxed mb-4">
                  Upload circular Cloudinary images for all 10 product categories: Cosmetics, Skincare, Hair Care, Baby Care, Perfumes, and more.
                </p>
              </div>
              <Link
                href="/admin/categories"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183D2B] group-hover:text-[#C9A84C] transition-colors pt-2 border-t border-[#DCCFB9]/30"
              >
                <span>Manage Categories & Upload Images</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 2: Hero & UI */}
            <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col justify-between hover:border-[#183D2B]/50 transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mb-3.5 group-hover:bg-[#183D2B] group-hover:text-white transition-colors">
                  <Sliders size={22} />
                </div>
                <h3 className="text-base font-bold text-[#1D211F] mb-1.5">Home Management</h3>
                <p className="text-xs text-[#5C6460] leading-relaxed mb-4">
                  Customize the top announcement bar, main hero headline, 5 trust badges, and promotional family banners directly from the UI mockup.
                </p>
              </div>
              <Link
                href="/admin/hero"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183D2B] group-hover:text-[#C9A84C] transition-colors pt-2 border-t border-[#DCCFB9]/30"
              >
                <span>Customize Storefront Visuals</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 3: Products */}
            <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col justify-between hover:border-[#183D2B]/50 transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mb-3.5 group-hover:bg-[#183D2B] group-hover:text-white transition-colors">
                  <Package size={22} />
                </div>
                <h3 className="text-base font-bold text-[#1D211F] mb-1.5">Products & Inventory</h3>
                <p className="text-xs text-[#5C6460] leading-relaxed mb-4">
                  Create and manage beauty products with multi-image Cloudinary upload, retail price, wholesale MOQ, and inventory tracking.
                </p>
              </div>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183D2B] group-hover:text-[#C9A84C] transition-colors pt-2 border-t border-[#DCCFB9]/30"
              >
                <span>Add New Product to Catalog</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Card 4: Wholesale */}
            <div className="bg-white p-5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex flex-col justify-between hover:border-[#183D2B]/50 transition-all group">
              <div>
                <div className="w-11 h-11 rounded-lg bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center mb-3.5 group-hover:bg-[#183D2B] group-hover:text-white transition-colors">
                  <Briefcase size={22} />
                </div>
                <h3 className="text-base font-bold text-[#1D211F] mb-1.5">B2B Wholesale Portal</h3>
                <p className="text-xs text-[#5C6460] leading-relaxed mb-4">
                  Review UAE company trade licenses, approve wholesale accounts, and grant tier discounts for retailers and pharmacies.
                </p>
              </div>
              <Link
                href="/admin/wholesale"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#183D2B] group-hover:text-[#C9A84C] transition-colors pt-2 border-t border-[#DCCFB9]/30"
              >
                <span>Review Wholesale Requests</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
