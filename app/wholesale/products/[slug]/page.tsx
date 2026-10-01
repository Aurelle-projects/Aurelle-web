"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/utils/price";
import ProductCard from "@/components/product/ProductCard";
import WholesaleEnquiryModal from "@/components/wholesale/WholesaleEnquiryModal";
import { useWholesaleCart } from "@/context/WholesaleCartContext";
import { calculateWholesaleItemPrice, PurchaseMode, WholesaleTierRow } from "@/lib/wholesale/pricing";

interface WholesaleProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function WholesaleProductDetailPage({ params }: WholesaleProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const wholesaleCart = useWholesaleCart();

  const [product, setProduct] = useState<any>(null);
  const [tiers, setTiers] = useState<WholesaleTierRow[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Selected Purchasing Mode
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>("unit");
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "shipping">("details");

  useEffect(() => {
    async function loadProduct() {
      try {
        const supabase = createClient() as any;
        const { data: p, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, sku, category_id, description, benefits, ingredients, usage_instructions,
            retail_price, compare_at_price, wholesale_price, wholesale_moq,
            wholesale_unit_enabled, wholesale_unit_price, wholesale_box_enabled,
            wholesale_units_per_box, wholesale_box_price, wholesale_custom_quantity_enabled,
            is_wholesale_available, is_published, is_featured, is_best_seller, is_new_arrival,
            brand:brands(name, slug),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status, stock_quantity)
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (!error && p) {
          setProduct(p);

          // Fetch wholesale price tiers
          const { data: tierData } = await supabase
            .from("wholesale_price_tiers")
            .select("*")
            .eq("product_id", p.id)
            .eq("is_active", true)
            .order("min_quantity", { ascending: true });

          setTiers(tierData ?? []);

          // Set default mode based on product options
          if (p.wholesale_unit_enabled !== false) {
            setPurchaseMode("unit");
            setQuantity(Math.max(1, p.wholesale_moq || 1));
          } else if (p.wholesale_box_enabled) {
            setPurchaseMode("box");
            setQuantity(1);
          }

          // Related wholesale products
          if (p.category_id) {
            const { data: related } = await supabase
              .from("products")
              .select(`
                id, name, slug, sku, retail_price, compare_at_price, wholesale_price, wholesale_moq,
                is_new_arrival, is_featured, is_best_seller,
                brand:brands(name),
                category:categories(name, slug),
                product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
                inventory(stock_status)
              `)
              .eq("status", "published")
              .eq("category_id", p.category_id)
              .neq("id", p.id)
              .limit(4);

            setRelatedProducts(related ?? []);
          }
        } else {
          notFound();
        }
      } catch {
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  // Compute real-time pricing
  const pricingResult = useMemo(() => {
    if (!product || !product.is_wholesale_available) return null;
    try {
      return calculateWholesaleItemPrice(product, tiers, purchaseMode, quantity);
    } catch {
      return null;
    }
  }, [product, tiers, purchaseMode, quantity]);

  if (isLoading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#5C6460]">Loading wholesale product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Package size={44} className="mx-auto text-[#8E9590]" />
          <p className="text-base font-bold text-[#14231B]">Product not found</p>
          <Link
            href="/wholesale/shop"
            className="inline-flex items-center px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-sm"
          >
            Return to Wholesale Catalog
          </Link>
        </div>
      </div>
    );
  }

  const images = (product.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((img: any) => ({
      url: img.secure_url,
      alt: img.alt_text || product.name,
    }));

  const primaryImage = images[selectedImageIdx] ?? images[0] ?? null;

  const handleAddToCart = async () => {
    if (!pricingResult) return;

    await wholesaleCart.addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        image: primaryImage?.url || null,
        brand_name: product.brand?.name || null,
        wholesale_unit_enabled: product.wholesale_unit_enabled,
        wholesale_unit_price: product.wholesale_unit_price,
        wholesale_box_enabled: product.wholesale_box_enabled,
        wholesale_units_per_box: product.wholesale_units_per_box,
        wholesale_box_price: product.wholesale_box_price,
        wholesale_custom_quantity_enabled: product.wholesale_custom_quantity_enabled,
        wholesale_price: product.wholesale_price,
        is_wholesale_available: product.is_wholesale_available,
      },
      purchaseMode,
      quantity,
      tiers
    );

    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 4000);
  };

  const isUnitOptionAvailable = product.wholesale_unit_enabled !== false;
  const isBoxOptionAvailable = !!product.wholesale_box_enabled;
  const unitMoq = Math.max(1, product.wholesale_moq || 1);
  const minSelectableQuantity = purchaseMode === "unit" ? unitMoq : 1;

  return (
    <div className="bg-white min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Gallery & Commercial Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-sm overflow-hidden bg-[#FAF8F5]">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primaryImage.url} alt={primaryImage.alt} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                  <Package size={56} />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {product.wholesale_moq && (
                  <div className="bg-[#183D2B] text-white text-[11px] font-bold px-2.5 py-1 rounded-sm shadow-xs uppercase tracking-wider">
                    MOQ: {product.wholesale_moq} units
                  </div>
                )}
                {product.wholesale_units_per_box && (
                  <div className="bg-[#C9A84C] text-[#14231B] text-[11px] font-bold px-2.5 py-1 rounded-sm shadow-xs uppercase tracking-wider">
                    {product.wholesale_units_per_box} pcs / box
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-sm overflow-hidden shrink-0 transition-opacity cursor-pointer ${
                      selectedImageIdx === idx ? "opacity-100 ring-2 ring-[#183D2B]" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Commercial Details & Purchasing Options */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#183D2B]">
                {product.brand?.name || "Aurelle"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-[#14231B] leading-tight">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-xs text-[#8E9590] font-mono mt-1">SKU: {product.sku}</p>
              )}
            </div>

            {/* PURCHASING METHOD SELECTOR */}
            <div className="space-y-3 pt-2 border-t border-[#EFEAE0]">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14231B]">
                Select Purchase Option
              </label>

              <div className="grid grid-cols-1 gap-3">
                {/* Single Unit Mode */}
                {isUnitOptionAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("unit");
                      setQuantity((q) => Math.max(unitMoq, q));
                    }}
                    className={`p-4 rounded-md border text-left transition-all cursor-pointer ${
                      purchaseMode === "unit"
                        ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                        : "border-[#EFEAE0] bg-white hover:border-[#183D2B]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            purchaseMode === "unit" ? "border-[#183D2B] bg-[#183D2B]" : "border-[#8E9590]"
                          }`}
                        >
                          {purchaseMode === "unit" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-[#14231B] uppercase tracking-wider">Single Unit / Piece</span>
                      </div>
                      <span className="text-sm font-bold text-[#183D2B]">
                        {formatPrice(Number(product.wholesale_unit_price ?? product.wholesale_price ?? 0))}
                        <span className="text-[10px] text-[#8E9590] font-normal"> / piece</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6460] mt-1.5 pl-6">
                      Purchased in individual units (Minimum Order Quantity: {unitMoq} {unitMoq === 1 ? "unit" : "units"}).
                    </p>

                    {/* Volume tiers notice under single unit mode */}
                    {tiers.length > 0 && (
                      <div className="mt-2.5 pl-6 flex flex-wrap gap-2">
                        {tiers.map((t) => (
                          <div
                            key={t.id}
                            className={`text-[10px] px-2 py-0.5 rounded-sm border ${
                              purchaseMode === "unit" && pricingResult?.tierPriceApplied === Number(t.price_per_unit)
                                ? "bg-[#183D2B] text-white border-[#183D2B] font-bold"
                                : "bg-[#FAF8F5] text-[#5C6460] border-[#EFEAE0]"
                            }`}
                          >
                            {t.min_quantity}–{t.max_quantity ?? "+"} units: {formatPrice(Number(t.price_per_unit))}/pc
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                )}

                {/* Full Box Mode */}
                {isBoxOptionAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      setPurchaseMode("box");
                      setQuantity(1);
                    }}
                    className={`p-4 rounded-md border text-left transition-all cursor-pointer ${
                      purchaseMode === "box"
                        ? "border-[#183D2B] bg-[#183D2B]/5 ring-1 ring-[#183D2B]"
                        : "border-[#EFEAE0] bg-white hover:border-[#183D2B]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            purchaseMode === "box" ? "border-[#183D2B] bg-[#183D2B]" : "border-[#8E9590]"
                          }`}
                        >
                          {purchaseMode === "box" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#14231B] uppercase tracking-wider">Full Box / Carton</span>
                          <span className="ml-2 text-[10px] font-bold bg-[#C9A84C] text-[#14231B] px-1.5 py-0.5 rounded-xs">
                            {product.wholesale_units_per_box} pieces included
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#183D2B]">
                        {formatPrice(Number(product.wholesale_box_price ?? 0))}
                        <span className="text-[10px] text-[#8E9590] font-normal"> / box</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6460] mt-1.5 pl-6">
                      Configured box price ({formatPrice(Number(product.wholesale_box_price ?? 0))} per {product.wholesale_units_per_box}-piece carton).
                    </p>
                  </button>
                )}
              </div>
            </div>

            {/* QUANTITY STEPPER & SUBTOTAL */}
            <div className="p-4 bg-[#FAF8F5] rounded-sm space-y-3 border border-[#EFEAE0]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[#14231B] block">
                    Quantity ({purchaseMode === "box" ? "Boxes" : "Units"})
                  </label>
                  {purchaseMode === "unit" && unitMoq > 1 && (
                    <span className="text-[10px] text-[#183D2B] font-semibold">
                      Minimum {unitMoq} units required
                    </span>
                  )}
                </div>

                <div className="flex items-center bg-white rounded-sm border border-[#DCCFB9]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(minSelectableQuantity, q - 1))}
                    disabled={quantity <= minSelectableQuantity}
                    className="w-10 h-10 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] transition-colors cursor-pointer disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min={minSelectableQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setQuantity(Math.max(minSelectableQuantity, val));
                    }}
                    className="w-16 text-center text-sm font-bold text-[#14231B] bg-transparent outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Dynamic Pricing Summary */}
              {pricingResult && (
                <div className="pt-2 border-t border-[#EFEAE0] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#8E9590] block">
                      Total Pieces Included: <strong>{pricingResult.totalUnits} pcs</strong>
                    </span>
                    <span className="text-[11px] text-[#5C6460]">
                      Rate: {formatPrice(pricingResult.effectiveUnitPrice)} / {purchaseMode === "box" ? "box" : "unit"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#8E9590] uppercase tracking-wider block font-bold">Subtotal</span>
                    <span className="text-xl font-bold text-[#183D2B]">
                      {formatPrice(pricingResult.subtotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* CTA BUTTONS */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-6 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#183D2B] hover:bg-[#102D20] text-white transition-colors cursor-pointer shadow-xs"
              >
                <ShoppingBag size={16} />
                <span>Add to Wholesale Cart</span>
              </button>

              <button
                type="button"
                onClick={() => setEnquiryModalOpen(true)}
                className="w-full py-3 px-6 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B]/5 transition-colors cursor-pointer"
              >
                <Send size={14} />
                <span>Request Custom Commercial Enquiry</span>
              </button>
            </div>

            {/* Success Feedback Notification */}
            {addedSuccess && (
              <div className="p-3 bg-[#183D2B]/10 border border-[#183D2B]/30 rounded-sm flex items-center justify-between text-xs font-bold text-[#183D2B] animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Added {quantity} {purchaseMode === "box" ? "box(es)" : "unit(s)"} to Wholesale Cart!</span>
                </div>
                <Link href="/wholesale/cart" className="underline hover:text-[#102D20]">
                  View Wholesale Cart &rarr;
                </Link>
              </div>
            )}

            {/* B2B Trust Pillars */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#EFEAE0] text-center">
              <div className="space-y-1">
                <Truck size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">Dubai Warehouse</p>
                <p className="text-[10px] text-[#8E9590]">24-48h GCC Freight</p>
              </div>
              <div className="space-y-1">
                <ShieldCheck size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">TRN Tax Invoice</p>
                <p className="text-[10px] text-[#8E9590]">5% VAT Compliant</p>
              </div>
              <div className="space-y-1">
                <Package size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">Authentic Goods</p>
                <p className="text-[10px] text-[#8E9590]">Direct Sourced</p>
              </div>
            </div>

            {/* Details tabs */}
            <div className="pt-4">
              <div className="flex gap-4 border-b border-[#EFEAE0]">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "details"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Product Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ingredients")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "ingredients"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Ingredients
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "shipping"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Wholesale Freight
                </button>
              </div>

              <div className="pt-4 text-xs text-[#5C6460] leading-relaxed">
                {activeTab === "details" && (
                  <div className="space-y-2">
                    <p>{product.description || "Commercial product specification provided by manufacturer."}</p>
                    {product.usage_instructions && (
                      <p><strong>Application:</strong> {product.usage_instructions}</p>
                    )}
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <p className="font-mono text-[11px]">
                    {product.ingredients || "Full INCI ingredient list is registered with Dubai Municipality."}
                  </p>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-1.5">
                    <p>Wholesale orders are consolidated from our Dubai temperature-controlled facility.</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Pallet &amp; carton dispatch across Dubai, Abu Dhabi, Sharjah: 24–48 hours.</li>
                      <li>GCC Regional Cross-border Freight (Saudi Arabia, Oman, Qatar, Bahrain, Kuwait): 3–5 business days.</li>
                      <li>Standard commercial packing slips and verified batch numbers provided.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Wholesale Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-[#EFEAE0] space-y-6">
            <h3 className="text-lg font-bold text-[#14231B]">
              Related Wholesale Products
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} isWholesaleUser={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {product && (
        <WholesaleEnquiryModal
          open={enquiryModalOpen}
          onClose={() => setEnquiryModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            wholesale_price: Number(product.wholesale_unit_price ?? product.wholesale_price ?? 0),
            retail_price: Number(product.retail_price || 0),
            wholesale_moq: product.wholesale_moq,
            brand: product.brand,
            category: product.category,
            image: primaryImage?.url,
          }}
          initialQuantity={quantity}
        />
      )}
    </div>
  );
}
