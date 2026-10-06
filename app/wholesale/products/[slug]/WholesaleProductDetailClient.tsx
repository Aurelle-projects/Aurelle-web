"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Truck,
  ShieldCheck,
  Send,
  Package,
  Minus,
  Plus,
  ShoppingBag,
  Info,
  CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/utils/price";
import ProductCard from "@/components/product/ProductCard";
import WholesaleEnquiryModal from "@/components/wholesale/WholesaleEnquiryModal";
import { useWholesaleCart } from "@/context/WholesaleCartContext";
import { calculateWholesaleItemPrice, PurchaseMode, WholesaleTierRow } from "@/lib/wholesale/pricing";

interface WholesaleProductDetailClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProduct: any;
  initialTiers?: WholesaleTierRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialRelatedProducts?: any[];
  slug: string;
}

export default function WholesaleProductDetailClient({
  initialProduct,
  initialTiers = [],
  initialRelatedProducts = [],
  slug,
}: WholesaleProductDetailClientProps) {
  const router = useRouter();
  const wholesaleCart = useWholesaleCart();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [product, setProduct] = useState<any>(initialProduct);
  const [tiers, setTiers] = useState<WholesaleTierRow[]>(initialTiers);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>(initialRelatedProducts);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Selected Purchasing Mode
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(
    initialProduct?.wholesale_unit_enabled !== false ? "unit" : "box"
  );
  const [quantity, setQuantity] = useState(
    initialProduct?.wholesale_unit_enabled !== false
      ? Math.max(1, initialProduct?.wholesale_moq || 1)
      : 1
  );
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "shipping">("details");

  useEffect(() => {
    if (!product && initialProduct) {
      setProduct(initialProduct);
      setTiers(initialTiers);
      setRelatedProducts(initialRelatedProducts);
      setIsLoading(false);
    }
  }, [product, initialProduct, initialTiers, initialRelatedProducts]);

  // Compute real-time pricing
  const pricingResult = useMemo(() => {
    if (!product || !product.is_wholesale_available || product.is_out_of_stock) return null;
    try {
      return calculateWholesaleItemPrice(product, tiers, purchaseMode, quantity);
    } catch {
      return null;
    }
  }, [product, tiers, purchaseMode, quantity]);

  // Luxury shimmer skeleton fallback (zero round spinner)
  if (isLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-4 w-48 bg-[#E9E4DC] rounded-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 aspect-[3/4] bg-[#E9E4DC] rounded-none" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-4 w-28 bg-[#E9E4DC]" />
              <div className="h-8 w-3/4 bg-[#E9E4DC]" />
              <div className="h-6 w-32 bg-[#E9E4DC]" />
              <div className="h-24 w-full bg-[#E9E4DC]" />
              <div className="h-12 w-full bg-[#183D2B]/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Package size={44} className="mx-auto text-[#8E9590]" />
          <h2 className="text-lg font-bold text-[#1D211F]">Wholesale Item Not Found</h2>
          <p className="text-xs text-[#5C6460]">The requested item is not active for commercial trade.</p>
          <Link
            href="/wholesale"
            className="inline-block mt-2 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-none hover:bg-[#102D20] transition-colors"
          >
            Back to Wholesale Hub
          </Link>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images = (product.product_images || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => img.secure_url)
    .filter(Boolean);

  const primaryImage = images[selectedImageIdx] || images[0];

  const brandName = Array.isArray(product.brand) ? product.brand[0]?.name : product.brand?.name;
  const categoryName = Array.isArray(product.category) ? product.category[0]?.name : product.category?.name;

  const moqUnits = product.wholesale_moq || 1;
  const unitsPerBox = product.wholesale_units_per_box || 1;

  function handleModeChange(mode: PurchaseMode) {
    setPurchaseMode(mode);
    if (mode === "unit") {
      setQuantity(Math.max(1, moqUnits));
    } else {
      setQuantity(1);
    }
  }

  function handleQuantityChange(delta: number) {
    const minQty = purchaseMode === "unit" ? moqUnits : 1;
    setQuantity((q) => Math.max(minQty, q + delta));
  }

  function handleAddToCart() {
    if (!pricingResult || product.is_out_of_stock) return;

    wholesaleCart.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        image: primaryImage,
        brand_name: brandName || null,
        wholesale_unit_enabled: product.wholesale_unit_enabled,
        wholesale_unit_price: product.wholesale_unit_price,
        wholesale_box_enabled: product.wholesale_box_enabled,
        wholesale_units_per_box: product.wholesale_units_per_box,
        wholesale_box_price: product.wholesale_box_price,
        wholesale_custom_quantity_enabled: product.wholesale_custom_quantity_enabled,
        wholesale_price: product.wholesale_price,
        wholesale_moq: product.wholesale_moq,
        is_wholesale_available: product.is_wholesale_available,
        is_out_of_stock: product.is_out_of_stock,
      },
      purchaseMode,
      quantity,
      tiers
    );

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2200);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#5C6460]">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/wholesale" className="hover:text-[#183D2B] transition-colors">
                Wholesale Portal
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/wholesale#catalog" className="hover:text-[#183D2B] transition-colors">
                Catalog
              </Link>
            </li>
            {categoryName && (
              <>
                <li>/</li>
                <li className="text-[#5C6460]">{categoryName}</li>
              </>
            )}
            <li>/</li>
            <li className="font-semibold text-[#14231B] truncate max-w-xs">{product.name}</li>
          </ol>
        </nav>

        {/* ── Main Product Section ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Gallery (Col 7) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[560px] pb-2 md:pb-0 scrollbar-none">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-20 md:w-20 md:h-24 shrink-0 rounded-none overflow-hidden border transition-all ${
                      selectedImageIdx === idx
                        ? "border-[#183D2B] ring-1 ring-[#183D2B]"
                        : "border-[#DCCFB9]/60 hover:border-[#183D2B]/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative aspect-[3/4] bg-white rounded-none border border-[#DCCFB9]/60 overflow-hidden shadow-xs flex items-center justify-center">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl font-extrabold text-[#183D2B]/10 uppercase">
                  {product.name?.charAt(0) ?? "A"}
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                <span className="bg-[#183D2B] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">
                  B2B Distribution
                </span>
                {product.is_out_of_stock && (
                  <span className="bg-[#1D211F]/90 text-white text-[10px] font-semibold tracking-wider px-2.5 py-1 uppercase">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Buy Box (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                {brandName && (
                  <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
                    {brandName}
                  </span>
                )}
                <span className="text-xs text-[#8E9590]">•</span>
                <span className="text-xs font-semibold text-[#8E9590]">SKU: {product.sku || "N/A"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1D211F] mt-1 leading-tight tracking-tight">
                {product.name}
              </h1>
            </div>

            {/* Price Box */}
            <div className="border-y border-[#DCCFB9]/40 py-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#8E9590] uppercase tracking-wider block">Wholesale Rate</span>
                  <span className="text-2xl sm:text-3xl font-bold text-[#1D211F] tracking-tight">
                    {pricingResult ? formatPrice(pricingResult.effectiveUnitPrice) : formatPrice(product.wholesale_price || 0)}
                    <span className="text-xs font-normal text-[#5C6460] font-sans ml-1">/ unit</span>
                  </span>
                </div>
                {product.retail_price && (
                  <div className="text-right">
                    <span className="text-[11px] text-[#8E9590] block">Retail Reference (MSRP)</span>
                    <span className="text-sm font-semibold text-[#5C6460] line-through">
                      {formatPrice(product.retail_price)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-[#8E9590]">
                Commercial pricing excludes VAT where applicable. Minimum order requirement enforced per SKU.
              </p>
            </div>

            {/* Purchasing Mode Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1D211F] block">
                Purchase Structure
              </label>
              <div className="grid grid-cols-2 gap-3">
                {product.wholesale_unit_enabled !== false && (
                  <button
                    type="button"
                    onClick={() => handleModeChange("unit")}
                    className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                      purchaseMode === "unit"
                        ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                        : "border-[#DCCFB9] bg-white hover:border-[#183D2B]/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#1D211F] block">By Individual Unit</span>
                    <span className="text-[11px] text-[#5C6460] block mt-0.5">
                      Min Order: {moqUnits} pcs
                    </span>
                  </button>
                )}
                {product.wholesale_box_enabled && (
                  <button
                    type="button"
                    onClick={() => handleModeChange("box")}
                    className={`p-3 text-left border rounded-none transition-all cursor-pointer ${
                      purchaseMode === "box"
                        ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                        : "border-[#DCCFB9] bg-white hover:border-[#183D2B]/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-[#1D211F] block">Master Carton / Box</span>
                    <span className="text-[11px] text-[#5C6460] block mt-0.5">
                      {unitsPerBox} units per carton
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Quantity Controls & Dynamic Order Total */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#DCCFB9] rounded-none bg-white">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(purchaseMode === "unit" ? -1 : -1)}
                    disabled={quantity <= (purchaseMode === "unit" ? moqUnits : 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-14 text-center text-sm font-semibold text-[#1D211F]">
                    {quantity} {purchaseMode === "unit" ? "pcs" : "boxes"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(purchaseMode === "unit" ? 1 : 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex-1 bg-white border border-[#DCCFB9]/70 px-4 py-2 flex items-center justify-between">
                  <span className="text-xs text-[#5C6460]">Total ({pricingResult?.totalUnits || 0} pcs):</span>
                  <span className="text-base font-bold text-[#183D2B]">
                    {pricingResult ? formatPrice(pricingResult.subtotal) : "—"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.is_out_of_stock || !pricingResult}
                  className={`w-full h-11 px-6 text-xs uppercase tracking-widest font-bold rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    addedSuccess
                      ? "bg-[#183D2B] text-white"
                      : "bg-[#183D2B] text-white hover:bg-[#102D20] active:scale-[0.99] disabled:opacity-40"
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check size={16} />
                      <span>Added to Wholesale Order</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} />
                      <span>Add to Wholesale Order</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEnquiryModalOpen(true)}
                  className="w-full h-10 border border-[#DCCFB9] text-[#1D211F] hover:border-[#183D2B] hover:text-[#183D2B] text-xs uppercase tracking-wider font-semibold rounded-none transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
                >
                  <Send size={13} />
                  <span>Request Custom Bulk / Container Quote</span>
                </button>
              </div>
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#DCCFB9]/40 text-center">
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Truck size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Consolidated Freight</span>
                <span className="text-[10px] text-[#8E9590]">Across GCC</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <ShieldCheck size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Commercial Invoicing</span>
                <span className="text-[10px] text-[#8E9590]">TRN Compliant</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <CheckCircle2 size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Guaranteed Lot</span>
                <span className="text-[10px] text-[#8E9590]">Fresh Expiry</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Wholesale Specifications Tabs ──────────────────────────────── */}
        <div className="bg-white rounded-none border border-[#DCCFB9]/60 p-6 md:p-8 shadow-xs">
          <div className="flex border-b border-[#DCCFB9]/40 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "details"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Commercial Specifications
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ingredients")}
              className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "ingredients"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Ingredients & Compliance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "shipping"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Logistics & Palletizing
            </button>
          </div>

          <div className="pt-6 text-sm text-[#5C6460] leading-relaxed">
            {activeTab === "details" && (
              <div className="space-y-4">
                <p>{product.description || "Commercial catalog listing for verified B2B partners."}</p>
                {product.benefits && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D211F] mb-1">
                      Target Consumer Benefits:
                    </h4>
                    <p className="whitespace-pre-line">{product.benefits}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-4">
                {product.ingredients ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D211F] mb-1">
                      Full Formulation & INCI:
                    </h4>
                    <p className="text-xs font-mono bg-[#FAF8F5] p-3 border border-[#DCCFB9]/40 rounded-sm">
                      {product.ingredients}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#8E9590]">Full INCI formulation sheet available upon trade request.</p>
                )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-3">
                <p>
                  Warehoused in Dubai Industrial Area. Palletized and temperature-controlled dispatch across UAE, KSA, Oman, Qatar, Bahrain, and Kuwait.
                </p>
                <p>
                  Standard domestic commercial delivery fulfilled within 48 business hours of payment confirmation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Wholesale Products ──────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <h3 className="text-xl font-bold text-[#1D211F] tracking-tight">Related Commercial SKUs</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} isWholesaleUser={true} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {enquiryModalOpen && (
        <WholesaleEnquiryModal
          open={enquiryModalOpen}
          onClose={() => setEnquiryModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            wholesale_price: product.wholesale_price,
            retail_price: product.retail_price,
            wholesale_moq: product.wholesale_moq,
            brand: { name: brandName },
            category: { name: categoryName },
            image: primaryImage,
          }}
          initialQuantity={quantity}
        />
      )}
    </div>
  );
}
