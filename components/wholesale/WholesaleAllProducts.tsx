"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";

interface WholesaleAllProductsProps {
  products: any[];
  categories: any[];
}

export default function WholesaleAllProducts({
  products,
  categories,
}: WholesaleAllProductsProps) {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");

  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCat !== "all") {
      list = list.filter((p) => p.category_id === selectedCat || p.category?.slug === selectedCat);
    }

    if (sortBy === "price-low") {
      list.sort((a, b) => (a.wholesale_price || a.retail_price) - (b.wholesale_price || b.retail_price));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => (b.wholesale_price || b.retail_price) - (a.wholesale_price || a.retail_price));
    } else if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [products, selectedCat, sortBy]);

  // Display only 10 products
  const displayed = filtered.slice(0, 10);

  return (
    <section id="all-products" className="py-12 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#14231B]">
              All Products
            </h2>
            <p className="text-xs text-[#5C6460] mt-1">
              Showing {Math.min(10, filtered.length)} of {filtered.length} products available for wholesale ordering with direct B2B pricing.
            </p>
          </div>

          {/* Filters (Hidden on mobile) */}
          <div className="hidden md:flex flex-wrap items-center gap-2.5">
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="h-9 px-3 bg-[#FAF8F5] text-xs font-semibold text-[#14231B] rounded-sm outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-3 bg-[#FAF8F5] text-xs font-semibold text-[#14231B] rounded-sm outline-none cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Alphabetical: A-Z</option>
            </select>
          </div>
        </div>

        {/* Product Grid (10 items) */}
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-[#5C6460]">
            <p className="text-sm font-semibold">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {displayed.map((product) => (
              <div key={product.id}>
                <ProductCard
                  product={product}
                  isWholesaleUser={true}
                  badge={product.is_new_arrival ? "New Arrival" : undefined}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom View All Products Button */}
        <div className="mt-10 sm:mt-14 text-center">
          <Link
            href="/wholesale/shop"
            className="inline-flex items-center justify-center px-9 py-3.5 border border-[#1D211F] bg-transparent text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-200 rounded-none cursor-pointer"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
