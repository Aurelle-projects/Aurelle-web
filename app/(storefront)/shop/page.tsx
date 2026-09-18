"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import { createClient } from "@/lib/supabase/client";
import { Search, SlidersHorizontal, Package2 } from "lucide-react";

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
  brand?: { name: string } | null;
  category?: { name: string; slug: string } | null;
  product_images?: Array<{
    cloudinary_public_id: string;
    secure_url: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
  }>;
  inventory?: { stock_status: string } | null;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSort = searchParams.get("sort") || "featured";
  const initialSearch = searchParams.get("search") || "";

  const [allProducts, setAllProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [inStockOnly, setInStockOnly] = useState(false);

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
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status)
          `)
          .eq("is_published", true)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setAllProducts(data as SupabaseProduct[]);
        }
      } catch {
        // DB not configured yet — stay with empty state
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        if (
          selectedCategory !== "all" &&
          product.category?.slug !== selectedCategory
        ) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchCat = product.category?.name.toLowerCase().includes(q) ?? false;
          const matchBrand = product.brand?.name.toLowerCase().includes(q) ?? false;
          if (!matchName && !matchCat && !matchBrand) return false;
        }

        if (
          inStockOnly &&
          product.inventory?.stock_status === "out_of_stock"
        ) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.retail_price - b.retail_price;
        if (sortBy === "price-high") return b.retail_price - a.retail_price;
        if (sortBy === "newest")
          return (b.is_new_arrival ? 1 : 0) - (a.is_new_arrival ? 1 : 0);
        if (sortBy === "bestseller")
          return (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0);
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
  }, [allProducts, selectedCategory, sortBy, searchQuery, inStockOnly]);

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-[#DCCFB9]/40 py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#183D2B] mb-2">
            The Aurelle Catalog
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#1D211F] tracking-tight mb-2">
            Elevated Everyday Essentials
          </h1>
          <p className="text-sm text-[#5C6460] max-w-lg mx-auto">
            Beauty, personal care and lifestyle formulations curated for the UAE.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-2xl border border-[#DCCFB9]/50 shadow-xs p-4 sm:p-5 space-y-4">
          {/* Search + Sort row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C938F]"
              />
              <input
                type="text"
                placeholder="Search products, brand, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#F7F5EF] border border-[#DCCFB9]/80 rounded-xl text-sm text-[#1D211F] outline-none focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1D211F] whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#183D2B]"
                />
                In Stock Only
              </label>

              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-[#5C6460]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 px-3 bg-[#F7F5EF] border border-[#DCCFB9]/80 rounded-xl text-xs font-bold text-[#1D211F] outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">New Arrivals</option>
                  <option value="bestseller">Best Sellers</option>
                  <option value="price-low">Price: Low → High</option>
                  <option value="price-high">Price: High → Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                selectedCategory === "all"
                  ? "bg-[#183D2B] text-white shadow-sm"
                  : "bg-[#F7F5EF] text-[#1D211F] border border-[#DCCFB9]/60 hover:bg-[#DCCFB9]/30"
              }`}
            >
              All
            </button>
            {AURELLE_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  selectedCategory === cat.slug
                    ? "bg-[#183D2B] text-white shadow-sm"
                    : "bg-[#F7F5EF] text-[#1D211F] border border-[#DCCFB9]/60 hover:bg-[#DCCFB9]/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
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
          <div className="bg-white rounded-2xl border border-[#DCCFB9]/50 p-10 text-center max-w-md mx-auto shadow-xs">
            <p className="text-sm font-bold text-[#1D211F] mb-1">No products match your filters</p>
            <p className="text-xs text-[#5C6460] mb-4">Try adjusting your search or category selection.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
                setInStockOnly(false);
              }}
              className="px-5 py-2 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <p className="text-xs text-[#5C6460] px-1">
              Showing <strong className="text-[#1D211F]">{filteredProducts.length}</strong> products
              {selectedCategory !== "all" && (
                <>
                  {" "}in <strong className="text-[#183D2B]">
                    {AURELLE_CATEGORIES.find((c) => c.slug === selectedCategory)?.name}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 text-[#183D2B] font-bold hover:underline"
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
      </div>
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
