"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import {
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  Package,
  Minus,
  Plus,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const cart = useCart();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [product, setProduct] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "shipping">("details");

  useEffect(() => {
    async function loadProduct() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: p, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, sku, category_id, description, benefits, ingredients, usage_instructions,
            retail_price, compare_at_price, wholesale_price, wholesale_moq,
            is_published, is_featured, is_best_seller, is_new_arrival,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status, stock_quantity)
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (!error && p) {
          setProduct(p);

          // Load related products from the same category
          if (p.category_id) {
            const { data: related } = await supabase
              .from("products")
              .select(`
                id, name, slug, sku, retail_price, compare_at_price,
                is_new_arrival, is_featured, is_best_seller,
                brand:brands(name),
                category:categories(name, slug),
                product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
                inventory(stock_status)
              `)
              .eq("status", "published")
              .eq("category_id", p.category_id)
              .neq("id", p.id)
              .limit(4);
            setRelatedProducts(related ?? []);
          }
        } else {
          notFound();
        }
      } catch {
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  function handleAddToCart() {
    if (!product) return;
    cart.addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (!product) return;
    cart.addItem(product, quantity);
    router.push("/checkout");
  }

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#5C6460]">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto mb-4 text-[#8E9590]" />
          <p className="text-lg font-bold text-[#14231B]">Product not found</p>
          <Link
            href="/shop"
            className="inline-flex items-center mt-4 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-sm hover:bg-[#102D20] transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  // Normalise image list from DB shape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images: { url: string; alt: string; is_primary: boolean }[] = (product.product_images ?? [])
    .slice()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => ({
      url: img.secure_url,
      alt: img.alt_text || product.name,
      is_primary: img.is_primary ?? false,
    }));

  const primaryImage = images[selectedImageIdx] ?? images[0] ?? null;
  const isOnSale = product.compare_at_price && product.compare_at_price > product.retail_price;
  const discountPct = isOnSale
    ? Math.round(((product.compare_at_price - product.retail_price) / product.compare_at_price) * 100)
    : 0;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-16">
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
                    alt={primaryImage.alt || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                    <Package size={64} />
                  </div>
                )}

                {isOnSale && (
                  <span className="absolute top-4 left-4 px-2.5 py-1 text-[11px] font-bold rounded-sm bg-[#F5C518] text-[#14231B]">
                    Save {discountPct}%
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
            <p className="text-sm font-medium text-[#183D2B]">{product.brand?.name || "Aurelle"}</p>

            <h1 className="mt-1.5 text-3xl sm:text-4xl font-bold text-[#14231B] leading-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-[#14231B]">
                AED {Number(product.retail_price).toFixed(2)}
              </span>
              {isOnSale && product.compare_at_price && (
                <span className="text-base text-[#8E9590] line-through">
                  AED {Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
              <span className="text-xs text-[#8E9590]">incl. 5% VAT</span>
            </div>

            {(product.benefits || product.description) && (
              <p className="mt-4 text-[15px] text-[#4B534E] leading-relaxed break-words">
                {product.benefits || product.description}
              </p>
            )}

            <p className="mt-4 text-sm font-medium text-emerald-700">
              In stock — ready for same-day UAE dispatch
            </p>

            {/* Quantity + Actions */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center border-b border-[#DCCFB9]">
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className={`w-full py-3.5 px-6 rounded-sm font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
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
                className="w-full py-3.5 px-6 rounded-sm font-bold text-sm bg-[#C9A84C] hover:bg-[#b0923e] text-[#14231B] transition-colors cursor-pointer"
              >
                Buy now
              </button>
            </div>

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
                  onClick={() => setActiveTab("ingredients")}
                  className={`pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === "ingredients"
                      ? "border-[#183D2B] text-[#14231B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Ingredients
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
                  <div className="space-y-3">
                    <p>{product.description || "No description available."}</p>
                    {product.usage_instructions && (
                      <div>
                        <p className="font-semibold text-[#14231B] mb-1">How to use</p>
                        <p>{product.usage_instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <p className="font-mono text-xs leading-relaxed break-words">
                    {product.ingredients || "Ingredient list not yet available for this product."}
                  </p>
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

        {/* Related Products — only shown when DB has related items */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[#EFEAE0]">
            <h2 className="text-xl font-bold text-[#14231B] mb-6">You may also love</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}