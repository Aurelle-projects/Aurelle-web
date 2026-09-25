"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Check,
  Package,
} from "lucide-react";

export interface WholesaleShopCategory {
  id: string;
  name: string;
  slug: string;
}

export interface WholesaleShopSubcategory {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

export interface WholesaleShopBrand {
  id: string;
  name: string;
  slug: string;
}

interface WholesaleShopClientProps {
  initialProducts: any[];
  categories: WholesaleShopCategory[];
  subcategories?: WholesaleShopSubcategory[];
  brands: WholesaleShopBrand[];
}

interface DropdownOption {
  label: string;
  value: string;
  count?: number;
}

interface LuxuryDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  disabledPlaceholder?: string;
  className?: string;
}

function LuxuryDropdown({
  label,
  value,
  options,
  onChange,
  disabled = false,
  disabledPlaceholder,
  className = "",
}: LuxuryDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label ?? label;
  const isDefault = value === "all" || value === "" || value === "featured";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`h-10 w-full flex items-center justify-between rounded-sm bg-[#FAF8F5] border border-[#DCCFB9] px-3 text-xs font-semibold outline-none transition-all duration-150 ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-50 border-[#EFEAE0]"
            : "cursor-pointer hover:border-[#183D2B]/50 hover:bg-[#F3EFE6]"
        } ${open ? "border-[#183D2B] ring-1 ring-[#183D2B]/20" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate ${
            isDefault && !selectedOption
              ? "text-[#8E9590] font-normal"
              : "text-[#14231B]"
          }`}
        >
          {disabled && disabledPlaceholder
            ? disabledPlaceholder
            : selectedLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 ml-1.5 text-[#5C6460] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] bg-white border border-[#DCCFB9] shadow-xl rounded-sm py-1 max-h-56 overflow-y-auto z-40"
          style={{ scrollbarWidth: "thin" }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#183D2B]/10 text-[#183D2B] font-bold"
                    : "text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B]"
                }`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof opt.count === "number" && (
                    <span className="text-[10px] text-[#8E9590]">
                      ({opt.count})
                    </span>
                  )}
                  {isSelected && <Check size={13} className="text-[#183D2B]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function WholesaleShopClient({
  initialProducts,
  categories,
  subcategories = [],
  brands,
}: WholesaleShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL query params
  const paramCategory = searchParams.get("category") || "all";
  const paramSubcategory =
    searchParams.get("subcategory") || searchParams.get("sub") || "all";
  const paramBrand = searchParams.get("brand") || "all";
  const paramSort = searchParams.get("sort") || "featured";
  const paramFilter = searchParams.get("filter") || "";
  const paramFeatured =
    searchParams.get("featured") === "true" || paramFilter === "featured";
  const paramNew =
    searchParams.get("new") === "true" || paramFilter === "new-arrivals";
  const paramBestSeller =
    searchParams.get("bestseller") === "true" || paramFilter === "best-sellers";

  // State
  const [selectedCategory, setSelectedCategory] =
    useState<string>(paramCategory);
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<string>(paramSubcategory);
  const [selectedBrand, setSelectedBrand] = useState<string>(paramBrand);
  const [sortBy, setSortBy] = useState<string>(paramSort);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [productTypeFilters, setProductTypeFilters] = useState<{
    featured: boolean;
    newArrivals: boolean;
    bestSellers: boolean;
  }>({
    featured: paramFeatured,
    newArrivals: paramNew,
    bestSellers: paramBestSeller,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  // Sync state if URL searchParams change
  useEffect(() => {
    const filter = searchParams.get("filter") || "";
    const isNew =
      searchParams.get("new") === "true" || filter === "new-arrivals";
    const isFeatured =
      searchParams.get("featured") === "true" || filter === "featured";
    const isBestSeller =
      searchParams.get("bestseller") === "true" || filter === "best-sellers";

    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedSubcategory(
      searchParams.get("subcategory") || searchParams.get("sub") || "all"
    );
    setSelectedBrand(searchParams.get("brand") || "all");
    setSortBy(searchParams.get("sort") || "featured");

    setProductTypeFilters({
      featured: isFeatured,
      newArrivals: isNew,
      bestSellers: isBestSeller,
    });

    if (filter === "categories" || filter === "brands") {
      // Open mobile filter drawer automatically on mobile so user can select
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobileFiltersOpen(true);
      }
    }
  }, [searchParams]);

  // Compute category product counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialProducts) {
      const catId = p.category_id || p.category?.id;
      const catSlug = p.category?.slug;
      if (catId) counts[catId] = (counts[catId] || 0) + 1;
      if (catSlug) counts[catSlug] = (counts[catSlug] || 0) + 1;
    }
    return counts;
  }, [initialProducts]);

  // Compute subcategory product counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialProducts) {
      const subId = p.subcategory_id || p.subcategory?.id;
      const subSlug = p.subcategory?.slug;
      if (subId) counts[subId] = (counts[subId] || 0) + 1;
      if (subSlug) counts[subSlug] = (counts[subSlug] || 0) + 1;
    }
    return counts;
  }, [initialProducts]);

  // Compute brand product counts
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialProducts) {
      const bId = p.brand_id || p.brand?.id;
      const bSlug = p.brand?.slug;
      if (bId) counts[bId] = (counts[bId] || 0) + 1;
      if (bSlug) counts[bSlug] = (counts[bSlug] || 0) + 1;
    }
    return counts;
  }, [initialProducts]);

  // Subcategories filtered by currently selected category
  const visibleSubcategories = useMemo(() => {
    if (selectedCategory === "all") {
      return subcategories;
    }
    // Match either category ID or slug
    const matchedCategory = categories.find(
      (c) => c.id === selectedCategory || c.slug === selectedCategory
    );
    const catId = matchedCategory?.id || selectedCategory;
    return subcategories.filter((s) => s.category_id === catId);
  }, [subcategories, selectedCategory, categories]);

  // Dropdown options
  const categoryOptions: DropdownOption[] = useMemo(
    () => [
      { label: "All Categories", value: "all", count: initialProducts.length },
      ...categories.map((c) => ({
        label: c.name,
        value: c.id,
        count: categoryCounts[c.id] || categoryCounts[c.slug] || 0,
      })),
    ],
    [categories, initialProducts.length, categoryCounts]
  );

  const subcategoryOptions: DropdownOption[] = useMemo(
    () => [
      { label: "All Subcategories", value: "all" },
      ...visibleSubcategories.map((s) => ({
        label: s.name,
        value: s.id,
        count: subcategoryCounts[s.id] || subcategoryCounts[s.slug] || 0,
      })),
    ],
    [visibleSubcategories, subcategoryCounts]
  );

  const brandOptions: DropdownOption[] = useMemo(
    () => [
      { label: "All Brands", value: "all", count: initialProducts.length },
      ...brands.map((b) => ({
        label: b.name,
        value: b.id,
        count: brandCounts[b.id] || brandCounts[b.slug] || 0,
      })),
    ],
    [brands, initialProducts.length, brandCounts]
  );

  const sortOptions: DropdownOption[] = [
    { label: "Featured", value: "featured" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price-low" },
    { label: "Price: High to Low", value: "price-high" },
    { label: "MOQ: Low to High", value: "moq-low" },
    { label: "Name: A to Z", value: "name-asc" },
  ];

  // Filter & Sort products
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) =>
          p.category_id === selectedCategory ||
          p.category?.id === selectedCategory ||
          p.category?.slug === selectedCategory
      );
    }

    // Subcategory filter
    if (selectedSubcategory !== "all") {
      result = result.filter(
        (p) =>
          p.subcategory_id === selectedSubcategory ||
          p.subcategory?.id === selectedSubcategory ||
          p.subcategory?.slug === selectedSubcategory
      );
    }

    // Brand filter
    if (selectedBrand !== "all") {
      result = result.filter(
        (p) =>
          p.brand_id === selectedBrand ||
          p.brand?.id === selectedBrand ||
          p.brand?.slug === selectedBrand
      );
    }

    // Product Type Filters (Featured, New Arrivals, Best Sellers)
    if (productTypeFilters.featured) {
      result = result.filter((p) => p.is_featured === true);
    }
    if (productTypeFilters.newArrivals) {
      result = result.filter((p) => p.is_new_arrival === true);
    }
    if (productTypeFilters.bestSellers) {
      result = result.filter((p) => p.is_best_seller === true);
    }

    // In Stock filter
    if (inStockOnly) {
      result = result.filter((p) => {
        const status =
          p.inventory?.stock_status ?? p.stock_status ?? "in_stock";
        return status !== "out_of_stock";
      });
    }

    // Sorting
    if (sortBy === "featured") {
      result.sort((a, b) => {
        const aFeat = a.is_featured ? 1 : 0;
        const bFeat = b.is_featured ? 1 : 0;
        if (bFeat !== aFeat) return bFeat - aFeat;
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
    } else if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          (a.wholesale_price || a.retail_price || 0) -
          (b.wholesale_price || b.retail_price || 0)
      );
    } else if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          (b.wholesale_price || b.retail_price || 0) -
          (a.wholesale_price || a.retail_price || 0)
      );
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "moq-low") {
      result.sort(
        (a, b) => (a.wholesale_moq || 1) - (b.wholesale_moq || 1)
      );
    } else if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
    }

    return result;
  }, [
    initialProducts,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    productTypeFilters,
    inStockOnly,
    sortBy,
  ]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedSubcategory !== "all") count++;
    if (selectedBrand !== "all") count++;
    if (inStockOnly) count++;
    if (productTypeFilters.featured) count++;
    if (productTypeFilters.newArrivals) count++;
    if (productTypeFilters.bestSellers) count++;
    return count;
  }, [
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    inStockOnly,
    productTypeFilters,
  ]);

  function handleResetFilters() {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedBrand("all");
    setInStockOnly(false);
    setProductTypeFilters({
      featured: false,
      newArrivals: false,
      bestSellers: false,
    });
    setSortBy("featured");
    router.replace("/wholesale/shop", { scroll: false });
  }

  function handleCategoryChange(catId: string) {
    setSelectedCategory(catId);
    setSelectedSubcategory("all");
  }

  const toggleProductType = (
    key: "featured" | "newArrivals" | "bestSellers"
  ) => {
    setProductTypeFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectedCategoryObj = categories.find(
    (c) => c.id === selectedCategory || c.slug === selectedCategory
  );
  const selectedSubcategoryObj = subcategories.find(
    (s) => s.id === selectedSubcategory || s.slug === selectedSubcategory
  );
  const selectedBrandObj = brands.find(
    (b) => b.id === selectedBrand || b.slug === selectedBrand
  );

  // Common Filter Content for Desktop Sidebar & Mobile Drawer
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* ── Featured & Product Highlights ── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8E9590] mb-2">
          Featured & Highlights
        </p>
        <div className="divide-y divide-[#F0EBE3] border-y border-[#F0EBE3]">
          {(
            [
              { key: "featured" as const, label: "Featured" },
              { key: "newArrivals" as const, label: "New Arrivals" },
              { key: "bestSellers" as const, label: "Best Sellers" },
            ] as const
          ).map(({ key, label }) => {
            const active = productTypeFilters[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleProductType(key)}
                className="w-full flex items-center justify-between py-2.5 text-left group cursor-pointer"
              >
                <span
                  className={`text-xs font-medium transition-colors ${
                    active
                      ? "text-[#183D2B] font-bold"
                      : "text-[#14231B] group-hover:text-[#183D2B]"
                  }`}
                >
                  {label}
                </span>
                <span
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150 ${
                    active
                      ? "bg-[#183D2B] border-[#183D2B]"
                      : "border-[#DCCFB9] group-hover:border-[#183D2B]"
                  }`}
                >
                  {active && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path
                        d="M1.5 4L3.2 5.7L6.5 2.5"
                        stroke="white"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category Dropdown ── */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E9590]">
          Category
        </label>
        <LuxuryDropdown
          label="All Categories"
          value={selectedCategory}
          options={categoryOptions}
          onChange={handleCategoryChange}
        />
      </div>

      {/* ── Subcategory Dropdown ── */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E9590]">
          Subcategory
        </label>
        <LuxuryDropdown
          label="All Subcategories"
          value={selectedSubcategory}
          options={subcategoryOptions}
          onChange={setSelectedSubcategory}
          disabled={visibleSubcategories.length === 0}
          disabledPlaceholder={
            selectedCategory !== "all"
              ? "No subcategories available"
              : "All Subcategories"
          }
        />
      </div>

      {/* ── Brand Dropdown ── */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8E9590]">
          Brand
        </label>
        <LuxuryDropdown
          label="All Brands"
          value={selectedBrand}
          options={brandOptions}
          onChange={setSelectedBrand}
        />
      </div>

      {/* ── In Stock Only ── */}
      <div className="pt-2 border-t border-[#EFEAE0]">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-[#14231B] font-medium select-none group">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 accent-[#183D2B] rounded-sm cursor-pointer"
          />
          <span className="group-hover:text-[#183D2B] transition-colors">
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* ─── Main Shop Container (Sidebar + Grid) ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ─── Desktop Filter Sidebar ─── */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-28 bg-[#FAF8F5]/50 p-5 rounded-sm border border-[#EFEAE0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE0]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#14231B] uppercase tracking-wider">
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#8E9590] hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {renderFilterControls()}
          </aside>

          {/* ─── Main Content Area ─── */}
          <main className="flex-1 min-w-0 w-full space-y-6">
            {/* Top Toolbar: Mobile Filter Button & Custom Sort Selector */}
            <div className="flex items-center justify-between lg:justify-end gap-3 pb-4 border-b border-[#EFEAE0]">
              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center justify-center gap-2 h-10 px-4 rounded-sm bg-[#FAF8F5] border border-[#DCCFB9] text-xs font-bold uppercase tracking-wider text-[#14231B] cursor-pointer"
              >
                <SlidersHorizontal size={15} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Right: Custom Luxury Sort Dropdown */}
              <div className="flex items-center gap-2 shrink-0 w-44 sm:w-52">
                <LuxuryDropdown
                  label="Featured"
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                  className="w-full"
                />
              </div>
            </div>

            {/* ─── Product Grid ─── */}
            {filteredProducts.length === 0 ? (
              <div className="bg-[#FAF8F5] p-12 md:p-16 rounded-sm border border-[#DCCFB9]/60 text-center space-y-4">
                <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center text-[#8E9590] shadow-xs">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#14231B]">
                    No wholesale products found
                  </h3>
                  <p className="text-xs text-[#5C6460] mt-1 max-w-sm mx-auto">
                    We couldn&apos;t find any wholesale items matching your
                    current filter selection.
                  </p>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="h-full">
                    <ProductCard
                      product={product}
                      isWholesaleUser={true}
                      badge={
                        product.is_new_arrival ? "New Arrival" : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ─── Mobile Filters Drawer ─── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#EFEAE0] flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#14231B] uppercase tracking-wider">
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 text-[#8E9590] hover:text-[#14231B] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {renderFilterControls()}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EFEAE0] space-y-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full h-11 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center justify-center cursor-pointer"
              >
                View {filteredProducts.length} Results
              </button>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2 text-xs text-[#8E9590] hover:text-red-700 font-semibold text-center cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
