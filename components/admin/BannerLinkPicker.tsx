"use client";

import React, { useState, useEffect } from "react";

export interface BannerLinkPickerProps {
  value: string;
  onChange: (value: string) => void;
  mode?: "wholesale" | "retail";
  label?: string;
  placeholder?: string;
}

export default function BannerLinkPicker({
  value,
  onChange,
  mode = "wholesale",
  label = "Banner Link Href",
  placeholder = mode === "wholesale"
    ? "#all-products or /wholesale/products/..."
    : "#all-products or /products/...",
}: BannerLinkPickerProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [products, setProducts] = useState<
    { id: string; name: string; slug: string; category_id: string | null }[]
  >([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/admin/categories"),
          fetch("/api/admin/products"),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (isMounted) {
          if (catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          }
          if (prodData.success && Array.isArray(prodData.products)) {
            setProducts(prodData.products);
          }
          setLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load categories/products for banner picker:", err);
        if (isMounted) setLoaded(true);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync internal dropdown states when incoming value or products/categories change
  useEffect(() => {
    if (!value || !loaded) {
      if (!value) {
        setCategoryId("");
        setSelectedProductId("");
      }
      return;
    }

    const trimmed = value.trim();

    // 1. Check if value is a specific product URL
    const productPrefix = mode === "wholesale" ? "/wholesale/products/" : "/products/";
    if (trimmed.startsWith(productPrefix)) {
      const slug = trimmed.replace(productPrefix, "").split("?")[0].split("#")[0];
      const matchedProd = products.find((p) => p.slug === slug);
      if (matchedProd) {
        setSelectedProductId(matchedProd.id);
        if (matchedProd.category_id) {
          setCategoryId(matchedProd.category_id);
        }
        return;
      }
    }

    // 2. Check if value is a category shop filter URL
    const shopPrefix = mode === "wholesale" ? "/wholesale/shop?category=" : "/shop?category=";
    if (trimmed.startsWith(shopPrefix)) {
      const catParam = trimmed.replace(shopPrefix, "").split("&")[0].split("#")[0];
      const matchedCat = categories.find((c) => c.slug === catParam || c.id === catParam);
      if (matchedCat) {
        setCategoryId(matchedCat.id);
        setSelectedProductId("");
        return;
      }
    }
  }, [value, loaded, products, categories, mode]);

  const filteredProducts = products.filter((p) => p.category_id === categoryId);
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCatId = e.target.value;
    setCategoryId(newCatId);
    setSelectedProductId("");

    if (!newCatId) {
      onChange("");
      return;
    }

    const cat = categories.find((c) => c.id === newCatId);
    if (cat) {
      const redirectUrl =
        mode === "wholesale"
          ? `/wholesale/shop?category=${cat.slug || cat.id}`
          : `/shop?category=${cat.slug || cat.id}`;
      onChange(redirectUrl);
    }
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProdId = e.target.value;
    setSelectedProductId(newProdId);

    if (!newProdId) {
      // Revert to category shop redirect
      if (selectedCategoryObj) {
        const redirectUrl =
          mode === "wholesale"
            ? `/wholesale/shop?category=${selectedCategoryObj.slug || selectedCategoryObj.id}`
            : `/shop?category=${selectedCategoryObj.slug || selectedCategoryObj.id}`;
        onChange(redirectUrl);
      } else {
        onChange("");
      }
      return;
    }

    const prod = products.find((p) => p.id === newProdId);
    if (prod) {
      const redirectUrl =
        mode === "wholesale"
          ? `/wholesale/products/${prod.slug}`
          : `/products/${prod.slug}`;
      onChange(redirectUrl);
    }
  };

  const selectClass =
    "w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B] transition-colors";

  return (
    <div className="space-y-2">
      {/* Category selector */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6460] mb-1">
          Select Category (Redirects to Shop Category Filter)
        </label>
        <select
          className={selectClass}
          value={categoryId}
          onChange={handleCategoryChange}
          disabled={!loaded}
        >
          <option value="">-- Choose Category --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product selector */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6460] mb-1">
          Select Product (Redirects Directly to Product Details)
        </label>
        <select
          className={`${selectClass} ${
            !categoryId || filteredProducts.length === 0
              ? "bg-[#FAF8F5] text-[#8C938F]"
              : "bg-white"
          }`}
          value={selectedProductId}
          onChange={handleProductChange}
          disabled={!categoryId || !loaded || filteredProducts.length === 0}
        >
          <option value="">
            {!categoryId
              ? "Select a category first"
              : filteredProducts.length === 0
              ? "No products in this category (stays on Category Shop)"
              : `All ${selectedCategoryObj?.name || ""} Products (Category View)`}
          </option>
          {filteredProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Generated / Manual Link Href */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#5C6460] mb-1">
          {label}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-sm text-xs text-[#14231B] outline-none focus:border-[#183D2B]"
        />
        {value && (
          <p className="text-[10px] text-[#183D2B] font-medium mt-1 truncate">
            Target redirect: <span className="font-mono text-[#5C6460]">{value}</span>
          </p>
        )}
      </div>
    </div>
  );
}
