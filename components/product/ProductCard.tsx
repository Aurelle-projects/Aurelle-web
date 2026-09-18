"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Eye, Check } from "lucide-react";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";
import { formatPrice, calculateDiscountPercentage } from "@/utils/price";
import { useCart } from "@/context/CartContext";
import type { ProductItem } from "@/lib/products/mock-products";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    retail_price: number;
    compare_at_price?: number | null;
    is_new_arrival?: boolean;
    is_best_seller?: boolean;
    is_featured?: boolean;
    brand?: { name: string } | null;
    category?: { name: string; slug: string } | null;
    product_images?: Array<{
      cloudinary_public_id: string;
      secure_url: string;
      alt_text?: string | null;
      is_primary?: boolean;
      sort_order?: number;
    }>;
    inventory?: { stock_status: string } | null;
    wholesale_price?: number | null;
    wholesale_moq?: number | null;
  };
  isWholesaleUser?: boolean;
}

export default function ProductCard({
  product,
  isWholesaleUser = false,
}: ProductCardProps) {
  const [added, setAdded] = React.useState(false);
  const cart = useCart();

  const images = product.product_images ?? [];
  const primaryImage =
    images.find((img) => img.is_primary) ??
    images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0] ??
    null;

  const imageUrl = primaryImage?.cloudinary_public_id
    ? getProductImageUrl(primaryImage.cloudinary_public_id, "small")
    : primaryImage?.secure_url ?? null;

  const imageAlt =
    primaryImage?.alt_text ?? `${product.name} product image`;

  const stockStatus = product.inventory?.stock_status ?? "in_stock";
  const isOnSale =
    product.compare_at_price && product.compare_at_price > product.retail_price;
  const discountPct = isOnSale
    ? calculateDiscountPercentage(product.compare_at_price!, product.retail_price)
    : 0;

  function handleAddToCart() {
    // Map to ProductItem format
    const item: ProductItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: "",
      short_description: "",
      retail_price: product.retail_price,
      compare_at_price: product.compare_at_price ?? undefined,
      category_id: product.category?.slug ?? "cosmetics-makeup",
      category_slug: product.category?.slug ?? "cosmetics-makeup",
      category_name: product.category?.name ?? "Cosmetics & Makeup",
      subcategory: "",
      brand_name: product.brand?.name ?? "Aurelle",
      is_featured: product.is_featured ?? false,
      is_best_seller: product.is_best_seller ?? false,
      is_new_arrival: product.is_new_arrival ?? false,
      images: [
        {
          url: imageUrl || "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
          alt: imageAlt,
          is_primary: true,
        },
      ],
      stock_quantity: 50,
      stock_status: "in_stock",
      wholesale_moq: product.wholesale_moq ?? 12,
      wholesale_price: product.wholesale_price ?? Math.round(product.retail_price * 0.6),
      rating: 4.9,
      reviews_count: 24,
      tags: [],
    };

    cart.addItem(item, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article className="group bg-white rounded-xl border border-[#DCCFB9]/40 overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-1" aria-label={product.name}>
      {/* Image Container */}
      <div className="relative aspect-square bg-[#FAF8F5] overflow-hidden">
        <Link
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block w-full h-full"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E9E1D2] to-[#DCCFB9] flex items-center justify-center text-4xl font-extrabold text-[#183D2B]/15 uppercase" aria-hidden="true">
              <span>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10" aria-label="Product badges">
          {product.is_new_arrival && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#183D2B] text-white shadow-xs">
              New
            </span>
          )}
          {isOnSale && discountPct > 0 && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C0392B] text-white shadow-xs">
              -{discountPct}%
            </span>
          )}
          {product.is_best_seller && !product.is_new_arrival && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#B8860B] text-white shadow-xs">
              Best Seller
            </span>
          )}
          {stockStatus === "out_of_stock" && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-500 text-white shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-[#1D211F] hover:bg-[#183D2B] hover:text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            aria-label={`Add ${product.name} to wishlist`}
            onClick={() => {
              /* Wishlist */
            }}
          >
            <Heart size={15} strokeWidth={1.8} />
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-[#1D211F] hover:bg-[#183D2B] hover:text-white flex items-center justify-center shadow-xs transition-colors"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-[11px] font-semibold uppercase tracking-wider text-[#183D2B]/80 hover:text-[#183D2B] mb-1 transition-colors"
          >
            {product.category.name}
          </Link>
        )}

        <Link
          href={`/products/${product.slug}`}
          className="group-hover:text-[#183D2B] transition-colors"
        >
          <h3 className="font-medium text-sm text-[#1D211F] line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>

        {product.brand && (
          <p className="text-xs text-[#5C6460] mb-2">{product.brand.name}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto mb-2.5">
          {isWholesaleUser && product.wholesale_price ? (
            <>
              <span className="text-base font-bold text-[#183D2B]">
                {formatPrice(product.wholesale_price)}
              </span>
              <span className="text-xs text-[#8E9590] line-through">
                {formatPrice(product.retail_price)}
              </span>
              {product.wholesale_moq && (
                <span className="text-[11px] font-medium text-[#183D2B] bg-[#183D2B]/[0.08] px-2 py-0.5 rounded-sm">
                  MOQ: {product.wholesale_moq}
                </span>
              )}
            </>
          ) : (
            <>
              <span className={`text-base font-bold ${isOnSale ? "text-[#C0392B]" : "text-[#183D2B]"}`}>
                {formatPrice(product.retail_price)}
              </span>
              {isOnSale && product.compare_at_price && (
                <span className="text-xs text-[#8E9590] line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </>
          )}
        </div>

        {/* Stock status indicator */}
        <div
          className={`text-[11px] font-medium mb-3 ${
            stockStatus === "in_stock"
              ? "text-emerald-700"
              : stockStatus === "low_stock"
              ? "text-amber-700"
              : "text-gray-400"
          }`}
          aria-label={`Stock status: ${stockStatus.replace("_", " ")}`}
        >
          {stockStatus === "in_stock"
            ? "In Stock"
            : stockStatus === "low_stock"
            ? "Low Stock"
            : "Out of Stock"}
        </div>

        {/* Action Button */}
        <div>
          {stockStatus !== "out_of_stock" ? (
            <button
              className={`w-full py-2.5 px-4 rounded-full font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                added
                  ? "bg-emerald-600 text-white"
                  : "bg-[#183D2B] hover:bg-[#102D20] text-white"
              }`}
              aria-label={`Add ${product.name} to cart`}
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingBag size={14} strokeWidth={2} aria-hidden="true" />
                  Add to Cart
                </>
              )}
            </button>
          ) : (
            <button
              className="w-full py-2.5 px-4 rounded-full bg-gray-100 text-gray-400 font-semibold text-xs tracking-wider uppercase flex items-center justify-center cursor-not-allowed"
              disabled
              aria-disabled="true"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
