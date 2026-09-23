"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Check, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toggleWishlist, isWishlisted as checkWishlisted } from "@/components/storefront/WishlistDrawer";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";
import { formatPrice } from "@/utils/price";
import type { ProductItem } from "@/lib/products/mock-products";

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  retail_price: number;
  compare_at_price?: number | null;
  is_new_arrival?: boolean;
  is_featured?: boolean;
  is_best_seller?: boolean;
  product_images?: Array<{
    cloudinary_public_id?: string;
    secure_url?: string;
    alt_text?: string | null;
    is_primary?: boolean;
  }>;
  inventory?: { stock_status: string } | null;
};

interface AllProductsSectionProps {
  initialProducts: CatalogProduct[];
}

function toCartProduct(product: CatalogProduct, imageUrl: string | null): ProductItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku || product.id,
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
    images: imageUrl ? [{ url: imageUrl, alt: product.name, is_primary: true }] : [],
    stock_quantity: 1,
    stock_status: product.inventory?.stock_status === "out_of_stock" ? "out_of_stock" : "in_stock",
    wholesale_moq: 1,
    wholesale_price: product.retail_price,
    rating: 0,
    reviews_count: 0,
    tags: [],
  };
}

export default function AllProductsSection({ initialProducts }: AllProductsSectionProps) {
  const { addItem } = useCart();
  const [products, setProducts] = React.useState(initialProducts);
  const [visibleCount, setVisibleCount] = React.useState(initialProducts.length);
  const [offset, setOffset] = React.useState(initialProducts.length);
  const [hasMore, setHasMore] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [started, setStarted] = React.useState(false);
  const [addedId, setAddedId] = React.useState<string | null>(null);
  const [wishlistIds, setWishlistIds] = React.useState<Record<string, boolean>>({});
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

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

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/products?offset=${offset}&limit=10`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load products");
      const nextProducts = data.products ?? [];
      setProducts((current) => [...current, ...nextProducts]);
      setVisibleCount((current) => current + nextProducts.length);
      setOffset((current) => current + nextProducts.length);
      setHasMore(Boolean(data.hasMore));
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!started) return;
    const element = loadMoreRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loadMore();
    }, { rootMargin: "240px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [started, offset, hasMore, loading]);

  function handleAdd(product: CatalogProduct) {
    const image = product.product_images?.find((item) => item.is_primary) ?? product.product_images?.[0];
    const imageUrl = image?.secure_url ?? (image?.cloudinary_public_id ? getProductImageUrl(image.cloudinary_public_id, "medium") : null);
    addItem(toCartProduct(product, imageUrl));
    setAddedId(product.id);
    window.setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <section className="bg-white py-6 md:py-16" aria-labelledby="all-products-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="all-products-heading" className="md:text-xl text-lg font-bold text-[#14231B] mb-6 uppercase tracking-wide">
          All Products
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2" role="list" aria-label="All products">
          {products.slice(0, visibleCount).map((product, index) => {
            const image = product.product_images?.find((item) => item.is_primary) ?? product.product_images?.[0];
            const imageUrl = image?.secure_url ?? (image?.cloudinary_public_id ? getProductImageUrl(image.cloudinary_public_id, "medium") : null);
            const isOutOfStock = product.inventory?.stock_status === "out_of_stock";
            const onSale = Boolean(product.compare_at_price && product.compare_at_price > product.retail_price);

            return (
              <article key={product.id} className="group relative min-w-0" role="listitem">
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  <Link href={`/products/${product.slug}`} className="block h-full w-full">
                    {imageUrl ? (
                      <Image src={imageUrl} alt={image?.alt_text || product.name} fill sizes="(max-width: 768px) 50vw, 16vw" className="object-cover " />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl font-bold text-[#183D2B]/20">{product.name.charAt(0)}</div>
                    )}
                  </Link>

                  {/* Top-Right Wishlist Heart Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleWishlist(e, product.id)}
                    className="absolute top-2 right-2 p-1 text-[#1D211F] hover:text-[#183D2B] transition-colors z-10 cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    disabled={product.inventory?.stock_status === "out_of_stock"}
                    className="hidden sm:block absolute bottom-2 left-2 right-2 translate-y-2 bg-[#183D2B] px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-500 shadow-md"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">{addedId === product.id ? <><Check size={14} className="stroke-[2.5]" />Added</> : <><ShoppingBag size={14} />Add to Cart</>}</span>
                  </button>

                  {/* Mobile Bottom-Right Round Icon Button */}
                  {product.inventory?.stock_status !== "out_of_stock" && (
                    <button
                      type="button"
                      onClick={() => handleAdd(product)}
                      className="sm:hidden absolute bottom-2 right-2 z-10 w-8.5 h-8.5 rounded-full bg-[#183D2B] text-white shadow-md hover:bg-[#102D20] flex items-center justify-center cursor-pointer transition-all active:scale-90"
                      aria-label={`Add ${product.name} to cart`}
                    >
                      {addedId === product.id ? <Check size={16} className="text-white stroke-[2.5]" /> : <ShoppingBag size={16} className="text-white" />}
                    </button>
                  )}
                </div>
                <Link href={`/products/${product.slug}`} className="block truncate px-1 pt-2 text-sm text-[#1D211F]">{product.name}</Link>
                <div className="flex items-baseline gap-2 px-1 pb-4 pt-1">
                  <span className="text-sm font-semibold text-[#1D211F]">{formatPrice(product.retail_price)}</span>
                  {onSale && <span className="text-xs text-[#8E9590] line-through">{formatPrice(product.compare_at_price as number)}</span>}
                </div>
              </article>
            );
          })}
        </div>

        {!started && hasMore && (
          <div className="mt-10 text-center">
            <button type="button" onClick={() => { setStarted(true); loadMore(); }} className="border border-[#1D211F] px-9 py-3.5 text-xs font-medium uppercase tracking-wide text-[#1D211F] hover:bg-[#183D2B] hover:text-white">
              View All Products
            </button>
          </div>
        )}
        {started && <div ref={loadMoreRef} className="h-8" aria-hidden="true" />}
        {started && loading && <p className="pt-4 text-center text-xs text-[#5C6460]">Loading products...</p>}
      </div>
    </section>
  );
}
