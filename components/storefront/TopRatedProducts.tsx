"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, Check, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toggleWishlist, isWishlisted as checkWishlisted } from "@/components/storefront/WishlistDrawer";
import type { ProductItem } from "@/lib/products/mock-products";

interface TopRatedProduct {
  id: string;
  name: string;
  slug: string;
  retail_price: number;
  rating: number;
  reviews_count: number;
  product_images?: Array<{
    secure_url?: string;
    cloudinary_public_id?: string;
    alt_text?: string | null;
    is_primary?: boolean;
  }>;
}

interface TopRatedProductsProps {
  products?: TopRatedProduct[];
}

export default function TopRatedProducts({ products = [] }: TopRatedProductsProps) {
  const { addItem } = useCart();
  const [paused, setPaused] = React.useState(false);
  const [addedId, setAddedId] = React.useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const updateWishlist = () => {
      const state: Record<string, boolean> = {};
      products.forEach((p) => {
        state[p.id] = checkWishlisted(p.id);
      });
      setWishlistIds(state);
    };

    updateWishlist();
    window.addEventListener("wishlist-change", updateWishlist);
    return () => window.removeEventListener("wishlist-change", updateWishlist);
  }, [products]);

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(productId);
    setWishlistIds((prev) => ({ ...prev, [productId]: next }));
  };

  if (products.length === 0) return null;

  const displayProducts = products.length > 1 ? [...products, ...products] : products;

  function addToCart(product: TopRatedProduct) {
    const image = product.product_images?.find((item) => item.is_primary) ?? product.product_images?.[0];
    const cartProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.id,
      description: "",
      short_description: "",
      retail_price: product.retail_price,
      category_id: "",
      category_slug: "",
      category_name: "",
      subcategory: "",
      brand_name: "",
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: false,
      images: image?.secure_url ? [{ url: image.secure_url, alt: image.alt_text || product.name, is_primary: true }] : [],
      stock_quantity: 1,
      stock_status: "in_stock" as const,
      wholesale_moq: 1,
      wholesale_price: product.retail_price,
      rating: product.rating,
      reviews_count: product.reviews_count,
      tags: [],
    } satisfies ProductItem;

    addItem(cartProduct);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <section className="bg-white py-6 md:py-16" aria-labelledby="top-rated-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-7">
          <h2 id="top-rated-heading" className="text-lg sm:text-xl text-[#1D211F] uppercase font-bold">
            Top Rated Products
          </h2>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className={`flex w-max gap-4 sm:gap-6 ${!paused && products.length > 1 ? "animate-top-rated" : ""}`}>
            {displayProducts.map((product, index) => {
              const image = product.product_images?.find((item) => item.is_primary) ?? product.product_images?.[0];
              return (
                <article key={`${product.id}-${index}`} className="group relative w-[180px] sm:w-[220px] shrink-0">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F5]">
                    <Link href={`/products/${product.slug}`} className="block w-full h-full">
                      {image?.secure_url ? (
                        <Image
                          src={image.secure_url}
                          alt={image.alt_text || product.name}
                          fill
                          sizes="220px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-bold text-[#183D2B]/20">
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </Link>

                    {/* Top-Left Top Rated Badge */}
                    <span className="absolute top-2.5 left-2.5 bg-yellow-300 text-black text-[10px] font-bold tracking-wider px-2 py-0.5 uppercase rounded-none pointer-events-none z-10">
                      Top Rated
                    </span>

                    {/* Top-Right Wishlist Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      className="absolute top-2.5 right-2.5 p-1 text-[#1D211F] hover:text-[#183D2B] transition-colors z-10 cursor-pointer"
                      aria-label={wishlistIds[product.id] ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart
                        size={20}
                        strokeWidth={1.5}
                        className={`transition-colors ${
                          wishlistIds[product.id] ? "fill-[#183D2B] text-[#183D2B]" : "text-[#1D211F]"
                        }`}
                      />
                    </button>

                    {/* Desktop Hover Button */}
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="hidden sm:flex absolute bottom-3 left-3 right-3 translate-y-2 bg-[#183D2B] hover:bg-[#102D20] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 items-center justify-center gap-2 cursor-pointer shadow-md z-10"
                    >
                      {addedId === product.id ? (
                        <>
                          <Check size={14} className="stroke-[2.5]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>

                    {/* Mobile View: Bottom-Right Round Add to Cart Button (Icon Only) */}
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="sm:hidden absolute bottom-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-[#183D2B] text-white shadow-md hover:bg-[#102D20] flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {addedId === product.id ? (
                        <Check size={16} className="text-white stroke-[2.5]" />
                      ) : (
                        <ShoppingBag size={16} className="text-white" />
                      )}
                    </button>
                  </div>
                  <Link href={`/products/${product.slug}`} className="mt-3 block text-sm text-[#1D211F] line-clamp-1">
                    {product.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#1D211F]">
                    <span className="flex items-center gap-0.5 text-yellow-500" aria-label={`${product.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }, (_, starIndex) => (
                        <Star key={starIndex} size={13} fill={starIndex < Math.round(product.rating) ? "currentColor" : "none"} />
                      ))}
                    </span>
                    <span>({product.reviews_count})</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
