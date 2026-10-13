"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, Plus, Trash2, ExternalLink, Layers, Check, ChevronDown, X, Sparkles } from "lucide-react";

export interface LinkedVariantItem {
  product_id: string;
  name: string;
  slug: string;
  size_label: string;
  retail_price?: number;
  is_out_of_stock?: boolean;
}

export interface LinkedVariantsSettings {
  size_label: string;
  variants: LinkedVariantItem[];
}

interface ProductLinkedVariantsEditorProps {
  settings: LinkedVariantsSettings;
  onChange: (settings: LinkedVariantsSettings) => void;
  currentProductId?: string;
  currentBrandId?: string;
  currentProductName?: string;
}

interface AvailableProduct {
  id: string;
  name: string;
  slug: string;
  brand_id?: string | null;
  retail_price?: number | null;
  is_out_of_stock?: boolean | null;
  specifications?: any;
}

// Helper to auto-extract size/volume like "473 ml", "237ml", "50 g", "1.7 oz" from product name
function extractSizeFromName(name: string): string {
  if (!name) return "";
  const match = name.match(/\b(\d+(?:\.\d+)?\s*(?:ml|g|oz|fl\s*oz|l|kg|pcs|count|sachets))\b/i);
  return match && match[1] ? match[1].trim() : "";
}

export default function ProductLinkedVariantsEditor({
  settings,
  onChange,
  currentProductId,
  currentBrandId,
  currentProductName = "",
}: ProductLinkedVariantsEditorProps) {
  const [allProducts, setAllProducts] = useState<AvailableProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-detect current product size label if empty and product name is provided
  useEffect(() => {
    if (!settings.size_label && currentProductName) {
      const detected = extractSizeFromName(currentProductName);
      if (detected) {
        onChange({
          ...settings,
          size_label: detected,
        });
      }
    }
  }, [currentProductName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load available products for searchable dropdown
  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch("/api/admin/products");
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.products && Array.isArray(json.products)) {
            setAllProducts(json.products);
          }
        }
      } catch (err) {
        console.warn("[ProductLinkedVariantsEditor] Failed to fetch product list:", err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    }
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter available products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    // Exclude current product and already linked products
    const alreadyLinkedIds = new Set(settings.variants.map((v) => v.product_id));
    if (currentProductId) alreadyLinkedIds.add(currentProductId);

    return allProducts
      .filter((p) => !alreadyLinkedIds.has(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Prioritize products from same brand
        if (currentBrandId) {
          if (a.brand_id === currentBrandId && b.brand_id !== currentBrandId) return -1;
          if (b.brand_id === currentBrandId && a.brand_id !== currentBrandId) return 1;
        }
        return a.name.localeCompare(b.name);
      });
  }, [allProducts, searchQuery, settings.variants, currentProductId, currentBrandId]);

  function handleAddProduct(product: AvailableProduct) {
    const autoLabel =
      (product.specifications && product.specifications.size_label) ||
      extractSizeFromName(product.name) ||
      "Other Size";

    const newVariant: LinkedVariantItem = {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      size_label: autoLabel,
      retail_price: product.retail_price ?? undefined,
      is_out_of_stock: product.is_out_of_stock ?? false,
    };

    onChange({
      ...settings,
      variants: [...settings.variants, newVariant],
    });

    setSearchQuery("");
    setIsDropdownOpen(false);
  }

  function handleRemoveVariant(idx: number) {
    const updated = settings.variants.filter((_, i) => i !== idx);
    onChange({
      ...settings,
      variants: updated,
    });
  }

  function handleUpdateVariantLabel(idx: number, newLabel: string) {
    const updated = settings.variants.map((v, i) =>
      i === idx ? { ...v, size_label: newLabel } : v
    );
    onChange({
      ...settings,
      variants: updated,
    });
  }

  function handleCurrentSizeChange(newLabel: string) {
    onChange({
      ...settings,
      size_label: newLabel,
    });
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/60 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#DCCFB9]/30 pb-3">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#183D2B]" />
          <div>
            <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider">
              Linked Sizes & Bottle Volumes (Optional)
            </h2>
            <p className="text-xs text-[#5C6460] mt-0.5">
              Link other bottle sizes (e.g. 237 ml and 473 ml) so buyers can click to switch between bottles on the storefront.
            </p>
          </div>
        </div>
        {settings.variants.length > 0 && (
          <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
            {settings.variants.length} linked {settings.variants.length === 1 ? "size" : "sizes"}
          </span>
        )}
      </div>

      {/* Current Product Size Label */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#FAF8F5] rounded-lg border border-[#DCCFB9]/50">
        <div className="md:col-span-1">
          <label className="block text-xs font-bold text-[#183D2B] uppercase tracking-wider mb-1">
            Current Product Size Label
          </label>
          <p className="text-[11px] text-[#5C6460]">
            The bottle size for this specific product card (e.g. 237 ml, 473 ml, 50 g).
          </p>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <input
            type="text"
            value={settings.size_label}
            onChange={(e) => handleCurrentSizeChange(e.target.value)}
            placeholder="e.g. 237 ml or 473 ml"
            className="flex-1 h-10 px-3.5 bg-white border border-[#DCCFB9] rounded-lg text-xs font-bold text-[#183D2B] outline-none focus:border-[#183D2B]"
          />
          {currentProductName && !settings.size_label && extractSizeFromName(currentProductName) && (
            <button
              type="button"
              onClick={() => handleCurrentSizeChange(extractSizeFromName(currentProductName))}
              className="h-10 px-3 text-xs bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg font-medium flex items-center gap-1.5 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Use &ldquo;{extractSizeFromName(currentProductName)}&rdquo;</span>
            </button>
          )}
        </div>
      </div>

      {/* Linked Variants List */}
      {settings.variants.length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
            Connected Sizes (Linked Bottles)
          </label>
          <div className="space-y-2.5">
            {settings.variants.map((v, idx) => (
              <div
                key={v.product_id}
                className="flex items-center gap-3 p-3 bg-[#FAF8F5] border border-[#DCCFB9]/80 rounded-lg hover:border-[#183D2B]/50 transition-colors"
              >
                {/* Size Label Input */}
                <div className="w-36 shrink-0">
                  <span className="block text-[10px] uppercase font-bold text-[#8E9590] mb-0.5">
                    Button Label
                  </span>
                  <input
                    type="text"
                    value={v.size_label}
                    onChange={(e) => handleUpdateVariantLabel(idx, e.target.value)}
                    placeholder="e.g. 473 ml"
                    className="w-full h-8 px-2.5 bg-white border border-[#DCCFB9] rounded-md text-xs font-bold text-[#183D2B] outline-none focus:border-[#183D2B]"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] uppercase font-bold text-[#8E9590] mb-0.5">
                    Target Product
                  </span>
                  <p className="text-xs font-semibold text-[#1D211F] truncate" title={v.name}>
                    {v.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {v.retail_price !== undefined && (
                      <span className="text-[11px] text-[#5C6460] font-medium">
                        AED {Number(v.retail_price).toFixed(2)}
                      </span>
                    )}
                    {v.is_out_of_stock ? (
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 rounded font-semibold">
                        Out of stock
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-semibold">
                        In stock
                      </span>
                    )}
                    <a
                      href={`/products/${v.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[#183D2B] hover:underline flex items-center gap-0.5 ml-auto"
                    >
                      <span>View</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                  title="Remove linked size"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Searchable Product Dropdown to Link */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
          Link Another Size / Bottle
        </label>
        <div ref={dropdownRef} className="relative">
          <div
            onClick={() => setIsDropdownOpen(true)}
            className="flex items-center h-10 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg cursor-pointer hover:border-[#183D2B]"
          >
            <Search size={15} className="text-[#8E9590] mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search product by name or brand to link..."
              className="flex-1 bg-transparent text-xs text-[#1D211F] outline-none placeholder:text-[#8E9590]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="text-[#8E9590] hover:text-[#1D211F] p-1"
              >
                <X size={13} />
              </button>
            )}
            <ChevronDown size={14} className="text-[#8E9590] ml-1.5 shrink-0" />
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-[#DCCFB9] rounded-lg shadow-lg max-h-64 overflow-y-auto divide-y divide-neutral-100">
              {isLoadingProducts ? (
                <div className="p-4 text-center text-xs text-[#8E9590]">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8E9590]">
                  No matching products found.
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const detected =
                    (p.specifications && p.specifications.size_label) ||
                    extractSizeFromName(p.name);
                  const isSameBrand = currentBrandId && p.brand_id === currentBrandId;

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAddProduct(p)}
                      className="p-3 hover:bg-[#F7F5EF] cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#1D211F] truncate">
                            {p.name}
                          </span>
                          {isSameBrand && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-[#183D2B]/10 text-[#183D2B] rounded font-semibold shrink-0">
                              Same Brand
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5C6460]">
                          {p.retail_price !== undefined && p.retail_price !== null && (
                            <span>AED {Number(p.retail_price).toFixed(2)}</span>
                          )}
                          {p.is_out_of_stock ? (
                            <span className="text-red-500 font-medium">Out of stock</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">In stock</span>
                          )}
                          {detected && (
                            <span className="text-[#183D2B] font-bold bg-amber-50 border border-amber-200 px-1.5 rounded">
                              Size: {detected}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-xs bg-[#183D2B] text-white rounded font-medium flex items-center gap-1 shrink-0 hover:bg-[#102D20]"
                      >
                        <Plus size={12} />
                        <span>Link</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Storefront Preview */}
      {(settings.size_label || settings.variants.length > 0) && (
        <div className="mt-4 pt-4 border-t border-[#DCCFB9]/40 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#183D2B]">
            <Check size={14} className="text-emerald-600" />
            <span>Live Storefront Preview (How Buyers Will See It)</span>
          </div>

          <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-lg space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1D211F] block">
              Size / Volume:
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Current Product Pill */}
              <div className="px-3 py-1.5 text-xs font-bold rounded-lg border-2 border-[#183D2B] bg-[#183D2B]/10 text-[#183D2B] flex items-center gap-1.5 shadow-xs">
                <span>{settings.size_label || "Current Product"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#183D2B]" />
                <span className="text-[10px] font-normal uppercase tracking-wider opacity-80">(Active)</span>
              </div>

              {/* Linked Variants */}
              {settings.variants.map((v, i) => (
                <div
                  key={i}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 ${
                    v.is_out_of_stock
                      ? "border-neutral-200 bg-neutral-100/80 text-neutral-400"
                      : "border-[#DCCFB9] bg-white text-[#1D211F]"
                  }`}
                >
                  <span>{v.size_label || "Size"}</span>
                  {v.retail_price && (
                    <span className="text-[10px] text-[#8E9590]">AED {Number(v.retail_price).toFixed(2)}</span>
                  )}
                  {v.is_out_of_stock && (
                    <span className="text-[9px] text-red-500 font-bold uppercase">Out of stock</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
