"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Package,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ComboOffer } from "@/types/combo";
import ComboCard from "@/components/product/ComboCard";

interface ComboDetailClientProps {
  initialCombo: ComboOffer;
  initialOtherCombos?: ComboOffer[];
  slug: string;
}

export default function ComboDetailClient({
  initialCombo,
  initialOtherCombos = [],
  slug,
}: ComboDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [combo, setCombo] = useState<ComboOffer | null>(initialCombo);
  const [otherCombos, setOtherCombos] = useState<ComboOffer[]>(initialOtherCombos);
  const [loading, setLoading] = useState(!initialCombo);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "included" | "shipping">("details");

  useEffect(() => {
    if (!combo && initialCombo) {
      setCombo(initialCombo);
      setLoading(false);
    }
  }, [combo, initialCombo]);

  // Luxury shimmer skeleton fallback (zero round spinner)
  if (loading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-4 w-48 bg-[#E9E4DC]" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-7 aspect-[4/3] bg-[#E9E4DC]" />
            <div className="lg:col-span-5 space-y-6">
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

  if (!combo) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-[#8E9590]" />
          <p className="text-lg font-bold text-[#14231B]">Combo not found</p>
          <Link
            href="/combos"
            className="inline-flex items-center mt-4 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-sm hover:bg-[#102D20] transition-colors"
          >
            Browse All Combos
          </Link>
        </div>
      </div>
    );
  }

  // Compile list of display images
  const images: { url: string; alt: string; is_primary: boolean }[] = [];
  if (combo.primary_image_url) {
    images.push({ url: combo.primary_image_url, alt: combo.name, is_primary: true });
  }
  if (Array.isArray(combo.images)) {
    combo.images.forEach((img) => {
      if (img.secure_url && !images.some((i) => i.url === img.secure_url)) {
        images.push({
          url: img.secure_url,
          alt: img.alt_text || combo.name,
          is_primary: Boolean(img.is_primary),
        });
      }
    });
  }
  if (images.length === 0 && combo.items) {
    combo.items.forEach((it) => {
      const pImg = it.product?.product_images?.[0]?.secure_url;
      if (pImg && !images.some((i) => i.url === pImg)) {
        images.push({
          url: pImg,
          alt: it.product?.name || combo.name,
          is_primary: false,
        });
      }
    });
  }

  const primaryImage = images[selectedImageIdx] ?? images[0] ?? null;

  const originalPrice =
    combo.compare_at_price && combo.compare_at_price > combo.price
      ? combo.compare_at_price
      : combo.total_individual_price && combo.total_individual_price > combo.price
      ? combo.total_individual_price
      : null;

  const savingsVal =
    typeof combo.savings_amount === "number" && combo.savings_amount > 0
      ? combo.savings_amount
      : originalPrice && originalPrice > combo.price
      ? originalPrice - combo.price
      : 0;

  const discountPct =
    combo.savings_percentage ??
    (originalPrice && originalPrice > combo.price
      ? Math.round(((originalPrice - combo.price) / originalPrice) * 100)
      : null);

  const handleAddToCart = () => {
    if (combo.is_out_of_stock) return;
    addItem(
      {
        id: combo.id,
        name: combo.name,
        slug: combo.slug,
        sku: combo.sku,
        description: combo.description || "",
        short_description: `Combo bundle with ${combo.items?.length || 0} items`,
        retail_price: Number(combo.price),
        compare_at_price: combo.compare_at_price || combo.total_individual_price || undefined,
        tax_enabled: combo.tax_enabled !== false,
        is_out_of_stock: Boolean(combo.is_out_of_stock),
        category_id: "combos",
        category_slug: "combos",
        category_name: "Combo Offers",
        subcategory: "Special Bundles",
        brand_name: "Aurelle Sets",
        is_featured: Boolean(combo.is_featured),
        is_best_seller: false,
        is_new_arrival: false,
        images: primaryImage ? [{ url: primaryImage.url, alt: combo.name, is_primary: true }] : [],
        wholesale_moq: 1,
        wholesale_price: Number(combo.price),
        rating: 0,
        reviews_count: 0,
        tags: ["combo", "set", "bundle"],
      },
      quantity
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#5C6460]">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-[#183D2B] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/combos" className="hover:text-[#183D2B] transition-colors">
                Combo Offers
              </Link>
            </li>
            <li>/</li>
            <li className="font-semibold text-[#14231B] truncate max-w-xs">{combo.name}</li>
          </ol>
        </nav>

        {/* ── Mobile-Only Header: Combo Name at Top of Product ── */}
        <div className="block lg:hidden mb-4 space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
            Curated Value Bundle
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#1D211F] leading-snug tracking-tight">
            {combo.name}
          </h1>
          {combo.sku && <p className="text-[11px] text-[#8E9590]">SKU: {combo.sku}</p>}
        </div>

        {/* ── Main Combo Section ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Gallery (Col 7) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {images.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[560px] pb-2 md:pb-0 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-20 md:w-20 md:h-24 shrink-0 rounded-none overflow-hidden transition-all ${
                      selectedImageIdx === idx
                        ? "opacity-100"
                        : "opacity-50 hover:opacity-80"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative aspect-[4/3] md:aspect-[5/4] bg-white rounded-none overflow-hidden shadow-xs flex items-center justify-center">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl text-[#183D2B]/10 font-bold">Aurelle</div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {combo.is_out_of_stock ? (
                  <span className="bg-[#1D211F]/90 text-white text-[10px] font-semibold tracking-wider px-2.5 py-1 uppercase">
                    Out of Stock
                  </span>
                ) : (
                  <span className="bg-[#183D2B] text-white text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase shadow-xs">
                    Curated Combo
                  </span>
                )}
                {discountPct && discountPct > 0 && !combo.is_out_of_stock && (
                  <span className="bg-red-700 text-white text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase">
                    SAVE {discountPct}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Buy Box (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="hidden lg:block">
              <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
                Curated Value Bundle
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1D211F] mt-1 leading-tight tracking-tight">
                {combo.name}
              </h1>

              {combo.sku && <p className="text-[11px] text-[#8E9590] mt-1">SKU: {combo.sku}</p>}
            </div>

            {/* Price Box */}
            <div className="py-4 space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-bold text-[#1D211F] tracking-tight">
                  AED {Number(combo.price).toFixed(2)}
                </span>
                {originalPrice && originalPrice > Number(combo.price) && (
                  <span className="text-base text-[#8E9590] line-through font-medium">
                    AED {Number(originalPrice).toFixed(2)}
                  </span>
                )}
              </div>
              {savingsVal > 0 && (
                <p className="text-xs font-semibold text-emerald-800">
                  You save AED {savingsVal.toFixed(2)} with this combo deal
                </p>
              )}
              <p className="text-xs text-[#8E9590]">
                Inclusive of 5% UAE VAT. Express courier delivery across all 7 Emirates.
              </p>
            </div>

            {/* Quick Description */}
            {combo.description && (
              <p className="text-sm text-[#5C6460] leading-relaxed line-clamp-3">
                {combo.description}
              </p>
            )}

            {/* Actions */}
            {!combo.is_out_of_stock ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-none bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] disabled:opacity-30 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-[#1D211F]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 px-6 text-xs uppercase tracking-widest font-bold rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      added
                        ? "bg-[#183D2B] text-white"
                        : "bg-[#183D2B] text-white hover:bg-[#102D20] active:scale-[0.99]"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={16} />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Add Combo to Cart</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full h-11 bg-[#183D2B]/10 text-[#183D2B] hover:bg-[#183D2B] hover:text-white text-xs uppercase tracking-widest font-bold rounded-none transition-colors cursor-pointer"
                >
                  Buy Now with Express Checkout
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 text-center space-y-1">
                <p className="text-sm font-semibold text-[#1D211F]">Currently Out of Stock</p>
                <p className="text-xs text-[#5C6460]">
                  This combo offer is being restocked. Check out our other bundles below!
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <div className="flex flex-col items-center gap-1.5 p-2">
                <Truck size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Next-Day Delivery</span>
                <span className="text-[10px] text-[#8E9590]">Across all UAE</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <ShieldCheck size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Curated Set</span>
                <span className="text-[10px] text-[#8E9590]">Synergistic items</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2">
                <RotateCcw size={18} className="text-[#183D2B]" />
                <span className="text-[11px] font-semibold text-[#1D211F]">Guaranteed Value</span>
                <span className="text-[10px] text-[#8E9590]">Bundle discount</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Included Items Showcase ──────────────────────────────────────── */}
        {combo.items && combo.items.length > 0 && (
          <div className="bg-white rounded-none p-6 md:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1D211F] tracking-tight">
                Included in This Bundle ({combo.items.length}{" "}
                {combo.items.length === 1 ? "Product" : "Products"})
              </h2>
              <p className="text-xs text-[#8E9590]">
                Everything included in your package. Authentic products shipped in original packaging.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combo.items.map((it, idx) => {
                const prod = it.product;
                const pImg = prod?.product_images?.[0]?.secure_url;
                return (
                  <div
                    key={it.id || idx}
                    className="flex items-center gap-4 p-4 bg-[#FAF8F5]/50"
                  >
                    <div className="w-16 h-20 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      {pImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pImg}
                          alt={prod?.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={20} className="text-[#8E9590]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#1D211F] truncate">
                        {prod?.name || "Included Item"}
                      </p>
                      {prod?.brand?.name && (
                        <p className="text-[10px] text-[#8E9590] uppercase tracking-wider">
                          {prod.brand.name}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-[#183D2B] mt-1">
                        Quantity: {it.quantity || 1}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Other Recommended Combos ─────────────────────────────────────── */}
        {otherCombos.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1D211F] tracking-tight">More Curated Bundles</h3>
              <Link
                href="/combos"
                className="text-xs font-bold text-[#183D2B] hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                <span>View All Combos</span>
                <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherCombos.slice(0, 3).map((c) => (
                <ComboCard key={c.id} combo={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}