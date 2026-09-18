"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";
import { formatPrice } from "@/utils/price";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    retail_price: number;
    compare_at_price?: number | null;
    is_new_arrival?: boolean;
    is_best_seller?: boolean;
    is_featured?: boolean;
    brand?: { name: string } | null;
    category?: { name: string; slug: string } | null;
    product_images?: Array<{
      cloudinary_public_id?: string;
      secure_url?: string;
      alt_text?: string | null;
      is_primary?: boolean;
      sort_order?: number;
    }>;
    images?: Array<{
      url: string;
      alt?: string;
      is_primary?: boolean;
    }>;
    inventory?: { stock_status: string } | null;
    stock_status?: string;
    wholesale_price?: number | null;
    wholesale_moq?: number | null;
  };
  isWholesaleUser?: boolean;
}

export default function ProductCard({
  product,
  isWholesaleUser = false,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  const images = product.product_images ?? [];
  const primaryImage =
    images.find((img) => img.is_primary) ??
    images[0] ??
    null;

  const legacyImages = product.images ?? [];
  const primaryLegacyImage =
    legacyImages.find((img) => img.is_primary) ??
    legacyImages[0] ??
    null;

  const imageUrl =
    primaryImage?.secure_url ??
    (primaryImage?.cloudinary_public_id
      ? getProductImageUrl(primaryImage.cloudinary_public_id, "medium")
      : primaryLegacyImage?.url ?? null);

  const imageAlt =
    primaryImage?.alt_text ?? primaryLegacyImage?.alt ?? `${product.name} product image`;

  const stockStatus = product.inventory?.stock_status ?? product.stock_status ?? "in_stock";
  const isOutOfStock = stockStatus === "out_of_stock";
  const isOnSale =
    Boolean(product.compare_at_price && product.compare_at_price > product.retail_price);

  return (
    <div className="group flex flex-col rounded-none" aria-label={product.name}>
      {/* ── Top Image Container (Elevated Portrait Aspect Ratio, White Canvas) ── */}
      <div className="relative aspect-[3/4] w-full bg-gray-200 overflow-hidden rounded-none flex items-center justify-center">
        <Link
          href={`/products/${product.slug}`}
          className="relative w-full h-full block"
          tabIndex={-1}
          aria-hidden="true"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-[#183D2B]/10 uppercase"
              aria-hidden="true"
            >
              <span>{product.name?.charAt(0)?.toUpperCase() ?? "A"}</span>
            </div>
          )}
        </Link>

        {/* Top-Left Badge: Sold Out or Sale (No Border Radius) */}
        {isOutOfStock ? (
          <span className="absolute top-3 left-3 bg-[#8E9590] text-white text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase rounded-none pointer-events-none z-10">
            Sold out
          </span>
        ) : isOnSale ? (
          <span className="absolute top-3 left-3 bg-[#183D2B] text-white text-[10px] font-medium tracking-wider px-2 py-0.5 uppercase rounded-none pointer-events-none z-10">
            Sale
          </span>
        ) : null}

        {/* Top-Right Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWishlisted((prev) => !prev);
          }}
          className="absolute top-2.5 right-2.5 p-1 text-[#1D211F] hover:text-[#183D2B] transition-colors z-10 cursor-pointer"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={20}
            strokeWidth={1.5}
            className={`transition-colors ${isWishlisted ? "fill-[#183D2B] text-[#183D2B]" : "text-[#1D211F]"
              }`}
          />
        </button>
      </div>

      {/* ── Product Info Below Image (Left-Aligned, Clean Minimal) ── */}
      <div className="pt-3 flex flex-col text-left">
        <Link
          href={`/products/${product.slug}`}
          className="text-[13px] sm:text-[14px] text-[#1D211F] hover:text-[#183D2B] transition-colors font-normal leading-snug line-clamp-1"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[13px] sm:text-[14px] font-semibold text-[#1D211F]">
            {isWholesaleUser && product.wholesale_price
              ? formatPrice(product.wholesale_price)
              : formatPrice(product.retail_price)}
          </span>
          {isOnSale && product.compare_at_price && (
            <span className="text-xs text-[#8E9590] line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
