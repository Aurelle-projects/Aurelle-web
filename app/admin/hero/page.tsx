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
  // Mobile-specific banner image
  mobile_image_url: string | null;
  mobile_image_public_id: string | null;
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
  // Promotional dual banners
  promo_left_tagline: string;
  promo_left_title: string;
  promo_left_discount: string;
  promo_left_btn_text: string;
  promo_left_btn_link: string;
  promo_left_image_url: string | null;
  promo_left_image_public_id: string | null;
  promo_right_tagline: string;
  promo_right_title: string;
  promo_right_discount: string;
  promo_right_btn_text: string;
  promo_right_btn_link: string;
  promo_right_image_url: string | null;
  promo_right_image_public_id: string | null;
  // Showcase section (6 images + text)
  showcase_heading: string;
  showcase_description: string;
  showcase_image_1_url: string | null;
  showcase_image_1_public_id: string | null;
  showcase_image_2_url: string | null;
  showcase_image_2_public_id: string | null;
  showcase_image_3_url: string | null;
  showcase_image_3_public_id: string | null;
  showcase_image_4_url: string | null;
  showcase_image_4_public_id: string | null;
  showcase_image_5_url: string | null;
  showcase_image_5_public_id: string | null;
  showcase_image_6_url: string | null;
  showcase_image_6_public_id: string | null;
  home_banner_1_url: string | null;
  home_banner_1_public_id: string | null;
  home_banner_1_link: string;
  home_banner_2_url: string | null;
  home_banner_2_public_id: string | null;
  home_banner_2_link: string;
}

const DEFAULT_HERO_DATA: HeroData = {
  top_announcement: "",
  currency_label: "",
  hero_title: "",
  hero_subtitle: "",
  hero_tagline: "",
  cta_primary_text: "",
  cta_primary_href: "",
  product_image_url: null,
  product_image_public_id: null,
  background_image_url: null,
  background_image_public_id: null,
  mobile_image_url: null,
  mobile_image_public_id: null,
  family_title: "",
  family_subtitle: "",
  family_image_url: null,
  family_image_public_id: null,
  badge_1_title: "",
  badge_1_sub: "",
  badge_2_title: "",
  badge_2_sub: "",
  badge_3_title: "",
  badge_3_sub: "",
  badge_4_title: "",
  badge_4_sub: "",
  badge_5_title: "",
  badge_5_sub: "",
  promo_left_tagline: "",
  promo_left_title: "",
  promo_left_discount: "",
  promo_left_btn_text: "",
  promo_left_btn_link: "",
  promo_left_image_url: null,
  promo_left_image_public_id: null,
  promo_right_tagline: "",
  promo_right_title: "",
  promo_right_discount: "",
  promo_right_btn_text: "",
  promo_right_btn_link: "",
  promo_right_image_url: null,
  promo_right_image_public_id: null,
  showcase_heading: "",
  showcase_description: "",
  showcase_image_1_url: null,
  showcase_image_1_public_id: null,
  showcase_image_2_url: null,
  showcase_image_2_public_id: null,
  showcase_image_3_url: null,
  showcase_image_3_public_id: null,
  showcase_image_4_url: null,
  showcase_image_4_public_id: null,
  showcase_image_5_url: null,
  showcase_image_5_public_id: null,
  showcase_image_6_url: null,
  showcase_image_6_public_id: null,
  home_banner_1_url: null,
  home_banner_1_public_id: null,
  home_banner_1_link: "",
  home_banner_2_url: null,
  home_banner_2_public_id: null,
  home_banner_2_link: "",
};

type LinkType = "shop" | "category" | "subcategory" | "product";

interface LinkPickerProps {
  value: string;
  onChange: (val: string) => void;
}

function LinkPicker({ value, onChange }: LinkPickerProps) {
  const [type, setType] = React.useState<LinkType>("shop");
  const [categories, setCategories] = React.useState<{ id: string; name: string; slug: string }[]>([]);
  const [subcategories, setSubcategories] = React.useState<{ id: string; name: string; slug: string; parent_id: string }[]>([]);
  const [products, setProducts] = React.useState<{ id: string; name: string; slug: string; category_id: string | null; subcategory_id: string | null }[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [productCategoryId, setProductCategoryId] = React.useState("");

    // Derive type from saved value on first render
  React.useEffect(() => {
    if (!value || value === "/shop") { setType("shop"); return; }
    if (value.startsWith("/shop?category=")) { setType("category"); return; }
    if (value.startsWith("/shop?subcategory=")) { setType("subcategory"); return; }
    if (value.startsWith("/products/")) { setType("product"); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const selectedProduct = products.find((product) => value === `/products/${product.slug}`);
    if (selectedProduct) setProductCategoryId(selectedProduct.category_id ?? "");
  }, [products, value]);

  // Fetch from admin APIs (service-role key, bypasses RLS)
  React.useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/products"),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        if (catData.success) {
          setCategories(catData.categories ?? []);
          setSubcategories(catData.subcategories ?? []);
        }
        if (prodData.success) setProducts(prodData.products ?? []);
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const filteredProducts = products.filter((product) => product.category_id === productCategoryId);

  const selectClass = "w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B]";

  return (
    <div className="space-y-2">
      {/* Type picker */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
        {(["shop", "category", "subcategory", "product"] as LinkType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              if (t === "shop") onChange("/shop");
            }}
            className={`w-full px-2.5 py-2 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${
              type === t
                ? "bg-[#183D2B] text-white border-[#183D2B]"
                : "bg-white text-[#5C6460] border-[#DCCFB9] hover:border-[#183D2B]"
            }`}
          >
            {t === "shop" ? "All Shop" : t}
          </button>
        ))}
      </div>

      {/* Dropdown for category / subcategory / product */}
      {type === "category" && (
        <select
          className={selectClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!loaded}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={`/shop?category=${c.slug}`}>{c.name}</option>
          ))}
        </select>
      )}
      {type === "subcategory" && (
        <select
          className={selectClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!loaded}
        >
          <option value="">Select Subcategory</option>
          {subcategories.map((s) => (
            <option key={s.id} value={`/shop?subcategory=${s.slug}`}>{s.name}</option>
          ))}
        </select>
      )}
      {type === "product" && (
        <div className="space-y-2 w-full">
          <select
            className={selectClass}
            value={productCategoryId}
            onChange={(e) => {
              setProductCategoryId(e.target.value);
              onChange("");
            }}
            disabled={!loaded}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            className={`${selectClass} ${productCategoryId ? "bg-white" : "bg-[#F7F5EF] text-[#8C938F] cursor-not-allowed"}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!productCategoryId || !loaded || filteredProducts.length === 0}
          >
            <option value="">
              {!productCategoryId
                ? "Select a category first"
                : filteredProducts.length === 0
                  ? "No products in this category"
                  : "Select Product"}
            </option>
            {filteredProducts.map((product) => (
              <option key={product.id} value={`/products/${product.slug}`}>{product.name}</option>
            ))}
          </select>
        </div>
      )}

    </div>
  );
}

interface BannerProductPickerProps {
  value: string;
  onChange: (value: string) => void;
}

function BannerProductPicker({ value, onChange }: BannerProductPickerProps) {
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = React.useState<{ id: string; name: string; slug: string; category_id: string | null }[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/products"),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        if (catData.success) setCategories(catData.categories ?? []);
        if (prodData.success) setProducts(prodData.products ?? []);
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  React.useEffect(() => {
    const selectedProduct = products.find((product) => value === `/products/${product.slug}`);
    if (selectedProduct) setCategoryId(selectedProduct.category_id ?? "");
  }, [products, value]);

  const filteredProducts = products.filter((product) => product.category_id === categoryId);
  const selectClass = "w-full h-9 px-3 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B]";

  return (
    <div className="mt-3 space-y-2">
      <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider">
        Product Link
      </label>
      <select
        className={selectClass}
        value={categoryId}
        onChange={(event) => {
          setCategoryId(event.target.value);
          onChange("");
        }}
        disabled={!loaded}
      >
        <option value="">Select Category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <select
        className={`${selectClass} ${categoryId ? "bg-white" : "bg-[#F7F5EF] text-[#8C938F] cursor-not-allowed"}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!categoryId || !loaded || filteredProducts.length === 0}
      >
        <option value="">
          {!categoryId
            ? "Select a category first"
            : filteredProducts.length === 0
              ? "No products in this category"
              : "Select Product"}
        </option>
        {filteredProducts.map((product) => (
          <option key={product.id} value={`/products/${product.slug}`}>{product.name}</option>
        ))}
      </select>
    </div>
  );
}

export default function AdminHeroPage() {
  const [formData, setFormData] = useState<HeroData>(DEFAULT_HERO_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/hero");
        const data = await res.json();
        if (data.success && data.hero) {
          setFormData((prev) => ({ ...prev, ...data.hero }));
        }
      } catch {}
    }
    loadData();
  }, []);

  function handleChange(field: keyof HeroData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");
      setMessage({ text: "All changes saved successfully!", type: "success" });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Failed to save changes.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col pb-16">
      <AdminHeader
        title="Home Management"
        subtitle="Customize announcement bar, hero banners, trust badges, and the family collection banner."
      />

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Top Quick Bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#183D2B]">
            <span>Storefront Visual Customizer</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-all"
          >
            <Save size={13} />
            <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : message.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {message.type === "success" ? (
              <Check size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Top Announcement */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              1. Top Announcement Bar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={formData.top_announcement}
                  onChange={(e) => handleChange("top_announcement", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="Enter announcement message"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Currency / Region Pill
                </label>
                <input
                  type="text"
                  value={formData.currency_label}
                  onChange={(e) => handleChange("currency_label", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="e.g. UAE | AED"
                />
              </div>
            </div>
          </div>

          {/* 2. Main Hero Section */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              2. Main Hero Section
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Top Tagline / Overline (Small text above headline)
                </label>
                <input
                  type="text"
                  value={formData.hero_tagline}
                  onChange={(e) => handleChange("hero_tagline", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="e.g. NATURAL CARE FOR A BRIGHTER YOU"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.hero_title}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="Enter hero headline"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.hero_subtitle}
                  onChange={(e) => handleChange("hero_subtitle", e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all resize-none placeholder:text-[#8C938F]"
                  placeholder="Enter hero subtitle"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Call-to-Action Text
                </label>
                <input
                  type="text"
                  value={formData.cta_primary_text}
                  onChange={(e) => handleChange("cta_primary_text", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="Enter button text (e.g. SHOP COLLECTION)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Call-to-Action Link
                </label>
                <input
                  type="text"
                  value={formData.cta_primary_href}
                  onChange={(e) => handleChange("cta_primary_href", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="Enter button link (e.g. /shop)"
                />
              </div>

              {/* Hero Banner Images — 2-column: Desktop | Mobile */}
              <div className="md:col-span-2 pt-1">
                <p className="text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-2">Hero Banner Images</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Desktop Banner */}
                  <div>
                    <CloudinaryUploader
                      label="Desktop Banner"
                      description="Shown on tablet & desktop (≥768px). Recommended: 1920×1080 landscape."
                      folder="aurelle/hero"
                      aspectRatio="hero"
                      value={formData.background_image_url || formData.product_image_url}
                      publicId={formData.background_image_public_id || formData.product_image_public_id}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        const updated = {
                          ...formData,
                          background_image_url: asset.secure_url,
                          background_image_public_id: asset.public_id,
                          product_image_url: asset.secure_url,
                          product_image_public_id: asset.public_id,
                        };
                        setFormData(updated);
                        setMessage({ text: "Desktop banner uploaded & active!", type: "success" });
                      }}
                      onRemove={() => {
                        setFormData({
                          ...formData,
                          background_image_url: null,
                          background_image_public_id: null,
                          product_image_url: null,
                          product_image_public_id: null,
                        });
                      }}
                    />
                  </div>

                  {/* Mobile Banner */}
                  <div>
                    <CloudinaryUploader
                      label="Mobile Banner"
                      description="Shown on mobile only (<768px). Recommended: 9×16 portrait for best fit."
                      folder="aurelle/hero"
                      aspectRatio="hero"
                      value={formData.mobile_image_url}
                      publicId={formData.mobile_image_public_id}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        const updated = {
                          ...formData,
                          mobile_image_url: asset.secure_url,
                          mobile_image_public_id: asset.public_id,
                        };
                        setFormData(updated);
                        setMessage({ text: "Mobile banner uploaded & active!", type: "success" });
                      }}
                      onRemove={() => {
                        setFormData({
                          ...formData,
                          mobile_image_url: null,
                          mobile_image_public_id: null,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Five Trust Badges */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              3. The 5 Storefront Trust Badges
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Badge 1 */}
              <div className="p-3 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#183D2B] font-bold text-[11px]">
                  <Truck size={14} />
                  <span>Delivery Badge</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_1_title}
                  onChange={(e) => handleChange("badge_1_title", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_1_sub}
                  onChange={(e) => handleChange("badge_1_sub", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 2 */}
              <div className="p-3 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#183D2B] font-bold text-[11px]">
                  <ShieldCheck size={14} />
                  <span>Authenticity Badge</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_2_title}
                  onChange={(e) => handleChange("badge_2_title", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_2_sub}
                  onChange={(e) => handleChange("badge_2_sub", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 3 */}
              <div className="p-3 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#183D2B] font-bold text-[11px]">
                  <CreditCard size={14} />
                  <span>Payment Badge</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_3_title}
                  onChange={(e) => handleChange("badge_3_title", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_3_sub}
                  onChange={(e) => handleChange("badge_3_sub", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>

              {/* Badge 5 */}
              <div className="p-3 bg-[#F7F5EF]/60 rounded-lg border border-[#DCCFB9]/40 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#183D2B] font-bold text-[11px]">
                  <RotateCcw size={14} />
                  <span>Returns Badge</span>
                </div>
                <input
                  type="text"
                  value={formData.badge_5_title}
                  onChange={(e) => handleChange("badge_5_title", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none"
                  placeholder="Title"
                />
                <input
                  type="text"
                  value={formData.badge_5_sub}
                  onChange={(e) => handleChange("badge_5_sub", e.target.value)}
                  className="w-full h-7 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#5C6460] outline-none"
                  placeholder="Subtitle"
                />
              </div>
            </div>
          </div>

          {/* 4. Family Banner Section */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
              4. Family Collection Banner
            </h2>
            <p className="text-[11px] text-[#5C6460] leading-relaxed">
              This section appears on the homepage below categories. Upload a family lifestyle image and customize the text.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Banner Headline
                </label>
                <input
                  type="text"
                  value={formData.family_title}
                  onChange={(e) => handleChange("family_title", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                  placeholder="Enter banner headline"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Banner Subtitle
                </label>
                <textarea
                  rows={2}
                  value={formData.family_subtitle}
                  onChange={(e) => handleChange("family_subtitle", e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all resize-none placeholder:text-[#8C938F]"
                  placeholder="Enter banner subtitle"
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
                  }}
                />
              </div>
            </div>
          </div>

          {/* 5. Promotional Dual Banners (Storefront) */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
                5. Promotional Dual Banners (Storefront)
              </h2>
              <p className="text-[11px] text-[#5C6460] leading-relaxed mt-1">
                Configure the two side-by-side promotional campaign banners displayed on the homepage. Upload campaign model / product imagery and adjust text &amp; links.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left Banner: Primary Campaign */}
              <div className="p-4 bg-[#F9F8F5] rounded-xl border border-[#DCCFB9]/50 space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCCFB9]/40 pb-1.5">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#183D2B]">
                    Primary Banner
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Top Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.promo_left_tagline ?? ""}
                      onChange={(e) => handleChange("promo_left_tagline", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter subtitle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Main Title
                    </label>
                    <input
                      type="text"
                      value={formData.promo_left_title ?? ""}
                      onChange={(e) => handleChange("promo_left_title", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Discount / Offer
                    </label>
                    <input
                      type="text"
                      value={formData.promo_left_discount ?? ""}
                      onChange={(e) => handleChange("promo_left_discount", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter discount"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={formData.promo_left_btn_text ?? ""}
                      onChange={(e) => handleChange("promo_left_btn_text", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter button label"
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Button Link
                  </label>
                  <LinkPicker
                    value={formData.promo_left_btn_link ?? ""}
                    onChange={(val) => handleChange("promo_left_btn_link", val)}
                  />
                </div>

                <div className="pt-1">
                  <CloudinaryUploader
                    label="Upload Image"
                    description="Upload campaign visual for the primary banner. Transparent PNG / clean background recommended."
                    folder="aurelle/banners"
                    aspectRatio="hero"
                    value={formData.promo_left_image_url}
                    publicId={formData.promo_left_image_public_id}
                    onUploadSuccess={(asset: CloudinaryAsset) => {
                      const updated = {
                        ...formData,
                        promo_left_image_url: asset.secure_url,
                        promo_left_image_public_id: asset.public_id,
                      };
                      setFormData(updated);
                      setMessage({
                        text: "Primary banner image uploaded & saved!",
                        type: "success",
                      });
                    }}
                    onRemove={() => {
                      const updated = {
                        ...formData,
                        promo_left_image_url: null,
                        promo_left_image_public_id: null,
                      };
                      setFormData(updated);
                    }}
                  />
                </div>
              </div>

              {/* Right Banner: Secondary Campaign */}
              <div className="p-4 bg-[#F9F8F5] rounded-xl border border-[#DCCFB9]/50 space-y-3">
                <div className="flex items-center justify-between border-b border-[#DCCFB9]/40 pb-1.5">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#183D2B]">
                    Secondary Banner 
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Top Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.promo_right_tagline ?? ""}
                      onChange={(e) => handleChange("promo_right_tagline", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter subtitle"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Main Title
                    </label>
                    <input
                      type="text"
                      value={formData.promo_right_title ?? ""}
                      onChange={(e) => handleChange("promo_right_title", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter title"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Discount / Offer
                    </label>
                    <input
                      type="text"
                      value={formData.promo_right_discount ?? ""}
                      onChange={(e) => handleChange("promo_right_discount", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter discount"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={formData.promo_right_btn_text ?? ""}
                      onChange={(e) => handleChange("promo_right_btn_text", e.target.value)}
                      className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded text-xs text-[#1D211F] outline-none focus:border-[#183D2B] placeholder:text-[#8C938F]"
                      placeholder="Enter button label"
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                    Button Link
                  </label>
                  <LinkPicker
                    value={formData.promo_right_btn_link ?? ""}
                    onChange={(val) => handleChange("promo_right_btn_link", val)}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* 6. Homepage Two-Banner Section */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
                6. Homepage Banners (2 Images)
              </h2>
              <p className="text-[11px] text-[#5C6460] leading-relaxed mt-1">
                Upload up to two images for the homepage two-column banner section.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[1, 2].map((num) => {
                const urlKey = `home_banner_${num}_url` as keyof HeroData;
                const pidKey = `home_banner_${num}_public_id` as keyof HeroData;
                const linkKey = `home_banner_${num}_link` as keyof HeroData;

                return (
                  <div key={num} className="p-3 bg-[#F9F8F5] rounded-xl border border-[#DCCFB9]/50">
                    <CloudinaryUploader
                      label={`Banner ${num}`}
                      description="Homepage banner image"
                      folder="aurelle/home-banners"
                      aspectRatio="wide"
                      value={formData[urlKey] as string | null}
                      publicId={formData[pidKey] as string | null}
                      onUploadSuccess={(asset: CloudinaryAsset) => {
                        setFormData((prev) => ({
                          ...prev,
                          [urlKey]: asset.secure_url,
                          [pidKey]: asset.public_id,
                        }));
                      }}
                      onRemove={() => {
                        setFormData((prev) => ({
                          ...prev,
                          [urlKey]: null,
                          [pidKey]: null,
                        }));
                      }}
                    />
                    <BannerProductPicker
                      value={formData[linkKey] as string}
                      onChange={(value) => handleChange(linkKey, value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. Brand Showcase / Gallery Section (6 Images + Text) */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <div>
              <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-1.5">
                7. Brand Showcase / Timeless Glow (6 Images + Text)
              </h2>
              <p className="text-[11px] text-[#5C6460] leading-relaxed mt-1">
                Configure the homepage showcase section featuring a 6-image photo collage alongside your campaign heading and description.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Heading Title
                </label>
                <input
                  type="text"
                  value={formData.showcase_heading}
                  onChange={(e) => handleChange("showcase_heading", e.target.value)}
                  className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none placeholder:text-[#8C938F]"
                  placeholder="e.g. Timeless Glow"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                  Small Description
                </label>
                <textarea
                  rows={2}
                  value={formData.showcase_description}
                  onChange={(e) => handleChange("showcase_description", e.target.value)}
                  className="w-full p-2 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none resize-none placeholder:text-[#8C938F]"
                  placeholder="Enter Decription"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-2">
                Showcase Photo Grid (6 Images — 3 Top, 3 Bottom)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const urlKey = `showcase_image_${num}_url` as keyof HeroData;
                  const pidKey = `showcase_image_${num}_public_id` as keyof HeroData;
                  const labels = [
                    "Image 1 (Top Left)",
                    "Image 2 (Top Center)",
                    "Image 3 (Top Right)",
                    "Image 4 (Bottom Left)",
                    "Image 5 (Bottom Center)",
                    "Image 6 (Bottom Right)",
                  ];

                  return (
                    <div key={num} className="p-2.5 bg-[#F9F8F5] rounded-xl border border-[#DCCFB9]/50">
                      <CloudinaryUploader
                        label={labels[num - 1]}
                        description="Photo of product application / lifestyle"
                        folder="aurelle/showcase"
                        aspectRatio="square"
                        value={formData[urlKey] as string | null}
                        publicId={formData[pidKey] as string | null}
                        onUploadSuccess={(asset: CloudinaryAsset) => {
                          setFormData((prev) => ({
                            ...prev,
                            [urlKey]: asset.secure_url,
                            [pidKey]: asset.public_id,
                          }));
                        }}
                        onRemove={() => {
                          setFormData((prev) => ({
                            ...prev,
                            [urlKey]: null,
                            [pidKey]: null,
                          }));
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <Save size={14} />
              <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
