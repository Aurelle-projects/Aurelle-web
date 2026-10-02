"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Star,
  Package,
  ArrowRight,
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
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "included" | "shipping">("details");

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
      <div className="bg-white min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#5C6460]">Loading exclusive combo offer...</p>
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
  // If no combo images, fallback to component products' primary images
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
      : 0);

  const getCartReadyCombo = () => ({
    id: combo.id,
    name: combo.name,
    slug: combo.slug,
    sku: combo.sku,
    description: combo.description || "",
    short_description: `Combo Offer including ${combo.items?.length || 0} products`,
    retail_price: Number(combo.price),
    compare_at_price: originalPrice ?? undefined,
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
    rating: 5,
    reviews_count: 1,
    tags: ["combo", "bundle", "special offer"],
    is_combo: true as const,
    combo_id: combo.id,
    combo_items: (combo.items || []).map((it) => ({
      product_id: it.product_id,
      name: it.product?.name || "Product",
      sku: it.product?.sku || "AUR-ITEM",
      quantity: it.quantity,
      image: it.product?.product_images?.[0]?.secure_url || null,
      retail_price: it.product?.retail_price,
    })),
  });

  const handleAddToCart = () => {
    if (combo.is_out_of_stock) return;
    addItem(getCartReadyCombo(), quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (combo.is_out_of_stock) return;
    addItem(getCartReadyCombo(), quantity);
    router.push("/checkout");
  };

  const parsedFeatures: string[] = Array.isArray(combo.features)
    ? combo.features
    : typeof combo.features === "string"
    ? (combo.features as string).split("\n").filter(Boolean)
    : [];

  return (
    <div className="bg-white min-h-screen pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        {/* ── Gallery + Info ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          {/* Gallery */}
          <div className="lg:sticky lg:top-10 self-start">
            <div className="flex gap-3">
              {/* Vertical thumbnail rail — desktop only */}
              {images.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2.5 shrink-0">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`relative w-14 h-14 rounded-sm overflow-hidden transition-opacity cursor-pointer ${
                        selectedImageIdx === idx ? "opacity-100 ring-1 ring-[#183D2B]" : "opacity-50 hover:opacity-90"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="relative flex-1 aspect-square rounded-sm overflow-hidden bg-[#FAFAF8]">
                {primaryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.alt || combo.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                    <Package size={64} />
                  </div>
                )}

                {savingsVal > 0 && (
                  <span className="absolute top-4 left-4 px-2.5 py-1 text-[11px] font-bold rounded-sm bg-[#F5C518] text-[#14231B]">
                    Save {discountPct > 0 ? `${discountPct}%` : `AED ${savingsVal.toFixed(0)}`}
                  </span>
                )}
              </div>
            </div>

            {/* Mobile thumbnail row */}
            {images.length > 1 && (
              <div className="flex sm:hidden gap-2.5 mt-3 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-sm overflow-hidden shrink-0 transition-opacity cursor-pointer ${
                      selectedImageIdx === idx ? "opacity-100 ring-1 ring-[#183D2B]" : "opacity-50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm font-medium text-[#183D2B]">Aurelle Curated Set</p>

            <h1 className="mt-1.5 text-lg font-semibold sm:text-3xl text-[#14231B] leading-tight">
              {combo.name}
            </h1>

            <div className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-[#183D2B]">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>5.0 (Curated Combo)</span>
            </div>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <span className="text-lg font-semibold text-[#14231B]">
                AED {Number(combo.price).toFixed(2)}
              </span>
              {originalPrice && originalPrice > Number(combo.price) && (
                <span className="text-base text-[#8E9590] line-through">
                  AED {Number(originalPrice).toFixed(2)}
                </span>
              )}
              {combo.is_out_of_stock ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-[#1D211F]/90 text-white text-[11px] font-bold uppercase tracking-wider">
                  Out of Stock
                </span>
              ) : (
                <span className="text-xs text-[#8E9590]">
                  {combo.tax_enabled ? "incl. 5% VAT" : "Tax exempt"}
                </span>
              )}
            </div>

            {savingsVal > 0 && (
              <p className="mt-2 text-xs font-semibold text-[#B8933B]">
                Total Bundle Savings: AED {savingsVal.toFixed(2)} ({discountPct}% OFF)
              </p>
            )}

            {combo.description && (
              <p className="mt-4 sm:text-sm text-xs text-[#4B534E] leading-relaxed break-words">
                {combo.description}
              </p>
            )}

            {/* Quantity + Actions */}
            {combo.is_out_of_stock ? (
              <div className="mt-8">
                <button
                  type="button"
                  disabled
                  className="w-full py-3.5 px-6 rounded-sm font-bold text-xs sm:text-sm bg-[#8E9590] text-white cursor-not-allowed flex items-center justify-center uppercase tracking-wider shadow-xs"
                >
                  Out of Stock
                </button>
              </div>
            ) : (
              <>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-9 flex items-center justify-center text-[#14231B] hover:text-[#183D2B] cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-[#14231B]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-9 flex items-center justify-center text-[#14231B] hover:text-[#183D2B] cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`w-full py-3.5 px-3 sm:px-6 rounded-sm font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-colors cursor-pointer ${
                      added ? "bg-emerald-600 text-white" : "bg-[#183D2B] hover:bg-[#102D20] text-white"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        <span>Added to bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} strokeWidth={2} />
                        <span>Add to bag</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-3 sm:px-6 rounded-sm font-bold text-xs sm:text-sm bg-[#C9A84C] hover:bg-[#b0923e] text-[#14231B] transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Buy now
                  </button>
                </div>
              </>
            )}

            {/* Trust row */}
            <div className="mt-8 pt-6 border-t border-[#EFEAE0] grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Truck size={18} className="text-[#183D2B]" />
                <p className="text-[11px] font-semibold text-[#14231B]">Fast delivery</p>
                <p className="text-[10px] text-[#8E9590]">Same-day / 24h</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <ShieldCheck size={18} className="text-[#183D2B]" />
                <p className="text-[11px] font-semibold text-[#14231B]">100% authentic</p>
                <p className="text-[10px] text-[#8E9590]">Direct sourced</p>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <RotateCcw size={18} className="text-[#183D2B]" />
                <p className="text-[11px] font-semibold text-[#14231B]">14-day returns</p>
                <p className="text-[10px] text-[#8E9590]">Hassle-free</p>
              </div>
            </div>

            {/* ── Details tabs ─────────────────────────────────────────── */}
            <div className="mt-12">
              <div className="flex gap-6 border-b border-[#EFEAE0]">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "details"
                      ? "border-[#183D2B] text-[#14231B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("included")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "included"
                      ? "border-[#183D2B] text-[#14231B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Included ({combo.items?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "shipping"
                      ? "border-[#183D2B] text-[#14231B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Delivery & returns
                </button>
              </div>

              <div className="pt-5 text-sm text-[#4B534E] leading-relaxed break-words">
                {activeTab === "details" && (
                  <div className="space-y-4">
                    <p>{combo.description || "No description available for this combo offer."}</p>
                    {parsedFeatures.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="font-semibold text-[#14231B]">Key Benefits</p>
                        <ul className="space-y-1.5">
                          {parsedFeatures.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#183D2B] font-bold">•</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "included" && (
                  <div className="space-y-3">
                    {(combo.items || []).map((item) => {
                      const prod = item.product;
                      const prodImg = prod?.product_images?.[0]?.secure_url || null;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded bg-[#FAF8F5] border border-[#EDE9DF]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-12 rounded bg-white border border-[#EDE9DF] overflow-hidden shrink-0">
                              {prodImg ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={prodImg}
                                  alt={prod?.name || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                                  <Package size={16} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#14231B] truncate">{prod?.name}</p>
                              <p className="text-[11px] text-[#5C6460]">
                                Qty: {item.quantity} {prod?.retail_price ? `• AED ${prod.retail_price.toFixed(2)}` : ""}
                              </p>
                            </div>
                          </div>
                          {prod?.slug && (
                            <Link
                              href={`/products/${prod.slug}`}
                              target="_blank"
                              className="text-xs font-semibold text-[#183D2B] hover:text-[#C9A84C] whitespace-nowrap"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-3">
                    <p>
                      Orders placed before 2:00 PM GST qualify for same-day dispatch in Dubai and Abu Dhabi.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Dubai, Sharjah, Ajman: 24-hour delivery</li>
                      <li>Abu Dhabi, Ras Al Khaimah, Fujairah, Umm Al Quwain: 24–48 hours</li>
                      <li>Free delivery on orders over AED 199. AED 20 flat rate otherwise.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── What's Included Full Breakdown Section ──────────────── */}
        {combo.items && combo.items.length > 0 && (
          <div className="sm:mt-10 pt-10 border-t border-[#EFEAE0]">
            <h2 className="text-xl font-bold text-[#14231B] mb-6">
              Products Included in This Set ({combo.items.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {combo.items.map((item) => {
                const prod = item.product;
                const prodImg = prod?.product_images?.[0]?.secure_url || null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-sm border border-[#EDE9DF] bg-white flex items-center justify-between gap-3 hover:border-[#183D2B]/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-14 h-14 rounded-sm bg-[#FAFAF8] overflow-hidden shrink-0 border border-[#EDE9DF]">
                        {prodImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prodImg}
                            alt={prod?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                            <Package size={20} />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 bg-[#183D2B] text-white text-[9px] font-bold px-1 rounded-tl">
                          ×{item.quantity}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="text-[10px] font-medium text-[#183D2B] uppercase">
                          {prod?.brand?.name || "Aurelle"}
                        </span>
                        <h4 className="text-xs font-bold text-[#14231B] truncate mt-0.5">
                          {prod?.name}
                        </h4>
                        <p className="text-[11px] text-[#5C6460]">
                          Individual: <strong>AED {prod?.retail_price?.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    {prod?.slug && (
                      <Link
                        href={`/products/${prod.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[#183D2B] hover:text-[#C9A84C] flex items-center gap-0.5 whitespace-nowrap"
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Related Combos ("You May Also Love") ─────────────────── */}
        {otherCombos.length > 0 && (
          <div className="sm:mt-10 pt-10 border-t border-[#EFEAE0]">
            <h2 className="text-xl font-bold text-[#14231B] mb-6">You may also love</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {otherCombos.map((c) => (
                <ComboCard key={c.id} combo={c} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Action Bar — ONLY on mobile view (lg:hidden) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#DCCFB9]/60 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
        {/* Left Side: Price */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8E9590]">Price</span>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-lg font-bold text-[#14231B]">
              AED {Number(combo.price).toFixed(2)}
            </span>
            {originalPrice && originalPrice > Number(combo.price) && (
              <span className="text-xs text-[#8E9590] line-through">
                AED {Number(originalPrice).toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Add to Bag + Buy Now Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`h-11 px-3.5 rounded-lg border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              added
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-[#183D2B] text-[#183D2B] hover:bg-[#F7F5EF] active:scale-95"
            }`}
            aria-label="Add to bag"
          >
            {added ? <Check size={16} strokeWidth={2.5} /> : <ShoppingBag size={16} strokeWidth={2} />}
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="h-11 px-6 rounded-lg bg-[#C9A84C] hover:bg-[#b0923e] active:scale-95 text-[#14231B] text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center"
          >
            Buy now
          </button>
        </div>
      </div>
    </div>
  );
}
