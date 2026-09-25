"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import {
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  Send,
  Package,
  Minus,
  Plus,
  Star,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/utils/price";
import ProductCard from "@/components/product/ProductCard";
import WholesaleEnquiryModal from "@/components/wholesale/WholesaleEnquiryModal";

interface WholesaleProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function WholesaleProductDetailPage({ params }: WholesaleProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "shipping">("details");

  // Reviews state (real database reviews only)
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    averageRating: number;
    totalReviews: number;
  }>({
    averageRating: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const supabase = createClient() as any;
        const { data: p, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, sku, category_id, description, benefits, ingredients, usage_instructions,
            retail_price, compare_at_price, wholesale_price, wholesale_moq, is_wholesale_available,
            is_published, is_featured, is_best_seller, is_new_arrival,
            brand:brands(name, slug),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status, stock_quantity)
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (!error && p) {
          setProduct(p);
          const initialMoq = Math.max(1, p.wholesale_moq || 1);
          setQuantity(initialMoq);

          // Fetch reviews
          try {
            const revRes = await fetch(`/api/reviews?productId=${p.id}`);
            const revData = await revRes.json();
            if (revRes.ok && revData.reviews) {
              setReviews(revData.reviews);
              if (revData.summary) {
                setReviewSummary(revData.summary);
              }
            }
          } catch {
            // Non-critical
          }

          // Related wholesale products
          if (p.category_id) {
            const { data: related } = await supabase
              .from("products")
              .select(`
                id, name, slug, sku, retail_price, compare_at_price, wholesale_price, wholesale_moq,
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

  if (isLoading) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#5C6460]">Loading wholesale product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Package size={44} className="mx-auto text-[#8E9590]" />
          <p className="text-base font-bold text-[#14231B]">Product not found</p>
          <Link
            href="/wholesale#all-products"
            className="inline-flex items-center px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-sm"
          >
            Return to Wholesale Catalog
          </Link>
        </div>
      </div>
    );
  }

  const moq = Math.max(1, product.wholesale_moq || 1);
  const wholesalePrice = Number(product.wholesale_price || product.retail_price || 0);
  const lineTotal = wholesalePrice * quantity;

  // Images normalized
  const images = (product.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((img: any) => ({
      url: img.secure_url,
      alt: img.alt_text || product.name,
      is_primary: img.is_primary ?? false,
    }));

  const primaryImage = images[selectedImageIdx] ?? images[0] ?? null;


  return (
    <div className="bg-white min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Back Link & Breadcrumb */}
   

        {/* Gallery & Commercial Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-sm overflow-hidden bg-[#FAF8F5]">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                  <Package size={56} />
                </div>
              )}

              {/* Wholesale MOQ Badge overlay */}
              <div className="absolute top-3 left-3 bg-[#183D2B] text-white text-[11px] font-bold px-2.5 py-1 rounded-sm shadow-xs uppercase tracking-wider">
                MOQ: {moq} units
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-16 rounded-sm overflow-hidden shrink-0 transition-opacity cursor-pointer ${
                      selectedImageIdx === idx ? "opacity-100 ring-2 ring-[#183D2B]" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Commercial Details */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#183D2B]">
                {product.brand?.name || "Aurelle"}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl text-[#14231B] leading-tight">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-xs text-[#8E9590] font-mono mt-1">SKU: {product.sku}</p>
              )}
            </div>

            {/* Wholesale Price ONLY */}
            <div className="p-4 bg-[#FAF8F5] rounded-sm space-y-2">
              <span className="text-[10px] font-bold text-[#8E9590] uppercase tracking-wider block">
                Wholesale Trade Price
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#183D2B]">
                  {formatPrice(wholesalePrice)}
                </span>
                <span className="text-xs text-[#5C6460]">/ unit (excl. 5% VAT)</span>
              </div>
              <p className="text-[11px] text-[#5C6460]">
                Strict minimum order volume of <strong>{moq} units</strong> applies to this product.
              </p>
            </div>

            {/* Benefits / Short Description */}
            {(product.benefits || product.description) && (
              <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed">
                {product.benefits || product.description}
              </p>
            )}

            {/* Wholesale MOQ Enforced Stepper */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#14231B]">
                Order Quantity (Min. {moq} units)
              </label>

              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#FAF8F5] rounded-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(moq, q - 1))}
                    disabled={quantity <= moq}
                    className="w-10 h-10 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] rounded-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min={moq}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setQuantity(Math.max(moq, val));
                    }}
                    className="w-16 text-center text-sm font-bold text-[#14231B] bg-transparent outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] rounded-sm transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-[#8E9590] block">Order Subtotal</span>
                  <span className="text-sm font-bold text-[#14231B]">
                    {formatPrice(lineTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Enquiry Now */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEnquiryModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-sm font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#183D2B] hover:bg-[#102D20] text-white transition-colors cursor-pointer shadow-xs"
              >
                <Send size={15} />
                <span>Enquiry Now</span>
              </button>
            </div>

            {/* B2B Trust Pillars */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-[#EFEAE0] text-center">
              <div className="space-y-1">
                <Truck size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">Dubai Warehouse</p>
                <p className="text-[10px] text-[#8E9590]">24-48h GCC Freight</p>
              </div>
              <div className="space-y-1">
                <ShieldCheck size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">TRN Tax Invoice</p>
                <p className="text-[10px] text-[#8E9590]">5% VAT Compliant</p>
              </div>
              <div className="space-y-1">
                <Building2 size={18} className="mx-auto text-[#183D2B]" />
                <p className="text-[11px] font-bold text-[#14231B]">Authentic Goods</p>
                <p className="text-[10px] text-[#8E9590]">Direct Sourced</p>
              </div>
            </div>

            {/* Details tabs */}
            <div className="pt-4">
              <div className="flex gap-4 border-b border-[#EFEAE0]">
                <button
                  type="button"
                  onClick={() => setActiveTab("details")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "details"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Product Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ingredients")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "ingredients"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Ingredients
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shipping")}
                  className={`pb-2.5 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    activeTab === "shipping"
                      ? "border-[#183D2B] text-[#183D2B]"
                      : "border-transparent text-[#8E9590] hover:text-[#14231B]"
                  }`}
                >
                  Wholesale Freight
                </button>
              </div>

              <div className="pt-4 text-xs text-[#5C6460] leading-relaxed">
                {activeTab === "details" && (
                  <div className="space-y-2">
                    <p>{product.description || "Commercial product specification provided by manufacturer."}</p>
                    {product.usage_instructions && (
                      <p><strong>Application:</strong> {product.usage_instructions}</p>
                    )}
                  </div>
                )}

                {activeTab === "ingredients" && (
                  <p className="font-mono text-[11px]">
                    {product.ingredients || "Full INCI ingredient list is registered with Dubai Municipality."}
                  </p>
                )}

                {activeTab === "shipping" && (
                  <div className="space-y-1.5">
                    <p>Wholesale orders are consolidated from our Dubai temperature-controlled facility.</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Pallet &amp; carton dispatch across Dubai, Abu Dhabi, Sharjah: 24–48 hours.</li>
                      <li>GCC Regional Cross-border Freight (Saudi Arabia, Oman, Qatar, Bahrain, Kuwait): 3–5 business days.</li>
                      <li>Standard commercial packing slips and verified batch numbers provided.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Wholesale Products */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-[#EFEAE0] space-y-6">
            <h3 className="text-lg font-bold text-[#14231B]">
              Related Wholesale Products
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <div key={p.id}>
                  <ProductCard product={p} isWholesaleUser={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {product && (
        <WholesaleEnquiryModal
          open={enquiryModalOpen}
          onClose={() => setEnquiryModalOpen(false)}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            wholesale_price: wholesalePrice,
            retail_price: Number(product.retail_price || 0),
            wholesale_moq: moq,
            brand: product.brand,
            category: product.category,
            image: primaryImage?.url,
          }}
          initialQuantity={quantity}
        />
      )}
    </div>
  );
}
