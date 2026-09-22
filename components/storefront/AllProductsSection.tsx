"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
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
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

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
    <section className="bg-white py-12 md:py-16" aria-labelledby="all-products-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="all-products-heading" className="text-xl font-bold text-[#14231B] mb-6 uppercase tracking-wide">
          All Products
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2" role="list" aria-label="All products">
          {products.slice(0, visibleCount).map((product) => {
            const image = product.product_images?.find((item) => item.is_primary) ?? product.product_images?.[0];
            const imageUrl = image?.secure_url ?? (image?.cloudinary_public_id ? getProductImageUrl(image.cloudinary_public_id, "medium") : null);
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
                  {onSale && <span className="absolute left-2 top-2 bg-[#183D2B] px-2 py-0.5 text-[10px] uppercase text-white">Sale</span>}
                  <button
                    type="button"
                    onClick={() => handleAdd(product)}
                    disabled={product.inventory?.stock_status === "out_of_stock"}
                    className="absolute bottom-2 left-2 right-2 translate-y-2 bg-[#183D2B] px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-500"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5"><ShoppingBag size={14} />{addedId === product.id ? "Added" : "Add to Cart"}</span>
                  </button>
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
