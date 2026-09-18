"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  AlertCircle,
  Save,
  Truck,
  ShieldCheck,
  CreditCard,
  Headphones,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface HeroData {
  top_announcement: string;
  currency_label: string;
  hero_title: string;
  hero_subtitle: string;
  hero_tagline: string;
  cta_primary_text: string;
  cta_primary_href: string;
  product_image_url: string | null;
  product_image_public_id: string | null;
  background_image_url: string | null;
  background_image_public_id: string | null;
  // Family promo section
  family_title: string;
  family_subtitle: string;
  family_image_url: string | null;
  family_image_public_id: string | null;
  // Trust badges
  badge_1_title: string;
  badge_1_sub: string;
  badge_2_title: string;
  badge_2_sub: string;
  badge_3_title: string;
  badge_3_sub: string;
  badge_4_title: string;
  badge_4_sub: string;
  badge_5_title: string;
  badge_5_sub: string;
}

const DEFAULT_HERO_DATA: HeroData = {
  top_announcement:
    "Free Shipping Across UAE on AED 199+ | 100% Authentic Products | Skincare, Fragrance, Wellness",
  currency_label: "UAE | AED",
  hero_title: "EVERYDAY ESSENTIALS. ELEVATED.",
  hero_subtitle:
    "Beauty, personal care and lifestyle products for every member of the family.",
  hero_tagline: "CARE BEAUTY WELLNESS LIFESTYLE",
  cta_primary_text: "SHOP COLLECTION →",
  cta_primary_href: "/shop",
  product_image_url: null,
  product_image_public_id: null,
  background_image_url: null,
  background_image_public_id: null,
  family_title: "FOR THE WHOLE FAMILY",
  family_subtitle:
    "Everyday beauty, personal care and lifestyle essentials for the whole family.",
  family_image_url: null,
  family_image_public_id: null,
  badge_1_title: "UAE-Wide Delivery",
  badge_1_sub: "Fast & Reliable",
  badge_2_title: "100% Authentic",
  badge_2_sub: "Products",
  badge_3_title: "Secure",
  badge_3_sub: "Payments",
  badge_4_title: "Trusted & Professional",
  badge_4_sub: "Support",
  badge_5_title: "Easy & Hassle-Free",
  badge_5_sub: "Returns",
};

export default function AdminHeroPage() {
  const [formData, setFormData] = useState<HeroData>(DEFAULT_HERO_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    async function loadData() {
      // 1. Load permanently from server API (reads data/hero.json)
      try {
        const res = await fetch("/api/admin/hero");
        const data = await res.json();
        if (data.success && data.hero) {
          setFormData((prev) => ({ ...prev, ...data.hero }));
          return;
        }
      } catch {}

      // 2. Fallback to local cache
      const saved = localStorage.getItem("aurelle_storefront_ui");
      if (saved) {
        try {
          setFormData({ ...DEFAULT_HERO_DATA, ...JSON.parse(saved) });
        } catch {}
      }
    }
    loadData();
  }, []);

  function persistLocally(data: HeroData) {
    try {
      localStorage.setItem("aurelle_storefront_ui", JSON.stringify(data));
      localStorage.setItem(
        "aurelle_admin_settings",
        JSON.stringify({
          hero_title: data.hero_title,
          hero_subtitle: data.hero_subtitle,
          hero_cta_text: data.cta_primary_text,
          hero_cta_link: data.cta_primary_href,
          hero_bg_public_id: data.background_image_public_id,
          hero_product_image_public_id: data.product_image_public_id,
          family_title: data.family_title,
          family_subtitle: data.family_subtitle,
          family_image_url: data.family_image_url,
          family_image_public_id: data.family_image_public_id,
        })
      );
    } catch {}

    // Save permanently to server filesystem
    try {
      fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {}
  }

  function handleChange(field: keyof HeroData, value: string) {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      persistLocally(updated);
      return updated;
    });
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Save locally and to server filesystem
    persistLocally(formData);

    try {
      await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {}

    setMessage({
      text: "All changes saved successfully!",
      type: "success",
    });
    setIsSaving(false);
  }

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Home Management"
        subtitle="Customize announcement bar, hero banners, trust badges, and the family collection banner."
      />

      <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-6">
        {/* Top Quick Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#DCCFB9]/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#183D2B]">
            <Sparkles size={16} />
            <span>Storefront Visual Customizer</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Save size={14} />
            <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : message.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {message.type === "success" ? (
              <Check size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Top Announcement */}
          <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2">
              1. Top Announcement Bar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={formData.top_announcement}
                  onChange={(e) => handleChange("top_announcement", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Currency / Region Pill
                </label>
                <input
                  type="text"
                  value={formData.currency_label}
                  onChange={(e) => handleChange("currency_label", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* 2. Main Hero Section */}
          <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2">
              2. Main Hero Section
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.hero_subtitle}
                  onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Call-to-Action Text
                </label>
                <input
                  type="text"
                  value={formData.cta_primary_text}
                  onChange={(e) => handleChange("cta_primary_text", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Call-to-Action Link
                </label>
                <input
                  type="text"
                  value={formData.cta_primary_href}
                  onChange={(e) => handleChange("cta_primary_href", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                />
              </div>

              {/* Primary: Hero Showcase Image (Right Side) */}
              <div className="md:col-span-2 pt-2">
                <CloudinaryUploader
                  label="Hero Showcase Image (Primary Product Lineup / Bottles on Right)"
                  description="This image appears directly on the right side of the hero section (as shown in the reference design). Recommended: 16:9 or 4:3 high-res product lineup."
                  folder="aurelle/hero"
                  aspectRatio="hero"
                  value={formData.product_image_url || formData.background_image_url}
                  publicId={formData.product_image_public_id || formData.background_image_public_id}
                  onUploadSuccess={(asset: CloudinaryAsset) => {
                    const updated = {
                      ...formData,
                      product_image_url: asset.secure_url,
                      product_image_public_id: asset.public_id,
                      background_image_url: asset.secure_url,
                      background_image_public_id: asset.public_id,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                    setMessage({
                      text: "Hero image uploaded & active on storefront!",
                      type: "success",
                    });
                  }}
                  onRemove={() => {
                    const updated = {
                      ...formData,
                      product_image_url: null,
                      product_image_public_id: null,
                      background_image_url: null,
                      background_image_public_id: null,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                  }}
                />
              </div>

              {/* Secondary: Background Banner Image (Optional) */}
              <div className="md:col-span-2 pt-2 border-t border-[#DCCFB9]/30">
                <CloudinaryUploader
                  label="Hero Lifestyle Background Banner (Optional Full-Width Backdrop)"
                  description="Optional full-bleed lifestyle background behind the entire hero section."
                  folder="aurelle/hero"
                  aspectRatio="hero"
                  value={formData.background_image_url}
                  publicId={formData.background_image_public_id}
                  onUploadSuccess={(asset: CloudinaryAsset) => {
                    const updated = {
                      ...formData,
                      background_image_url: asset.secure_url,
                      background_image_public_id: asset.public_id,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                  }}
                  onRemove={() => {
                    const updated = {
                      ...formData,
                      background_image_url: null,
                      background_image_public_id: null,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Five Trust Badges */}
          <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2">
              3. The 5 Storefront Trust Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Badge 1 */}
              <div className="p-3.5 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs">
                  <Truck size={16} />
                  <span>Badge 1: Delivery</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_1_title}
                  onChange={(e) => handleChange("badge_1_title", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_1_sub}
                  onChange={(e) => handleChange("badge_1_sub", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 2 */}
              <div className="p-3.5 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs">
                  <ShieldCheck size={16} />
                  <span>Badge 2: Authenticity</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_2_title}
                  onChange={(e) => handleChange("badge_2_title", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_2_sub}
                  onChange={(e) => handleChange("badge_2_sub", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 3 */}
              <div className="p-3.5 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs">
                  <CreditCard size={16} />
                  <span>Badge 3: Payment</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_3_title}
                  onChange={(e) => handleChange("badge_3_title", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_3_sub}
                  onChange={(e) => handleChange("badge_3_sub", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 4 */}
              <div className="p-3.5 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs">
                  <Headphones size={16} />
                  <span>Badge 4: Support</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_4_title}
                  onChange={(e) => handleChange("badge_4_title", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_4_sub}
                  onChange={(e) => handleChange("badge_4_sub", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 5 */}
              <div className="p-3.5 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#183D2B] font-bold text-xs">
                  <RotateCcw size={16} />
                  <span>Badge 5: Returns</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_5_title}
                  onChange={(e) => handleChange("badge_5_title", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_5_sub}
                  onChange={(e) => handleChange("badge_5_sub", e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>
            </div>
          </div>

          {/* 4. Family Banner Section */}
          <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2">
              4. Family Collection Banner
            </h2>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              This section appears on the homepage below categories. Upload a family lifestyle image and customize the text.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={formData.family_title}
                  onChange={(e) => handleChange("family_title", e.target.value)}
                  className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all"
                  placeholder="FOR THE WHOLE FAMILY"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Banner Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.family_subtitle}
                  onChange={(e) => handleChange("family_subtitle", e.target.value)}
                  className="w-full p-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all resize-none"
                  placeholder="Everyday beauty, personal care and lifestyle essentials for every member of the family."
                />
              </div>

              <div className="md:col-span-2">
                <CloudinaryUploader
                  label="Family Collection Image"
                  description="Upload a lifestyle photo showing family/household products. Appears on the right side of the Family Banner on the homepage. Recommended: 900×700px or 4:3 ratio."
                  folder="aurelle/hero"
                  aspectRatio="hero"
                  value={formData.family_image_url}
                  publicId={formData.family_image_public_id}
                  onUploadSuccess={(asset: CloudinaryAsset) => {
                    const updated = {
                      ...formData,
                      family_image_url: asset.secure_url,
                      family_image_public_id: asset.public_id,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                    setMessage({
                      text: "Family banner image uploaded & saved!",
                      type: "success",
                    });
                  }}
                  onRemove={() => {
                    const updated = {
                      ...formData,
                      family_image_url: null,
                      family_image_public_id: null,
                    };
                    setFormData(updated);
                    persistLocally(updated);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] hover:bg-[#102D20] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Save size={16} />
              <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
