"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ShoppingBag, Check, Layers, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ComboOffer } from "@/types/combo";

interface ComboCardProps {
  combo: ComboOffer & {
    in_stock?: boolean;
    available_stock?: number;
  };
}

export default function ComboCard({ combo }: ComboCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const primaryImage =
    combo.primary_image_url ||
    combo.images?.[0]?.secure_url ||
    combo.items?.[0]?.product?.product_images?.[0]?.secure_url ||
    null;

  const maxStock = typeof combo.available_stock === "number" ? combo.available_stock : 0;
  const isOutOfStock = combo.in_stock === false || (combo.available_stock !== undefined && maxStock <= 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // Convert Combo to cart item format
    addItem({
      id: combo.id,
      name: combo.name,
      slug: combo.slug,
      sku: combo.sku,
      description: combo.description || "",
      short_description: `Combo Offer including ${combo.items?.length || 0} products`,
      retail_price: Number(combo.price),
      compare_at_price: combo.compare_at_price || combo.total_individual_price || undefined,
      tax_enabled: combo.tax_enabled !== false,
      category_id: "combos",
      category_slug: "combos",
      category_name: "Combo Offers",
      subcategory: "Special Bundles",
      brand_name: "Aurelle Sets",
      is_featured: Boolean(combo.is_featured),
      is_best_seller: false,
      is_new_arrival: false,
      images: primaryImage ? [{ url: primaryImage, alt: combo.name, is_primary: true }] : [],
      stock_quantity: maxStock,
      stock_status: isOutOfStock ? "out_of_stock" : "in_stock",
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
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const totalComponentsCount = (combo.items || []).reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-[#DCCFB9]/70 hover:border-[#183D2B]/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Top Image Container */}
      <Link href={`/combos/${combo.slug}`} className="relative block aspect-[4/5] bg-[#FAF8F5] overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={combo.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8E9590] p-4 text-center">
            <Sparkles size={32} strokeWidth={1.2} className="text-[#C9A84C] mb-2" />
            <span className="text-xs font-semibold">Special Combo Set</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#102D20] text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-md border border-[#C9A84C]/40">
            <Sparkles size={11} className="text-[#C9A84C]" />
            Combo Offer
          </span>

          {combo.savings_amount && combo.savings_amount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 bg-[#C9A84C] text-[#102D20] text-[10.5px] font-extrabold rounded-md shadow-xs">
              Save AED {combo.savings_amount.toFixed(0)}
            </span>
          )}
        </div>

        {/* Included Items Count Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
          <div className="backdrop-blur-md bg-white/90 px-2.5 py-1 rounded-md border border-[#DCCFB9]/80 shadow-xs flex items-center justify-between text-[11px] font-semibold text-[#183D2B]">
            <span className="flex items-center gap-1">
              <Layers size={12} className="text-[#C9A84C]" />
              {combo.items?.length || 0} Products Included
            </span>
            <span className="text-[#5C6460] font-normal">({totalComponentsCount} items total)</span>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <Link href={`/combos/${combo.slug}`}>
            <h3 className="text-sm font-bold text-[#1D211F] hover:text-[#183D2B] transition-colors line-clamp-2 leading-snug">
              {combo.name}
            </h3>
          </Link>

          {/* Included Products Short Summary */}
          {combo.items && combo.items.length > 0 && (
            <p className="mt-1.5 text-[11.5px] text-[#5C6460] line-clamp-1">
              Includes: {combo.items.map((it) => `${it.product?.name || "Item"} (${it.quantity}x)`).join(", ")}
            </p>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-[#DCCFB9]/40 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base font-extrabold text-[#183D2B]">
                AED {combo.price.toFixed(2)}
              </span>
              {(combo.compare_at_price || combo.total_individual_price) && (
                <span className="text-xs text-[#8E9590] line-through">
                  AED {(combo.compare_at_price || combo.total_individual_price)?.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#8E9590] block">
              {combo.tax_enabled ? "VAT included at checkout" : "Tax exempt"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdded}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              isAdded
                ? "bg-emerald-700 text-white"
                : isOutOfStock
                ? "bg-[#F7F5EF] text-[#8E9590] cursor-not-allowed"
                : "bg-[#183D2B] hover:bg-[#102D20] text-white"
            }`}
          >
            {isAdded ? (
              <>
                <Check size={14} />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag size={14} />
                <span>Add Set</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
