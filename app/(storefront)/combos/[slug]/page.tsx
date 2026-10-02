"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import {
  Sparkles,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Layers,
  ArrowRight,
  Package,
  Info,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ComboOffer } from "@/types/combo";
import ComboCard from "@/components/product/ComboCard";

interface ComboDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ComboDetailPage({ params }: ComboDetailPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { addItem } = useCart();

  const [combo, setCombo] = useState<ComboOffer | null>(null);
  const [otherCombos, setOtherCombos] = useState<ComboOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    async function loadComboData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/combos/${slug}`);
        const data = await res.json();
        if (res.ok && data.combo) {
          setCombo(data.combo);
        } else {
          setCombo(null);
        }

        // Fetch other featured combos
        const otherRes = await fetch("/api/combos?limit=4");
        const otherData = await otherRes.json();
        if (otherRes.ok && otherData.combos) {
          setOtherCombos(otherData.combos.filter((c: ComboOffer) => c.slug !== slug));
        }
      } catch (err) {
        console.error("[ComboDetailPage] Failed to fetch combo:", err);
      } finally {
        setLoading(false);
      }
    }

    loadComboData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#5C6460]">Loading exclusive combo offer...</p>
      </div>
    );
  }

  if (!combo) {
    notFound();
  }

  // Compile list of display images
  const allImages: string[] = [];
  if (combo.primary_image_url) allImages.push(combo.primary_image_url);
  if (Array.isArray(combo.images)) {
    combo.images.forEach((img) => {
      if (img.secure_url && !allImages.includes(img.secure_url)) {
        allImages.push(img.secure_url);
      }
    });
  }
  // If no combo images, fallback to component products' primary images
  if (allImages.length === 0 && combo.items) {
    combo.items.forEach((it) => {
      const pImg = it.product?.product_images?.[0]?.secure_url;
      if (pImg && !allImages.includes(pImg)) {
        allImages.push(pImg);
      }
    });
  }

  const activeImage = allImages[selectedImageIdx] || allImages[0] || null;

  const handleAddToCart = () => {
    if (combo.is_out_of_stock) return;

    addItem(
      {
        id: combo.id,
        name: combo.name,
        slug: combo.slug,
        sku: combo.sku,
        description: combo.description || "",
        short_description: `Combo Offer including ${combo.items?.length || 0} products`,
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
        images: activeImage ? [{ url: activeImage, alt: combo.name, is_primary: true }] : [],
        wholesale_moq: 1,
        wholesale_price: Number(combo.price),
        rating: 5,
        reviews_count: 1,
        tags: ["combo", "bundle", "special offer"],
        is_combo: true,
        combo_id: combo.id,
        combo_items: (combo.items || []).map((it) => ({
          product_id: it.product_id,
          name: it.product?.name || "Product",
          sku: it.product?.sku || "AUR-ITEM",
          quantity: it.quantity,
          image: it.product?.product_images?.[0]?.secure_url || null,
          retail_price: it.product?.retail_price,
        })),
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const parsedFeatures: string[] = Array.isArray(combo.features)
    ? combo.features
    : typeof combo.features === "string"
    ? (combo.features as string).split("\n").filter(Boolean)
    : [];

  return (
    <div className="bg-[#FAF9F5] min-h-screen py-6 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#5C6460]">
          <Link href="/" className="hover:text-[#183D2B] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/combos" className="hover:text-[#183D2B] transition-colors">
            Combo Offers
          </Link>
          <ChevronRight size={12} />
          <span className="font-semibold text-[#183D2B] truncate">{combo.name}</span>
        </nav>

        {/* Hero Product View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-2xl border border-[#DCCFB9]/60 shadow-sm">
          {/* Left Column: Gallery (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary Main Image */}
            <div className="relative aspect-square w-full bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#DCCFB9]/60">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={combo.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#8E9590]">
                  <Sparkles size={48} className="text-[#C9A84C] mb-2" />
                  <span className="text-sm font-semibold">Special Combo Offer</span>
                </div>
              )}

              {/* Combo Offer Pill */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {combo.is_out_of_stock ? (
                  <span className="inline-flex items-center px-3 py-1.5 bg-[#1D211F]/90 text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md">
                    OUT OF STOCK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-md shadow-md border border-[#C9A84C]/50">
                    <Sparkles size={13} className="text-[#C9A84C]" />
                    COMBO OFFER
                  </span>
                )}

                {!combo.is_out_of_stock && combo.savings_amount && combo.savings_amount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-[#C9A84C] text-[#102D20] text-xs font-extrabold rounded-md shadow-sm">
                    SAVE AED {combo.savings_amount.toFixed(2)} ({combo.savings_percentage}%)
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Carousel */}
            {allImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-18 h-18 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIdx === idx
                        ? "border-[#183D2B] scale-95 ring-2 ring-[#183D2B]/20"
                        : "border-[#DCCFB9]/60 hover:border-[#183D2B]/50 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt={`Thumb ${idx}`} fill sizes="72px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information, Pricing, Actions (7 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold tracking-widest text-[#C9A84C] uppercase font-mono">
                  EXCLUSIVE BUNDLE • SKU: {combo.sku}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#183D2B] font-serif mt-1 leading-tight">
                  {combo.name}
                </h1>
              </div>

              {/* Price Banner */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#DCCFB9]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-extrabold text-[#183D2B]">
                      AED {combo.price.toFixed(2)}
                    </span>
                    {(combo.compare_at_price || combo.total_individual_price) && (
                      <span className="text-base text-[#8E9590] line-through">
                        AED {(combo.compare_at_price || combo.total_individual_price)?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11.5px] text-[#5C6460] mt-0.5">
                    {combo.tax_enabled
                      ? "Inclusive of authoritative 5% UAE VAT at checkout"
                      : "Tax-exempt item"}
                  </p>
                </div>

                {!combo.is_out_of_stock && combo.savings_amount && combo.savings_amount > 0 && (
                  <div className="sm:text-right bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-extrabold text-emerald-800 block">
                      Total Savings: AED {combo.savings_amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {combo.savings_percentage}% bundle discount
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {combo.description && (
                <p className="text-xs sm:text-sm text-[#1D211F] leading-relaxed">
                  {combo.description}
                </p>
              )}

              {/* Highlights & Features */}
              {parsedFeatures.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#DCCFB9]/40">
                  <h3 className="text-xs font-bold text-[#183D2B] uppercase tracking-wider">
                    Why You&apos;ll Love This Combo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedFeatures.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#1D211F]">
                        <Check size={14} className="text-[#C9A84C] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart Container */}
            <div className="space-y-4 pt-4 border-t border-[#DCCFB9]/60">
              {/* Availability Notice */}
              <div className="flex items-center gap-2">
                {combo.is_out_of_stock ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span className="text-xs font-semibold text-[#1D211F]">
                      Out of Stock
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs font-semibold text-[#1D211F]">
                      Available — Ready for UAE Dispatch
                    </span>
                  </>
                )}
              </div>

              {/* Controls */}
              {combo.is_out_of_stock ? (
                <div>
                  <button
                    type="button"
                    disabled
                    className="w-full flex items-center justify-center py-3.5 px-6 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#8E9590] text-white cursor-not-allowed shadow-xs"
                  >
                    Out of Stock
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Quantity Selector */}
                  <div className="flex items-center border border-[#DCCFB9] rounded-lg bg-[#F7F5EF] overflow-hidden self-start">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-2.5 text-[#5C6460] hover:text-[#183D2B] hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center text-xs font-bold text-[#183D2B]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2.5 text-[#5C6460] hover:text-[#183D2B] hover:bg-white transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-lg text-xs font-bold tracking-wider uppercase transition-all shadow-md cursor-pointer ${
                      isAdded
                        ? "bg-emerald-700 text-white"
                        : "bg-[#183D2B] hover:bg-[#102D20] text-white hover:shadow-lg"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check size={16} />
                        <span>Added to Bag!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Add Combo to Bag — AED {(combo.price * quantity).toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center border-t border-[#DCCFB9]/40 text-[11px] text-[#5C6460]">
                <div className="flex flex-col items-center gap-1">
                  <Truck size={16} className="text-[#183D2B]" />
                  <span>Free Delivery &gt; AED 199</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck size={16} className="text-[#183D2B]" />
                  <span>100% Authentic Products</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw size={16} className="text-[#183D2B]" />
                  <span>Easy 14-Day Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed "What's Included" Breakdown Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#DCCFB9]/60 pb-3">
            <div>
              <h2 className="text-xl font-bold text-[#183D2B] font-serif flex items-center gap-2">
                <Layers size={20} className="text-[#C9A84C]" />
                <span>What&apos;s Included in This Combo ({combo.items?.length || 0} Products)</span>
              </h2>
              <p className="text-xs text-[#5C6460] mt-0.5">
                Every component is a full-sized, authentic formula curated to work in harmony.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {combo.items?.map((item) => {
              const prod = item.product;
              const prodImg = prod?.product_images?.[0]?.secure_url || null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-[#DCCFB9]/70 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#183D2B]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-lg bg-[#FAF8F5] border border-[#DCCFB9]/60 overflow-hidden shrink-0">
                      {prodImg ? (
                        <Image src={prodImg} alt={prod?.name || "Product"} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                          <Package size={20} />
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-[#183D2B] text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-tl">
                        ×{item.quantity}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-[#C9A84C] uppercase">
                        {prod?.brand?.name || "Aurelle"}
                      </span>
                      <h4 className="text-xs font-bold text-[#1D211F] truncate mt-0.5">
                        {prod?.name}
                      </h4>
                      <p className="text-[11px] text-[#5C6460]">
                        Individual Retail: <strong>AED {prod?.retail_price?.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>

                  {prod?.description && (
                    <p className="text-[11px] text-[#5C6460] line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-[#DCCFB9]/40 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#183D2B]">Quantity: {item.quantity} Included</span>
                    {prod?.slug && (
                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="text-[#C9A84C] hover:text-[#183D2B] font-semibold flex items-center gap-1"
                      >
                        <span>View Product</span>
                        <ArrowRight size={11} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Other Recommended Combos */}
        {otherCombos.length > 0 && (
          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between border-b border-[#DCCFB9]/60 pb-3">
              <div>
                <h2 className="text-xl font-bold text-[#183D2B] font-serif">
                  More Exclusive Combo Offers
                </h2>
                <p className="text-xs text-[#5C6460]">
                  Explore other curated routines and multi-product savings.
                </p>
              </div>
              <Link
                href="/combos"
                className="text-xs font-bold text-[#183D2B] hover:text-[#C9A84C] flex items-center gap-1"
              >
                <span>View all combos</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherCombos.map((c) => (
                <ComboCard key={c.id} combo={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
