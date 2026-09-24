"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { createClient } from "@/lib/supabase/client";
import { SlidersHorizontal, Package2, Filter, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Shape of a product row from Supabase
interface SupabaseProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  retail_price: number;
  compare_at_price?: number | null;
  is_new_arrival?: boolean;
  is_best_seller?: boolean;
  is_featured?: boolean;
  // Supabase foreign-key joins may return an object OR a single-element array
  brand?: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  category?: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  subcategory?: { name: string; slug: string } | Array<{ name: string; slug: string }> | null;
  product_images?: Array<{
    cloudinary_public_id: string;
    secure_url: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
  }>;
  inventory?: { stock_status: string } | Array<{ stock_status: string }> | null;
  reviews?: Array<{ rating: number; is_published?: boolean }>;
}

// Normalise Supabase join results — they can be an object or a 1-element array
function norm<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null;
  return Array.isArray(val) ? (val[0] ?? null) : val;
}

// ── Custom inline-expanding dropdown ────────────────────────────────────────
interface DropdownOption { label: string; value: string }
interface InlineDropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

function InlineDropdown({ label, value, options, onChange, disabled = false }: InlineDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(o => o.value === value)?.label ?? label;
  const isDefault = value === "all" || value === "";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(prev => !prev)}
        className={[
          "h-10 w-full flex items-center justify-between rounded-sm bg-[#F7F5EF] px-3",
          "text-xs font-semibold text-[#1D211F] outline-none transition-all duration-200",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[#EDE9DF]",
          open ? "rounded-b-none bg-[#EDE9DF]" : "",
        ].join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={isDefault ? "text-[#8C938F] font-medium" : "text-[#1D211F]"}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 mr-0.5 text-[#5C6460] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="w-full rounded-b-sm bg-white border border-[#EDE9DF] border-t-0 shadow-md max-h-44 overflow-y-auto z-10"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={[
                "w-full text-left px-3 py-2 text-xs transition-colors duration-150",
                opt.value === value
                  ? "bg-[#183D2B]/10 text-[#183D2B] font-semibold"
                  : "text-[#1D211F] hover:bg-[#F7F5EF]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product-type filter checkboxes ───────────────────────────────────────────
interface ProductTypeFilters {
  featured: boolean;
  newArrivals: boolean;
  bestSellers: boolean;
  topRated: boolean;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialBrand = searchParams.get("brand") || "all";
  const initialSubcategory = searchParams.get("subcategory") || searchParams.get("sub") || "all";
  const initialSort = searchParams.get("sort") || "price-low";
  const initialFilter = searchParams.get("filter") || "";
  const initialSearch = searchParams.get("search") || searchParams.get("q") || "";

  const [allProducts, setAllProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialSubcategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [maxPrice, setMaxPrice] = useState(0);
  const [productTypeFilters, setProductTypeFilters] = useState<ProductTypeFilters>({
    featured: false,
    newArrivals: initialFilter === "new-arrivals",
    bestSellers: false,
    topRated: false,
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  // ── Direct-fetched filter data (independent of products) ─────────────────
  const [allBrands, setAllBrands] = useState<{ name: string; slug: string }[]>([]);
  const [allCategories, setAllCategories] = useState<{ name: string; slug: string }[]>([]);
  const [allSubcategories, setAllSubcategories] = useState<{ name: string; slug: string; category_slug: string }[]>([]);

  useEffect(() => {
    const filter = searchParams.get("filter") || "";
    const search = searchParams.get("search") || searchParams.get("q") || "";
    setSelectedCategory(searchParams.get("category") || "all");
    setSelectedBrand(searchParams.get("brand") || "all");
    setSelectedSubcategory(searchParams.get("subcategory") || searchParams.get("sub") || "all");
    setSortBy(searchParams.get("sort") || "price-low");
    setSearchQuery(search);
    // Sync special filter flags from URL
    setProductTypeFilters(prev => ({
      ...prev,
      newArrivals: filter === "new-arrivals",
    }));
    // Always show top view of shop page when category/search params change
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [searchParams]);

  // Ensure scroll to top on initial page mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Load real products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("products")
          .select(`
            id, name, slug, sku, retail_price, compare_at_price,
            is_new_arrival, is_featured, is_best_seller,
            brand:brands(name, slug),
            category:categories(name, slug),
            subcategory:subcategories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status),
            reviews(rating, is_published)
          `)
          .eq("is_published", true)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (error) console.warn("[ShopPage] products:", error.message);
        if (data) setAllProducts(data as SupabaseProduct[]);
      } catch (err) {
        console.error("[ShopPage] Fetch exception:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Load brands, categories, subcategories directly from their own tables
  useEffect(() => {
    async function fetchFilterData() {
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;

        const [{ data: brandsData }, { data: catsData }, { data: subsData }] = await Promise.all([
          sb.from("brands").select("name, slug").eq("is_active", true).order("name"),
          sb.from("categories").select("name, slug").eq("is_active", true).order("name"),
          sb.from("subcategories")
            .select("name, slug, category:categories(slug)")
            .eq("is_active", true)
            .order("name"),
        ]);

        if (brandsData) setAllBrands(brandsData);
        if (catsData) setAllCategories(catsData);
        if (subsData) {
          // Supabase returns category as { slug } object for the join
          setAllSubcategories(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            subsData.map((s: any) => ({
              name: s.name,
              slug: s.slug,
              category_slug: norm(s.category)?.slug ?? "",
            }))
          );
        }
      } catch (err) {
        console.error("[ShopPage] Filter data fetch exception:", err);
      }
    }
    fetchFilterData();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        const cat = norm(product.category);
        const brand = norm(product.brand);
        const sub = norm(product.subcategory);
        const inv = norm(product.inventory);

        // Search query filter (checks product name, brand, category, subcategory, sku)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = product.name?.toLowerCase().includes(q);
          const matchesBrand = brand?.name?.toLowerCase().includes(q);
          const matchesCategory = cat?.name?.toLowerCase().includes(q);
          const matchesSub = sub?.name?.toLowerCase().includes(q);
          const matchesSku = product.sku?.toLowerCase().includes(q);
          if (!matchesName && !matchesBrand && !matchesCategory && !matchesSub && !matchesSku) {
            return false;
          }
        }

        if (selectedCategory !== "all" && cat?.slug !== selectedCategory) return false;
        if (selectedBrand !== "all" && brand?.slug !== selectedBrand) return false;
        if (selectedSubcategory !== "all" && sub?.slug !== selectedSubcategory) return false;
        if (maxPrice > 0 && product.retail_price > maxPrice) return false;
        if (inStockOnly && inv?.stock_status === "out_of_stock") return false;

        // Product type filters — product must match at least one active type
        const anyTypeActive =
          productTypeFilters.featured ||
          productTypeFilters.newArrivals ||
          productTypeFilters.bestSellers ||
          productTypeFilters.topRated;
        if (anyTypeActive) {
          const matchesFeatured = productTypeFilters.featured && Boolean(product.is_featured);
          const matchesNew = productTypeFilters.newArrivals && Boolean(product.is_new_arrival);
          const matchesBest = productTypeFilters.bestSellers && Boolean(product.is_best_seller);

          const publishedReviews = (product.reviews ?? []).filter(
            (r: { rating: number; is_published?: boolean }) => r.is_published !== false
          );
          const reviewCount = publishedReviews.length;
          const avgRating =
            reviewCount > 0
              ? publishedReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviewCount
              : 0;
          const matchesTopRated = productTypeFilters.topRated && avgRating >= 4.0;

          if (!matchesFeatured && !matchesNew && !matchesBest && !matchesTopRated) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.retail_price - b.retail_price;
        if (sortBy === "price-high") return b.retail_price - a.retail_price;
        return 0;
      })
      // Normalise Supabase join fields from T | T[] | null → T | null
      // so the shape matches ProductCardProps exactly.
      .map((product) => ({
        ...product,
        brand: norm(product.brand),
        category: norm(product.category),
        subcategory: norm(product.subcategory),
        inventory: norm(product.inventory),
      }));
  }, [allProducts, selectedCategory, selectedBrand, selectedSubcategory, sortBy, inStockOnly, maxPrice, productTypeFilters, searchQuery]);

  const priceLimit = useMemo(
    () => Math.max(0, ...allProducts.map((product) => product.retail_price)),
    [allProducts],
  );
  const activeMaxPrice = maxPrice || priceLimit;

  // Filter options sourced directly from DB tables
  const brandOptions = [
    { label: "All Brands", value: "all" },
    ...allBrands.map(b => ({ label: b.name, value: b.slug })),
  ];
  const categoryOptions = [
    { label: "All Categories", value: "all" },
    ...allCategories.map(c => ({ label: c.name, value: c.slug })),
  ];
  // Filter subcategories client-side by selected category
  const visibleSubcategories = selectedCategory === "all"
    ? allSubcategories
    : allSubcategories.filter(s => s.category_slug === selectedCategory);
  const subcategoryOptions = [
    { label: "All Subcategories", value: "all" },
    ...visibleSubcategories.map(s => ({ label: s.name, value: s.slug })),
  ];

  const handleClearFilters = () => {
    setSelectedBrand("all");
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setInStockOnly(false);
    setMaxPrice(0);
    setSortBy("price-low");
    setSearchQuery("");
    setProductTypeFilters({ featured: false, newArrivals: false, bestSellers: false, topRated: false });
    const params = new URLSearchParams(window.location.search);
    params.delete("search");
    params.delete("q");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const toggleTypeFilter = (key: keyof ProductTypeFilters) => {
    setProductTypeFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const anyFilterActive =
    Boolean(searchQuery.trim()) ||
    selectedBrand !== "all" ||
    selectedCategory !== "all" ||
    selectedSubcategory !== "all" ||
    inStockOnly ||
    maxPrice > 0 ||
    productTypeFilters.featured ||
    productTypeFilters.newArrivals ||
    productTypeFilters.bestSellers ||
    productTypeFilters.topRated;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedBrand !== "all") count++;
    if (selectedCategory !== "all") count++;
    if (selectedSubcategory !== "all") count++;
    if (inStockOnly) count++;
    if (maxPrice > 0) count++;
    if (productTypeFilters.featured) count++;
    if (productTypeFilters.newArrivals) count++;
    if (productTypeFilters.bestSellers) count++;
    if (productTypeFilters.topRated) count++;
    return count;
  }, [selectedBrand, selectedCategory, selectedSubcategory, inStockOnly, maxPrice, productTypeFilters]);

  const renderFilterControls = () => (
    <div className="space-y-4">
      {/* ── Product Type ─── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C938F] mb-1">Product Type</p>
        <div className="divide-y divide-[#F0EBE3]">
          {([
            { key: "featured" as const, label: "Featured" },
            { key: "newArrivals" as const, label: "New Arrivals" },
            { key: "bestSellers" as const, label: "Best Sellers" },
            { key: "topRated" as const, label: "Top Rated" },
          ]).map(({ key, label }) => {
            const active = productTypeFilters[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleTypeFilter(key)}
                className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
              >
                <span className={[
                  "text-xs font-medium transition-colors",
                  active ? "text-[#183D2B] font-semibold" : "text-[#1D211F] group-hover:text-[#183D2B]",
                ].join(" ")}>
                  {label}
                </span>
                <span className={[
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                  active
                    ? "bg-[#183D2B] border-[#183D2B]"
                    : "border-[#DCCFB9] group-hover:border-[#183D2B]",
                ].join(" ")}>
                  {active && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.7L6.5 2.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#DCCFB9]/40" />

      {/* ── Brand ─── */}
      <InlineDropdown
        label="All Brands"
        value={selectedBrand}
        options={brandOptions}
        onChange={setSelectedBrand}
      />

      {/* ── Category ─── */}
      <InlineDropdown
        label="All Categories"
        value={selectedCategory}
        options={categoryOptions}
        onChange={(v) => { setSelectedCategory(v); setSelectedSubcategory("all"); }}
      />

      {/* ── Subcategory ─── */}
      <InlineDropdown
        label="All Subcategories"
        value={selectedSubcategory}
        options={subcategoryOptions}
        onChange={setSelectedSubcategory}
        disabled={visibleSubcategories.length === 0}
      />

      <div className="border-t border-[#DCCFB9]/40" />

      {/* ── Price ─── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C938F]">Price</p>
          <span className="text-xs font-bold text-[#183D2B]">AED {activeMaxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="0"
          max={priceLimit || 1}
          step="1"
          value={activeMaxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#183D2B] h-1 cursor-pointer"
          disabled={!priceLimit}
          aria-label="Maximum price"
        />
        <div className="mt-1.5 flex justify-between text-[10px] text-[#8C938F]">
          <span>AED 0</span>
          <span>AED {priceLimit.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-t border-[#DCCFB9]/40" />

      {/* ── Sort ─── */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={13} className="shrink-0 text-[#8C938F]" />
        <InlineDropdown
          label="Sort By"
          value={sortBy}
          options={[
            { label: "Price: Low to High", value: "price-low" },
            { label: "Price: High to Low", value: "price-high" },
          ]}
          onChange={setSortBy}
        />
      </div>

      <div className="border-t border-[#DCCFB9]/40" />

      {/* ── In Stock ─── */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
          className="h-3.5 w-3.5 accent-[#183D2B] cursor-pointer"
        />
        <span className="text-xs font-semibold text-[#1D211F] group-hover:text-[#183D2B] transition-colors">
          In Stock Only
        </span>
      </label>
    </div>
  );

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop Filter Sidebar - Strictly Unchanged on Desktop, Hidden on Mobile */}
          <aside className="hidden lg:block h-fit bg-white p-5 shadow-xs lg:sticky lg:top-24 rounded-sm">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#183D2B]">
                <Filter size={16} />Filters
              </div>
              {anyFilterActive && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#183D2B] hover:text-[#102D20] transition-colors cursor-pointer"
                >
                  <X size={11} />Clear
                </button>
              )}
            </div>

            {renderFilterControls()}
          </aside>

          <main className="min-w-0">
            {/* Mobile Filter Action Bar */}
            <div className="lg:hidden mb-4 bg-white px-3.5 py-2.5 rounded-xl border border-[#DCCFB9]/60 shadow-xs flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1D211F]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                </p>
                {searchQuery ? (
                  <span className="inline-block text-[11px] text-[#183D2B] font-semibold truncate max-w-[150px]">
                    &ldquo;{searchQuery}&rdquo;
                  </span>
                ) : selectedCategory !== "all" ? (
                  <span className="inline-block text-[11px] text-[#183D2B] font-semibold truncate max-w-[130px]">
                    {allCategories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {anyFilterActive && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11px] font-semibold text-[#8C938F] hover:text-[#183D2B] px-1.5 py-1 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs hover:bg-[#102D20] active:scale-95 transition-all cursor-pointer"
                >
                  <Filter size={13} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#E5A83B] text-[#1D211F] text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#DCCFB9]/40 overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] bg-[#F0EBE1]" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-[#F0EBE1] rounded-full w-3/4" />
                  <div className="h-3 bg-[#F0EBE1] rounded-full w-1/2" />
                  <div className="h-4 bg-[#F0EBE1] rounded-full w-1/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — no products uploaded yet */}
        {!loading && allProducts.length === 0 && (
          <div className="bg-white rounded-3xl border border-[#DCCFB9]/50 shadow-xs p-14 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#F7F5EF] flex items-center justify-center mx-auto mb-4 text-[#A8B7A3]">
              <Package2 size={28} strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1D211F] mb-2">
              Products Coming Soon
            </h2>
            <p className="text-sm text-[#5C6460] leading-relaxed mb-4">
              Our catalog is being prepared. Visit the Admin Panel to upload
              products and they will appear here instantly.
            </p>
            <a
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#102D20] transition-colors shadow-sm"
            >
              Add First Product
            </a>
          </div>
        )}

        {/* No results from filters */}
        {!loading && allProducts.length > 0 && filteredProducts.length === 0 && (
          <div className="bg-white rounded-sm border border-[#DCCFB9]/50 p-10 text-center max-w-md mx-auto  shadow-xs">
            <p className="text-sm font-bold text-[#1D211F] mb-1">No products match your filters</p>
            <p className="text-xs text-[#5C6460] mb-4">Try adjusting your search or category selection.</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-5 py-2 bg-[#183D2B] text-white text-xs font-bold rounded-sm hover:bg-[#102D20] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <p className="hidden lg:block text-xs text-[#5C6460] pb-4">
              Showing <strong className="text-[#1D211F]">{filteredProducts.length}</strong> products
              {searchQuery && (
                <>
                  {" "}matching &ldquo;<strong className="text-[#183D2B]">{searchQuery}</strong>&rdquo;
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      const params = new URLSearchParams(window.location.search);
                      params.delete("search");
                      params.delete("q");
                      window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);
                    }}
                    className="ml-2 text-[#183D2B] font-bold hover:underline cursor-pointer"
                  >
                    ✕ Clear search
                  </button>
                </>
              )}
              {selectedCategory !== "all" && (
                <>
                  {" "}in <strong className="text-[#183D2B]">
                    {allCategories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 text-[#183D2B] font-bold hover:underline cursor-pointer"
                  >
                    ✕ Clear
                  </button>
                </>
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </>
        )}
          </main>
        </div>
      </div>

      {/* Floating Mobile Filter Button for quick bottom access when scrolling */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xl shadow-black/25 hover:bg-[#102D20] active:scale-95 transition-all border border-white/20 cursor-pointer"
        >
          <Filter size={14} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#E5A83B] text-[#1D211F] text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Filter Bottom Sheet Drawer */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
            {/* Dimmed Backdrop */}
            <motion.div
              key="mobile-filter-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              key="mobile-filter-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative w-full max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Top Drag Handle */}
              <div className="pt-3 pb-1 flex justify-center cursor-grab">
                <div className="w-12 h-1.5 bg-[#DCCFB9]/70 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-[#DCCFB9]/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#183D2B]">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-[#183D2B]/10 text-[#183D2B] rounded-full">
                      {activeFilterCount} Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {anyFilterActive && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-[11px] font-semibold text-[#8C938F] hover:text-[#183D2B] px-2 py-1 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-8 h-8 rounded-full bg-[#F7F5EF] flex items-center justify-center text-[#1D211F] hover:bg-[#EDE9DF] transition-colors cursor-pointer"
                    aria-label="Close filters"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Options */}
              <div className="flex-1 overflow-y-auto p-5">
                {renderFilterControls()}
              </div>

              {/* Sticky Drawer Footer with Apply Button */}
              <div className="p-4 border-t border-[#DCCFB9]/30 bg-white">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-[#102D20] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Apply Filters ({filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"})</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#5C6460]">Loading catalog…</p>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
