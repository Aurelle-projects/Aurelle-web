"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import CloudinaryUploader, { CloudinaryAsset } from "@/components/admin/CloudinaryUploader";
import BannerLinkPicker from "@/components/admin/BannerLinkPicker";
import {
  Check,
  AlertCircle,
  Save,
  Truck,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
  ChevronRight,
} from "lucide-react";

export interface AdminHeroBanner {
  id: string;
  title: string;
  subtitle: string;
  overline: string;
  link_text: string;
  link_url: string;
  image_url: string | null;
  image_public_id: string | null;
  mobile_image_url: string | null;
  mobile_image_public_id: string | null;
  product_image_url: string | null;
  product_image_public_id: string | null;
  position: string;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

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

  React.useEffect(() => {
    if (!value || value === "/shop") { setType("shop"); return; }
    if (value.startsWith("/shop?category=")) { setType("category"); return; }
    if (value.startsWith("/shop?subcategory=")) { setType("subcategory"); return; }
    if (value.startsWith("/products/")) { setType("product"); return; }
  }, []);

  React.useEffect(() => {
    const selectedProduct = products.find((product) => value === `/products/${product.slug}`);
    if (selectedProduct) setProductCategoryId(selectedProduct.category_id ?? "");
  }, [products, value]);

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

export default function AdminHeroPage() {
  const [formData, setFormData] = useState<HeroData>(DEFAULT_HERO_DATA);
  const [heroBanners, setHeroBanners] = useState<AdminHeroBanner[]>([]);
  const [expandedBannerId, setExpandedBannerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/hero");
        const data = await res.json();
        if (data.success) {
          if (data.hero) {
            setFormData((prev) => ({ ...prev, ...data.hero }));
          }
          if (Array.isArray(data.banners) && data.banners.length > 0) {
            const formatted: AdminHeroBanner[] = data.banners.map((b: any, index: number) => ({
              id: b.id || `temp-${index}`,
              title: b.title || "EVERYDAY ESSENTIALS. ELEVATED",
              subtitle: b.subtitle || "",
              overline: b.overline || b.hero_tagline || "",
              link_text: b.link_text || b.cta_primary_text || "SHOP COLLECTION",
              link_url: b.link_url || b.cta_primary_href || "/shop",
              image_url: b.image_url || b.background_image_url || b.product_image_url || null,
              image_public_id: b.image_public_id || b.background_image_public_id || b.product_image_public_id || null,
              mobile_image_url: b.mobile_image_url || null,
              mobile_image_public_id: b.mobile_image_public_id || null,
              product_image_url: b.product_image_url || null,
              product_image_public_id: b.product_image_public_id || null,
              position: "hero",
              sort_order: typeof b.sort_order === "number" ? b.sort_order : index,
              is_active: b.is_active !== false,
              starts_at: b.starts_at || null,
              ends_at: b.ends_at || null,
            }));
            setHeroBanners(formatted);
            if (formatted.length > 0 && formatted[0]) {
              setExpandedBannerId(formatted[0].id);
            }
          }
        }
      } catch {}
    }
    loadData();
  }, []);

  function handleChange(field: keyof HeroData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Banner Actions
  function handleAddBanner() {
    const newBanner: AdminHeroBanner = {
      id: `temp-${Date.now()}`,
      title: "NEW COLLECTION TITLE",
      subtitle: "Discover newly curated beauty and lifestyle products.",
      overline: "SUMMER ESSENTIALS",
      link_text: "EXPLORE NOW",
      link_url: "/shop",
      image_url: null,
      image_public_id: null,
      mobile_image_url: null,
      mobile_image_public_id: null,
      product_image_url: null,
      product_image_public_id: null,
      position: "hero",
      sort_order: heroBanners.length,
      is_active: true,
      starts_at: null,
      ends_at: null,
    };
    const updated = [...heroBanners, newBanner];
    setHeroBanners(updated);
    setExpandedBannerId(newBanner.id);
  }

  function handleUpdateBanner(id: string, updates: Partial<AdminHeroBanner>) {
    setHeroBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  }

  function handleDeleteBanner(id: string) {
    if (heroBanners.length <= 1) {
      alert("At least one hero banner is required.");
      return;
    }
    if (!confirm("Are you sure you want to delete this hero slide?")) return;
    const updated = heroBanners
      .filter((b) => b.id !== id)
      .map((b, idx) => ({ ...b, sort_order: idx }));
    setHeroBanners(updated);
    if (expandedBannerId === id) {
      setExpandedBannerId(updated[0]?.id || null);
    }
  }

  function handleMoveBanner(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= heroBanners.length) return;

    const itemA = heroBanners[index];
    const itemB = heroBanners[targetIndex];
    if (!itemA || !itemB) return;

    const updated = [...heroBanners];
    updated[index] = itemB;
    updated[targetIndex] = itemA;

    const reordered = updated.map((b, idx) => ({ ...b, sort_order: idx }));
    setHeroBanners(reordered);
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          banners: heroBanners,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save failed");

      if (Array.isArray(data.banners)) {
        setHeroBanners(
          data.banners.map((b: any, index: number) => ({
            id: b.id || `temp-${index}`,
            title: b.title || "EVERYDAY ESSENTIALS. ELEVATED",
            subtitle: b.subtitle || "",
            overline: b.overline || b.hero_tagline || "",
            link_text: b.link_text || b.cta_primary_text || "SHOP COLLECTION",
            link_url: b.link_url || b.cta_primary_href || "/shop",
            image_url: b.image_url || b.background_image_url || b.product_image_url || null,
            image_public_id: b.image_public_id || b.background_image_public_id || b.product_image_public_id || null,
            mobile_image_url: b.mobile_image_url || null,
            mobile_image_public_id: b.mobile_image_public_id || null,
            product_image_url: b.product_image_url || null,
            product_image_public_id: b.product_image_public_id || null,
            position: "hero",
            sort_order: typeof b.sort_order === "number" ? b.sort_order : index,
            is_active: b.is_active !== false,
            starts_at: b.starts_at || null,
            ends_at: b.ends_at || null,
          }))
        );
      }

      setMessage({ text: "All changes and hero banners saved successfully!", type: "success" });
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
        subtitle="Customize announcement bar, hero slider banners, trust badges, and promotional sections."
      />

      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Top Quick Bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#DCCFB9]/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#183D2B]">
            <Layers size={15} />
            <span>Storefront Visual Customizer</span>
          </div>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-all cursor-pointer disabled:opacity-50"
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

          {/* 2. Main Hero Section — MULTI-BANNER SLIDER CMS */}
          <div className="bg-white p-4 md:p-5 rounded-lg border border-[#DCCFB9]/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCCFB9]/30 pb-2">
              <div>
                <h2 className="text-xs font-bold text-[#1D211F] uppercase tracking-wider">
                  2. Hero Slider Banners ({heroBanners.length} Slide{heroBanners.length === 1 ? "" : "s"})
                </h2>
                <p className="text-[11px] text-[#5C6460] mt-0.5">
                  Manage multiple hero slides with autoplay and mobile swipe. When multiple slides are active, they slide automatically on the storefront.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBanner}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] hover:bg-[#102D20] text-white text-[11px] font-bold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Slide</span>
              </button>
            </div>

            {/* Banners List */}
            <div className="space-y-3">
              {heroBanners.map((banner, index) => {
                const isExpanded = expandedBannerId === banner.id;
                const desktopImg = banner.image_url;
                const mobileImg = banner.mobile_image_url;

                return (
                  <div
                    key={banner.id}
                    className={`border rounded-lg transition-all ${
                      banner.is_active
                        ? isExpanded
                          ? "border-[#183D2B] bg-white shadow-xs"
                          : "border-[#DCCFB9] bg-[#FAFAF8]"
                        : "border-dashed border-[#DCCFB9] bg-gray-50/70 opacity-80"
                    }`}
                  >
                    {/* Slide Header Bar */}
                    <div className="flex items-center justify-between p-3 gap-3">
                      {/* Left: Reorder & Thumbnail & Info */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex flex-col gap-0.5 text-gray-400">
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(index, "up")}
                            disabled={index === 0}
                            className="hover:text-[#183D2B] disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBanner(index, "down")}
                            disabled={index === heroBanners.length - 1}
                            className="hover:text-[#183D2B] disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Slide Badge */}
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#183D2B]/10 text-[#183D2B] rounded">
                          Slide #{index + 1}
                        </span>

                        {/* Miniature Preview */}
                        {desktopImg ? (
                          <div className="w-12 h-7 rounded bg-gray-200 overflow-hidden shrink-0 border border-gray-300 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={desktopImg}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-7 rounded bg-gray-200 border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 shrink-0">
                            No Img
                          </div>
                        )}

                        {/* Title & Overline */}
                        <div className="min-w-0 truncate">
                          <p className="text-xs font-bold text-[#1D211F] truncate">
                            {banner.title || "Untitled Slide"}
                          </p>
                          {banner.overline && (
                            <p className="text-[10px] text-[#5C6460] uppercase tracking-wider truncate">
                              {banner.overline}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Active Toggle & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Active status button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateBanner(banner.id, { is_active: !banner.is_active })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            banner.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {banner.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{banner.is_active ? "Active" : "Hidden"}</span>
                        </button>

                        {/* Expand / Collapse */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBannerId(isExpanded ? null : banner.id)
                          }
                          className="px-2.5 py-1 bg-white border border-[#DCCFB9] hover:border-[#183D2B] text-xs font-semibold rounded text-[#1D211F] cursor-pointer"
                        >
                          {isExpanded ? "Collapse" : "Edit Slide"}
                        </button>

                        {/* Delete Slide */}
                        {heroBanners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete slide"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slide Expanded Editing Panel */}
                    {isExpanded && (
                      <div className="p-4 border-t border-[#DCCFB9]/50 bg-white space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {/* Overline */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                              Top Tagline / Overline (Small text above headline)
                            </label>
                            <input
                              type="text"
                              value={banner.overline}
                              onChange={(e) =>
                                handleUpdateBanner(banner.id, { overline: e.target.value })
                              }
                              className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                              placeholder="e.g. NATURAL CARE FOR A BRIGHTER YOU"
                            />
                          </div>

                          {/* Headline */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                              Hero Headline (Line breaks will format across lines)
                            </label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) =>
                                handleUpdateBanner(banner.id, { title: e.target.value })
                              }
                              className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                              placeholder="Enter hero headline"
                            />
                          </div>

                          {/* Subtitle */}
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                              Hero Subtitle
                            </label>
                            <textarea
                              rows={2}
                              value={banner.subtitle}
                              onChange={(e) =>
                                handleUpdateBanner(banner.id, { subtitle: e.target.value })
                              }
                              className="w-full p-2.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all resize-none placeholder:text-[#8C938F]"
                              placeholder="Enter hero subtitle"
                            />
                          </div>

                          {/* CTA Text */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                              Call-to-Action Text
                            </label>
                            <input
                              type="text"
                              value={banner.link_text}
                              onChange={(e) =>
                                handleUpdateBanner(banner.id, { link_text: e.target.value })
                              }
                              className="w-full h-8 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-md text-xs text-[#1D211F] focus:bg-white focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B]/10 outline-none transition-all placeholder:text-[#8C938F]"
                              placeholder="Enter button text (e.g. SHOP COLLECTION)"
                            />
                          </div>

                          {/* CTA Link */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-1">
                              Call-to-Action Link
                            </label>
                            <LinkPicker
                              value={banner.link_url}
                              onChange={(val) =>
                                handleUpdateBanner(banner.id, { link_url: val })
                              }
                            />
                          </div>

                          {/* Hero Banner Images — 2-column: Desktop | Mobile */}
                          <div className="md:col-span-2 pt-1 border-t border-[#DCCFB9]/40">
                            <p className="text-[11px] font-bold text-[#1D211F] uppercase tracking-wider mb-2">
                              Hero Slide Banner Images
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {/* Desktop Banner */}
                              <div>
                                <CloudinaryUploader
                                  label="Desktop Banner"
                                  description="Shown on tablet & desktop (≥768px). Recommended: 1920×1080 landscape."
                                  folder="aurelle/hero"
                                  aspectRatio="hero"
                                  value={banner.image_url}
                                  publicId={banner.image_public_id}
                                  onUploadSuccess={(asset: CloudinaryAsset) => {
                                    handleUpdateBanner(banner.id, {
                                      image_url: asset.secure_url,
                                      image_public_id: asset.public_id,
                                      product_image_url: asset.secure_url,
                                      product_image_public_id: asset.public_id,
                                    });
                                    setMessage({
                                      text: `Desktop banner for Slide #${index + 1} uploaded!`,
                                      type: "success",
                                    });
                                  }}
                                  onRemove={() => {
                                    handleUpdateBanner(banner.id, {
                                      image_url: null,
                                      image_public_id: null,
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
                                  description="Shown on mobile only (<768px). Recommended: 9×16 portrait."
                                  folder="aurelle/hero"
                                  aspectRatio="hero"
                                  value={banner.mobile_image_url}
                                  publicId={banner.mobile_image_public_id}
                                  onUploadSuccess={(asset: CloudinaryAsset) => {
                                    handleUpdateBanner(banner.id, {
                                      mobile_image_url: asset.secure_url,
                                      mobile_image_public_id: asset.public_id,
                                    });
                                    setMessage({
                                      text: `Mobile banner for Slide #${index + 1} uploaded!`,
                                      type: "success",
                                    });
                                  }}
                                  onRemove={() => {
                                    handleUpdateBanner(banner.id, {
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
                    )}
                  </div>
                );
              })}
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
                    <div className="mt-3">
                      <BannerLinkPicker
                        label={`Banner ${num} Link Href`}
                        value={formData[linkKey] as string}
                        onChange={(value) => handleChange(linkKey, value)}
                        mode="retail"
                      />
                    </div>
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
                  placeholder="Enter Description"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
