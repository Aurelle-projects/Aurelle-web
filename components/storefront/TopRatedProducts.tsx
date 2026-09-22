"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
    <section className="bg-white py-12 md:py-16" aria-labelledby="top-rated-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-7">
          <h2 id="top-rated-heading" className="text-2xl sm:text-3xl text-[#1D211F] uppercase font-bold">
            Top Rated
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
                          className="object-contain p-3"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-3xl font-bold text-[#183D2B]/20">
                          {product.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="absolute bottom-3 left-3 right-3 translate-y-2 bg-[#183D2B] px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100"
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <ShoppingBag size={15} />
                        {addedId === product.id ? "Added" : "Add to Cart"}
                      </span>
                    </button>
                  </div>
                  <Link href={`/products/${product.slug}`} className="mt-3 block text-sm text-[#1D211F] line-clamp-1">
                    {product.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[#1D211F]">
                    <span className="flex items-center gap-0.5 text-[#B47B16]" aria-label={`${product.rating} out of 5 stars`}>
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
