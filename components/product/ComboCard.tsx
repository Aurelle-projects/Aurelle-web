"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Check, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ComboOffer } from "@/types/combo";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";

interface ComboCardProps {
  combo: ComboOffer;
}

export default function ComboCard({ combo }: ComboCardProps) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const primaryImage =
    combo.primary_image_url ||
    combo.images?.find((img) => img.is_primary)?.secure_url ||
    combo.images?.[0]?.secure_url ||
    combo.items?.[0]?.product?.product_images?.[0]?.secure_url ||
    null;

  const isOutOfStock = Boolean(combo.is_out_of_stock);

  const validItems = (combo.items || []).filter((it) => it.product);
  const totalComponentsCount = (combo.items || []).reduce(
    (acc, it) => acc + (it.quantity || 1),
    0
  );

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
      is_out_of_stock: isOutOfStock,
      category_id: "combos",
      category_slug: "combos",
      category_name: "Combo Offers",
      subcategory: "Special Bundles",
      brand_name: "Aurelle Sets",
      is_featured: Boolean(combo.is_featured),
      is_best_seller: false,
      is_new_arrival: false,
      images: primaryImage ? [{ url: primaryImage, alt: combo.name, is_primary: true }] : [],
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

  return (
    <article className="group flex flex-col bg-white border border-[#EDE9DF] hover:border-[#183D2B]/40 transition-all duration-300 overflow-hidden h-full">
      {/* Top Image Container with Controlled 4:3 Ratio */}
      <div className="relative aspect-[4/3] w-full bg-[#FAF8F5] overflow-hidden">
        <Link
          href={`/combos/${combo.slug}`}
          className="block w-full h-full relative"
          aria-label={combo.name}
        >
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={combo.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8E9590] p-4 text-center">
              <span className="text-2xl font-serif text-[#183D2B]/20 mb-1">Aurelle</span>
              <span className="text-[11px] font-medium tracking-wide uppercase text-[#5C6460]">
                Curated Combo
              </span>
            </div>
          )}
        </Link>

        {/* Refined Combo Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 pointer-events-none">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-[#1D211F]/90 text-white text-[8.5px] sm:text-[9.5px] font-semibold uppercase tracking-wider">
              Out of Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#FAF8F5]/95 backdrop-blur-xs text-[#183D2B] text-[8.5px] sm:text-[10px] font-bold uppercase tracking-widest border border-[#DCCFB9]/70 shadow-2xs">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#C9A84C]" />
              <span>Curated Combo</span>
            </span>
          )}
        </div>

        {/* Savings Badge */}
        {!isOutOfStock && savingsVal > 0 && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 pointer-events-none">
            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-[#183D2B] text-[#FAF8F5] text-[8.5px] sm:text-[10px] font-semibold tracking-wide shadow-2xs">
              Save AED {savingsVal.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between flex-1 bg-white space-y-2 sm:space-y-3">
        <div>
          <Link href={`/combos/${combo.slug}`} className="block">
            <h3 className="text-[13px] sm:text-[14px] lg:text-[15px] font-semibold text-[#1D211F] group-hover:text-[#183D2B] transition-colors leading-snug line-clamp-1 sm:line-clamp-2 min-h-[1.25rem] sm:min-h-0">
              {combo.name}
            </h3>
          </Link>

          {/* Short Product Summary */}
          {validItems.length > 0 ? (
            <p className="mt-0.5 text-[11px] sm:text-xs text-[#5C6460] line-clamp-1 truncate">
              {validItems.map((it) => it.product?.name || "Product").join(" + ")}
            </p>
          ) : combo.description ? (
            <p className="mt-0.5 text-[11px] sm:text-xs text-[#5C6460] line-clamp-1 truncate">{combo.description}</p>
          ) : null}

          {/* Desktop Only: Product Composition Preview (Thumbnail stack + count) */}
          {validItems.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 mt-2 pt-2 border-t border-[#EDE9DF]/60">
              <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                {validItems.slice(0, 4).map((item, idx) => {
                  const itemImg =
                    item.product?.product_images?.[0]?.secure_url ||
                    (item.product?.product_images?.[0]?.cloudinary_public_id
                      ? getProductImageUrl(
                          item.product.product_images[0].cloudinary_public_id,
                          "small"
                        )
                      : null);
                  return (
                    <div
                      key={item.id || idx}
                      className="w-5 h-5 lg:w-6 lg:h-6 rounded-full border border-white bg-[#FAF8F5] overflow-hidden relative shrink-0 shadow-2xs"
                      title={`${item.product?.name || "Product"} (x${item.quantity})`}
                    >
                      {itemImg ? (
                        <Image
                          src={itemImg}
                          alt={item.product?.name || "Product"}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#E9E1D2] flex items-center justify-center text-[8px] font-bold text-[#183D2B]">
                          {item.quantity}x
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] text-[#5C6460] font-medium truncate">
                {validItems.length} {validItems.length === 1 ? "Product" : "Products"} Included ({totalComponentsCount} items)
              </span>
            </div>
          )}
        </div>

        {/* Pricing & Actions */}
        <div className="pt-2 sm:pt-3 border-t border-[#EDE9DF] flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
              <span className="text-[13px] sm:text-[15px] lg:text-base font-bold text-[#14231B] leading-tight">
                AED {Number(combo.price).toFixed(0)}
              </span>
              {originalPrice && originalPrice > Number(combo.price) && (
                <span className="text-[10px] sm:text-xs text-[#8E9590] line-through leading-tight">
                  AED {originalPrice.toFixed(0)}
                </span>
              )}
            </div>
            {savingsVal > 0 ? (
              <span className="text-[9.5px] sm:text-[10.5px] font-medium text-[#B8933B] block truncate leading-tight mt-0.5">
                Save AED {savingsVal.toFixed(0)}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] text-[#8E9590] block truncate leading-tight mt-0.5">
                {combo.tax_enabled ? "VAT included" : "Tax exempt"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop Add to Cart button */}
            {!isOutOfStock && (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdded}
                aria-label={isAdded ? "Added to cart" : `Add ${combo.name} to cart`}
                className={`hidden sm:flex p-2 border transition-all duration-200 cursor-pointer items-center justify-center ${
                  isAdded
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "border-[#EDE9DF] bg-[#FAF8F5] text-[#183D2B] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B]"
                }`}
                title="Add combo to bag"
              >
                {isAdded ? (
                  <Check size={14} className="stroke-[2.5]" />
                ) : (
                  <ShoppingBag size={14} />
                )}
              </button>
            )}

            <Link
              href={`/combos/${combo.slug}`}
              className="inline-flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-bold text-[#183D2B] hover:text-[#C9A84C] transition-colors py-0.5 sm:py-1 group/cta whitespace-nowrap"
            >
              <span className="hidden sm:inline">VIEW COMBO</span>
              <span className="sm:hidden">VIEW</span>
              <ArrowRight
                size={12}
                className="transition-transform duration-200 group-hover/cta:translate-x-0.5 text-[#183D2B] group-hover/cta:text-[#C9A84C]"
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
