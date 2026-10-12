"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star, Check, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toggleWishlist, isWishlisted as checkWishlisted } from "@/components/storefront/WishlistDrawer";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";
import { formatPrice } from "@/utils/price";
import type { ProductItem } from "@/lib/products/mock-products";

export interface TopRatedProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  retail_price: number;
  compare_at_price?: number | null;
  tax_enabled?: boolean;
  is_out_of_stock?: boolean;
  rating: number;
  reviews_count: number;
  product_images?: Array<{
    secure_url?: string;
    cloudinary_public_id?: string;
    alt_text?: string | null;
    is_primary?: boolean;
    sort_order?: number;
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
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Strictly deduplicate by canonical product ID
  const uniqueProducts = React.useMemo(() => {
    const map = new Map<string, TopRatedProduct>();
    for (const p of products) {
      if (p?.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values());
  }, [products]);

  // Seamless infinite repetition when 2 or more products exist
  const displayProducts = React.useMemo(() => {
    if (uniqueProducts.length >= 2) {
      return [...uniqueProducts, ...uniqueProducts, ...uniqueProducts];
    }
    return uniqueProducts;
  }, [uniqueProducts]);

  // Sync wishlist state
  React.useEffect(() => {
    const updateWishlist = () => {
      const state: Record<string, boolean> = {};
      uniqueProducts.forEach((p) => {
        state[p.id] = checkWishlisted(p.id);
      });
      setWishlistIds(state);
    };

    updateWishlist();
    window.addEventListener("wishlist-change", updateWishlist);
    return () => window.removeEventListener("wishlist-change", updateWishlist);
  }, [uniqueProducts]);

  // Responsive overflow & scroll position tracking
  const updateScrollState = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 4;
    setIsOverflowing(overflowing);
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    window.addEventListener("resize", updateScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [uniqueProducts, updateScrollState]);

  // Resume timer ref for responsive touch & mouse auto-resume
  const resumeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const pauseAutoScroll = React.useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    // Auto-resume after 3.5s of user inactivity
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, 3500);
  }, []);

  const resumeAutoScroll = React.useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, 1200);
  }, []);

  const getStep = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return 0;
    const first = el.children[0] as HTMLElement | null;
    const second = el.children[1] as HTMLElement | null;
    if (first && second) {
      return second.offsetLeft - first.offsetLeft;
    }
    return (first?.offsetWidth || 170) + 14;
  }, []);

  const getSingleSetWidth = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el || uniqueProducts.length === 0) return 0;
    const first = el.children[0] as HTMLElement | null;
    const nth = el.children[uniqueProducts.length] as HTMLElement | null;
    if (first && nth) {
      return nth.offsetLeft - first.offsetLeft;
    }
    return 0;
  }, [uniqueProducts.length]);

  // Navigation handlers
  const handleScroll = (direction: "left" | "right") => {
    pauseAutoScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    const stepWidth = getStep() || el.clientWidth * 0.75;
    const setWidth = getSingleSetWidth();
    if (direction === "left" && el.scrollLeft <= 10 && setWidth > 0) {
      el.scrollLeft += setWidth;
    }
    el.scrollBy({
      left: direction === "left" ? -stepWidth : stepWidth,
      behavior: "smooth",
    });
  };

  // Seamless Infinite Auto-Scroll: Slides forward smoothly every 2.8s
  React.useEffect(() => {
    if (paused || uniqueProducts.length <= 1) return;

    const interval = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;

      const setWidth = getSingleSetWidth();
      const stepWidth = getStep();

      if (setWidth > 0 && el.scrollLeft >= setWidth - 10) {
        // Silently reset back by one set width so the scroll continues seamlessly forever
        el.scrollLeft -= setWidth;
      }

      el.scrollBy({ left: stepWidth, behavior: "smooth" });
    }, 2800);

    return () => clearInterval(interval);
  }, [paused, uniqueProducts.length, getSingleSetWidth, getStep]);

  // Mouse drag support
  const isDraggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const scrollLeftStartRef = React.useRef(0);
  const hasDraggedRef = React.useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
    pauseAutoScroll();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      resumeAutoScroll();
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleWishlist(productId);
    setWishlistIds((prev) => ({ ...prev, [productId]: next }));
  };

  if (!uniqueProducts || uniqueProducts.length === 0) return null;

  function addToCart(product: TopRatedProduct) {
    if (product.is_out_of_stock) return;
    const images = product.product_images ?? [];
    const image = images.find((item) => item.is_primary) ?? images[0];
    const imageUrl =
      image?.secure_url ||
      (image?.cloudinary_public_id
        ? getProductImageUrl(image.cloudinary_public_id, "medium")
        : null);

    const cartProduct: ProductItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku || product.id,
      description: "",
      short_description: "",
      retail_price: product.retail_price,
      compare_at_price: product.compare_at_price ?? undefined,
      tax_enabled: product.tax_enabled !== false,
      is_out_of_stock: Boolean(product.is_out_of_stock),
      category_id: "",
      category_slug: "",
      category_name: "",
      subcategory: "",
      brand_name: "",
      is_featured: false,
      is_best_seller: false,
      is_new_arrival: false,
      images: imageUrl ? [{ url: imageUrl, alt: image?.alt_text || product.name, is_primary: true }] : [],
      wholesale_moq: 1,
      wholesale_price: product.retail_price,
      rating: product.rating,
      reviews_count: product.reviews_count,
      tags: [],
    };

    addItem(cartProduct);
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <section className="bg-white py-6 md:py-16" aria-labelledby="top-rated-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-7">
          <h2 id="top-rated-heading" className="text-base sm:text-xl text-[#1D211F] uppercase font-bold tracking-wide">
            Top Rated Products
          </h2>
          {isOverflowing && (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className="w-8 h-8 rounded-full border border-[#EDE9DF] bg-white flex items-center justify-center text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1D211F] disabled:hover:border-[#EDE9DF] transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                aria-label="Scroll left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className="w-8 h-8 rounded-full border border-[#EDE9DF] bg-white flex items-center justify-center text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-[#1D211F] disabled:hover:border-[#EDE9DF] transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                aria-label="Scroll right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={pauseAutoScroll}
          onTouchEnd={resumeAutoScroll}
          onTouchCancel={resumeAutoScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClickCapture={handleClickCapture}
          onScroll={() => {
            updateScrollState();
            pauseAutoScroll();
          }}
          className="w-auto -mx-4 px-4 sm:mx-0 sm:px-0 flex overflow-x-auto scroll-smooth pb-3 pt-1 gap-3.5 sm:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] justify-start select-none cursor-grab active:cursor-grabbing"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {displayProducts.map((product, idx) => {
            const images = product.product_images ?? [];
            const image = images.find((item) => item.is_primary) ?? images[0];
            const imageUrl =
              image?.secure_url ||
              (image?.cloudinary_public_id
                ? getProductImageUrl(image.cloudinary_public_id, "medium")
                : null);
            const isOnSale = Boolean(
              product.compare_at_price && product.compare_at_price > product.retail_price
            );

            return (
              <article key={`${product.id}-${idx}`} className="group relative w-[170px] sm:w-[220px] shrink-0 flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#F5F5F5]">
                  <Link href={`/products/${product.slug}`} prefetch={true} className="relative block w-full h-full">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={image?.alt_text || product.name}
                        fill
                        sizes="(max-width: 640px) 170px, 220px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl font-bold text-[#183D2B]/20">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </Link>

                  {/* Top-Left Badge: Out of Stock or Top Rated */}
                  {product.is_out_of_stock ? (
                    <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-[#1D211F]/90 text-white text-[9px] sm:text-[10px] font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 uppercase rounded-none pointer-events-none z-10">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-yellow-300 text-black text-[9px] sm:text-[10px] font-bold tracking-wider px-1.5 sm:px-2 py-0.5 uppercase rounded-none pointer-events-none z-10">
                      Top Rated
                    </span>
                  )}

                  {/* Top-Right Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(e, product.id)}
                    className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1 text-[#1D211F] hover:text-[#183D2B] transition-colors z-10 cursor-pointer"
                    aria-label={wishlistIds[product.id] ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      size={18}
                      strokeWidth={1.5}
                      className={`transition-colors ${
                        wishlistIds[product.id] ? "fill-[#183D2B] text-[#183D2B]" : "text-[#1D211F]"
                      }`}
                    />
                  </button>

                  {/* Desktop Hover Button */}
                  {product.is_out_of_stock ? (
                    <button
                      type="button"
                      disabled
                      className="hidden sm:flex absolute bottom-3 left-3 right-3 translate-y-2 bg-[#8E9590] cursor-not-allowed px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 items-center justify-center gap-2 shadow-md z-10"
                    >
                      <span>Out of Stock</span>
                    </button>
                  ) : (
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
                  )}

                  {/* Mobile View: Bottom-Right Round Add to Cart Button (Icon Only) */}
                  {!product.is_out_of_stock && (
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="sm:hidden absolute bottom-2 right-2 z-10 w-8 h-8 rounded-full bg-[#183D2B] text-white shadow-md hover:bg-[#102D20] flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {addedId === product.id ? (
                        <Check size={14} className="text-white stroke-[2.5]" />
                      ) : (
                        <ShoppingBag size={14} className="text-white" />
                      )}
                    </button>
                  )}
                </div>

                {/* Product Info */}
                <div className="pt-2.5 sm:pt-3 flex flex-col text-left flex-1">
                  <Link
                    href={`/products/${product.slug}`}
                    prefetch={true}
                    className="text-[13px] sm:text-[14px] text-[#1D211F] hover:text-[#183D2B] transition-colors font-normal leading-snug line-clamp-2 min-h-[2.25rem] sm:min-h-0 sm:line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[13px] sm:text-[14px] font-semibold text-[#1D211F]">
                      {formatPrice(product.retail_price)}
                    </span>
                    {isOnSale && product.compare_at_price && (
                      <span className="text-xs text-[#8E9590] line-through">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#1D211F]">
                    <span
                      className="flex items-center gap-0.5 text-yellow-500"
                      aria-label={`${product.rating.toFixed(1)} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, starIndex) => (
                        <Star
                          key={starIndex}
                          size={12}
                          fill={starIndex < Math.round(product.rating) ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-semibold text-[#1D211F]">
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[11px] text-[#5C6460]">
                      ({product.reviews_count})
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
