"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { getProductBySlug, AURELLE_PRODUCTS } from "@/lib/products/mock-products";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import {
  ChevronRight,
  Star,
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  Briefcase,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const cart = useCart();

  const product = getProductBySlug(slug) || AURELLE_PRODUCTS[0];

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "shipping">("details");

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images[selectedImageIdx] ||
    product.images[0] || {
      url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
      alt: product.name,
      is_primary: true,
    };
  const isOnSale = product.compare_at_price && product.compare_at_price > product.retail_price;
  const discountPct = isOnSale
    ? Math.round(((product.compare_at_price! - product.retail_price) / product.compare_at_price!) * 100)
    : 0;

  const relatedProducts = AURELLE_PRODUCTS.filter(
    (p) => p.id !== product.id && p.category_slug === product.category_slug
  ).slice(0, 4);

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

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#5C6460]">
          <Link href="/" className="hover:text-[#183D2B] transition-colors">
            Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/shop" className="hover:text-[#183D2B] transition-colors">
            Shop
          </Link>
          <ChevronRight size={13} />
          <Link
            href={`/categories/${product.category_slug}`}
            className="hover:text-[#183D2B] transition-colors"
          >
            {product.category_name}
          </Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#1D211F] truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Product Main Container */}
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-6 md:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* ── Left Column: Media Gallery ─────────────────────────────── */}
          <div className="space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#DCCFB9]/40 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={primaryImage.url}
                alt={primaryImage.alt || product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.is_new_arrival && (
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#183D2B] text-white rounded-full shadow-xs">
                    New Arrival
                  </span>
                )}
                {isOnSale && (
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#C0392B] text-white rounded-full shadow-xs">
                    Save {discountPct}%
                  </span>
                )}
                {product.is_best_seller && (
                  <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#C9A84C] text-[#102D20] rounded-full shadow-xs">
                    Best Seller
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selectors */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIdx === idx
                        ? "border-[#183D2B] ring-2 ring-[#183D2B]/20"
                        : "border-[#DCCFB9]/60 hover:border-[#183D2B]/50 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right Column: Info & Actions ───────────────────────────── */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
                  {product.brand_name}
                </span>
                <span className="text-xs font-mono text-[#8E9590]">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1D211F] leading-snug">
                {product.name}
              </h1>

              {/* Star Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating) ? "fill-current" : "opacity-30"}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#1D211F]">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-[#5C6460]">({product.reviews_count} verified reviews)</span>
              </div>

              {/* Price Block */}
              <div className="p-4 bg-[#F7F5EF]/80 rounded-2xl border border-[#DCCFB9]/50 flex items-baseline justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#183D2B]">
                    AED {product.retail_price.toFixed(2)}
                  </span>
                  {isOnSale && product.compare_at_price && (
                    <span className="text-base text-[#8E9590] line-through">
                      AED {product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-[#5C6460]">
                  5% UAE VAT included
                </span>
              </div>

              <p className="text-sm text-[#5C6460] leading-relaxed">
                {product.short_description || product.description}
              </p>

              {/* B2B Wholesale Box */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/70 flex items-start gap-3">
                <Briefcase size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#1D211F]">B2B Wholesale Trade Pricing</p>
                  <p className="text-[#5C6460] mt-0.5">
                    MOQ {product.wholesale_moq} units @ AED {product.wholesale_price}/unit.{" "}
                    <Link href="/wholesale" className="text-[#183D2B] font-bold hover:underline">
                      Apply for Wholesale Account →
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4 pt-4 border-t border-[#DCCFB9]/40">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D211F]">Quantity:</span>
                <div className="flex items-center border border-[#DCCFB9] rounded-full bg-[#F7F5EF] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 rounded-full bg-white text-xs font-bold text-[#1D211F] flex items-center justify-center shadow-xs hover:bg-[#183D2B] hover:text-white transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-[#1D211F]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-7 h-7 rounded-full bg-white text-xs font-bold text-[#1D211F] flex items-center justify-center shadow-xs hover:bg-[#183D2B] hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>

                <span className="text-xs font-bold text-emerald-700 ml-auto">
                  ✓ In Stock for Immediate UAE Dispatch
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                    added
                      ? "bg-emerald-600 text-white"
                      : "bg-[#183D2B] hover:bg-[#102D20] text-white"
                  }`}
                >
                  {added ? (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      <span>Added to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={2} />
                      <span>Add to Bag</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-6 rounded-full font-bold text-xs uppercase tracking-wider bg-[#C9A84C] hover:bg-[#b0923e] text-[#102D20] shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#DCCFB9]/30 text-center">
                <div className="p-2 space-y-1">
                  <Truck size={18} className="mx-auto text-[#183D2B]" />
                  <p className="text-[11px] font-bold text-[#1D211F]">UAE Fast Delivery</p>
                  <p className="text-[10px] text-[#5C6460]">Same-Day / 24h</p>
                </div>
                <div className="p-2 space-y-1 border-x border-[#DCCFB9]/30">
                  <ShieldCheck size={18} className="mx-auto text-[#183D2B]" />
                  <p className="text-[11px] font-bold text-[#1D211F]">100% Authentic</p>
                  <p className="text-[10px] text-[#5C6460]">Direct Sourced</p>
                </div>
                <div className="p-2 space-y-1">
                  <RotateCcw size={18} className="mx-auto text-[#183D2B]" />
                  <p className="text-[11px] font-bold text-[#1D211F]">14-Day Returns</p>
                  <p className="text-[10px] text-[#5C6460]">Hassle-Free</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion Tabs for Details */}
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 shadow-xs p-6 md:p-8 space-y-6">
          <div className="flex border-b border-[#DCCFB9]/40 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 ${
                activeTab === "details"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#5C6460] hover:text-[#1D211F]"
              }`}
            >
              Description & Ritual
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ingredients")}
              className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 ${
                activeTab === "ingredients"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#5C6460] hover:text-[#1D211F]"
              }`}
            >
              Ingredients (INCI)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 text-sm font-bold tracking-tight transition-colors border-b-2 ${
                activeTab === "shipping"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#5C6460] hover:text-[#1D211F]"
              }`}
            >
              UAE Delivery & Returns
            </button>
          </div>

          <div className="text-sm text-[#5C6460] leading-relaxed">
            {activeTab === "details" && (
              <div className="space-y-4">
                <p>{product.description}</p>
                {product.how_to_use && (
                  <div>
                    <h4 className="font-bold text-[#1D211F] mb-1">Recommended Application:</h4>
                    <p>{product.how_to_use}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-2">
                <h4 className="font-bold text-[#1D211F]">Full Ingredient List:</h4>
                <p className="font-mono text-xs bg-[#F7F5EF] p-4 rounded-xl border border-[#DCCFB9]/40 leading-relaxed">
                  {product.ingredients || "Aqua, Glycerin, Botanical Extracts, Tocopherol (Vitamin E)."}
                </p>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-3">
                <p>
                  <strong>Orders placed before 2:00 PM GST</strong> qualify for Same-Day dispatch in Dubai and Abu Dhabi.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Dubai, Sharjah, Ajman: 24-hour delivery</li>
                  <li>Abu Dhabi, Ras Al Khaimah, Fujairah, Umm Al Quwain: 24–48 hours</li>
                  <li>Free delivery on all orders over AED 199. Standard flat rate AED 20 otherwise.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <h2 className="text-2xl font-serif font-bold text-[#1D211F]">
              You May Also Love
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    sku: p.sku,
                    retail_price: p.retail_price,
                    compare_at_price: p.compare_at_price,
                    is_new_arrival: p.is_new_arrival,
                    is_best_seller: p.is_best_seller,
                    is_featured: p.is_featured,
                    brand: { name: p.brand_name },
                    category: { name: p.category_name, slug: p.category_slug },
                    product_images: p.images.map((img, idx) => ({
                      cloudinary_public_id: img.alt,
                      secure_url: img.url,
                      is_primary: img.is_primary,
                      sort_order: idx,
                    })),
                    inventory: { stock_status: p.stock_status },
                    wholesale_price: p.wholesale_price,
                    wholesale_moq: p.wholesale_moq,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
