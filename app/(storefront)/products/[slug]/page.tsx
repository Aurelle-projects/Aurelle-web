"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import AccountAuthModal from "@/components/auth/AccountAuthModal";
import {
  Check,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingBag,
  Package,
  Minus,
  Plus,
  Star,
  Edit3,
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

  // Reviews state (real database reviews only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{
    averageRating: number;
    totalReviews: number;
    ratingCounts: Record<number, number>;
  }>({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  // Auth + review form state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [eligibilityChecking, setEligibilityChecking] = useState(false);
  const [notEligible, setNotEligible] = useState(false);
  const [notEligibleMessage, setNotEligibleMessage] = useState<string | null>(null);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(5);

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

          // Fetch real published reviews for this product from DB
          try {
            const revRes = await fetch(`/api/reviews?productId=${p.id}`);
            const revData = await revRes.json();
            if (revRes.ok && revData.reviews) {
              setReviews(revData.reviews);
              if (revData.summary) {
                setReviewSummary(revData.summary);
              }
            }
          } catch (rErr) {
            console.error("Failed to load reviews:", rErr);
          }

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

    async function checkAuth() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user ?? null);
      } catch {
        setCurrentUser(null);
      }
    }

    loadProduct();
    checkAuth();
  }, [slug]);

  async function handleRateClick() {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!product) return;
    // Check if this user has an unreviewed delivered purchase for this product
    setEligibilityChecking(true);
    setNotEligible(false);
    setNotEligibleMessage(null);
    try {
      const res = await fetch(
        `/api/reviews?checkEligibility=true&productId=${product.id}`
      );
      const data = await res.json();
      if (res.ok && data.eligible) {
        setEligibleOrderId(data.orderId || null);
        setShowReviewForm(true);
        setReviewError(null);
        setReviewSuccess(null);
      } else {
        setNotEligible(true);
        setNotEligibleMessage(
          data.message ||
            (data.reason === "already_reviewed"
              ? "You have already submitted a review for this product from your purchase. If you purchase this product again in a new order, you can submit another review."
              : "Purchase required. You can only review products you have bought and received. Reviews are available once your order status is marked as Delivered.")
        );
      }
    } catch {
      setNotEligible(true);
      setNotEligibleMessage("Unable to verify purchase status. Please try again.");
    } finally {
      setEligibilityChecking(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (reviewRating < 1) {
      setReviewError("Please select a star rating before submitting.");
      return;
    }
    if (!reviewBody.trim()) {
      setReviewError("Please write your review before submitting.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          order_id: eligibleOrderId,
          rating: reviewRating,
          body: reviewBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || "Failed to submit review.");
      } else {
        setReviewSuccess("Thank you! Your review has been submitted.");
        setReviewBody("");
        setReviewRating(0);
        setShowReviewForm(false);
        // Refresh reviews
        const revRes = await fetch(`/api/reviews?productId=${product.id}`);
        const revData = await revRes.json();
        if (revRes.ok && revData.reviews) {
          setReviews(revData.reviews);
          if (revData.summary) setReviewSummary(revData.summary);
        }
      }
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  }

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

            <a
              href="#reviews"
              className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-[#183D2B] hover:underline"
            >
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={
                      reviewSummary.totalReviews > 0 &&
                      i < Math.round(reviewSummary.averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span>
                {reviewSummary.totalReviews > 0
                  ? `${reviewSummary.averageRating.toFixed(1)} (${reviewSummary.totalReviews} ${
                      reviewSummary.totalReviews === 1 ? "review" : "reviews"
                    })`
                  : "0.0 (0 reviews)"}
              </span>
            </a>

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

        {/* ── Overall Reviews Section ──────────────────────────────── */}
        <div id="reviews" className="mt-20 pt-12 border-t border-[#EFEAE0]">
          {/* Review Heading & Info Note */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#14231B]">
              Customer Reviews
            </h2>
            <p className="mt-1 text-xs text-[#5C6460]">
              Only registered users may submit a review.
            </p>
          </div>

          {/* Overall rating first & Rate this Product button on same line (space-between) */}
          <div className="mt-6 pb-6 border-b border-[#EFEAE0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Overall Rating Box (shown first on the left) */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE9DF] self-start sm:self-auto">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#183D2B]">
                  {reviewSummary.totalReviews > 0 ? reviewSummary.averageRating.toFixed(1) : "0.0"}
                </span>
                <span className="text-[11px] text-[#8E9590] block mt-0.5">out of 5</span>
              </div>
              <div className="border-l border-[#EDE9DF] pl-5 space-y-1">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      className={
                        reviewSummary.totalReviews > 0 &&
                        s <= Math.round(reviewSummary.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <p className="text-xs font-semibold text-[#14231B]">
                  {reviewSummary.totalReviews === 0
                    ? "No reviews yet"
                    : `${reviewSummary.totalReviews} ${
                        reviewSummary.totalReviews === 1 ? "review" : "reviews"
                      }`}
                </p>
              </div>
            </div>

            {/* Rate this Product Button (on the same line with space-between) */}
            {!showReviewForm && (
              <div className="self-start sm:self-auto">
                <button
                  id="write-review-btn"
                  type="button"
                  disabled={eligibilityChecking}
                  onClick={handleRateClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-lg hover:bg-[#102D20] disabled:opacity-60 transition-colors shadow-sm cursor-pointer"
                >
               
                  {eligibilityChecking ? "Checking…" : "Rate this Product"}
                </button>
              </div>
            )}
          </div>

          {/* Not eligible notice */}
          {notEligible && (
            <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 max-w-xl">
              <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
              <p className="text-xs text-amber-800 leading-relaxed">
                {notEligibleMessage || (
                  <>
                    <strong>Purchase required.</strong> You can only review products you have bought and received. Reviews are available once your order status is marked as <strong>Delivered</strong>.
                  </>
                )}
              </p>
            </div>
          )}

          {/* ── Inline Review Form (when open) ─────────────────────────── */}
          {showReviewForm && (
            <div className="py-6 border-b border-[#EFEAE0]">
              {reviewSuccess && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                  {reviewSuccess}
                </div>
              )}
              <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-lg">
                <p className="text-sm font-bold text-[#14231B]">Your Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(s)}
                      className="p-0.5 focus:outline-none cursor-pointer"
                      aria-label={`Rate ${s} star${s > 1 ? "s" : ""}`}
                    >
                      <Star
                        size={28}
                        className={
                          s <= (hoverRating || reviewRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14231B] mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    id="review-body"
                    rows={4}
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share your experience with this product…"
                    className="w-full px-4 py-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] placeholder-[#A8B7A3] focus:bg-white focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 outline-none transition-all resize-none"
                  />
                </div>

                {reviewError && (
                  <p className="text-xs font-semibold text-red-600">{reviewError}</p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-lg hover:bg-[#102D20] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit Review"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowReviewForm(false); setReviewError(null); }}
                    className="px-5 py-2.5 bg-[#F7F5EF] text-[#5C6460] text-xs font-bold rounded-lg hover:bg-[#EFEAE0] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── Reviews list (ordered best / highest-rated first, 5 initial, see more) ── */}
          {(() => {
            const sortedReviews = [...reviews].sort((a, b) => {
              if (b.rating !== a.rating) return b.rating - a.rating;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            const displayedReviews = sortedReviews.slice(0, visibleReviewsCount);
            const hasMoreReviews = sortedReviews.length > visibleReviewsCount;

            if (reviews.length === 0) {
              return (
                <div className="py-14 text-center">
                  <p className="text-sm font-semibold text-[#14231B]">No reviews yet for this product</p>
                  <p className="text-xs text-[#8E9590] mt-1.5 max-w-sm mx-auto">
                    Be the first to share your experience with this product.
                  </p>
                </div>
              );
            }

            return (
              <div>
                <div className="divide-y divide-[#EFEAE0]">
                  {displayedReviews.map((rev) => (
                    <div key={rev.id} className="py-6 space-y-2">
                      <h4 className="text-sm font-bold text-[#14231B]">{rev.author_name}</h4>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
                      <p className="text-sm text-[#4B534E] leading-relaxed break-words pt-1">{rev.body}</p>
                    </div>
                  ))}
                </div>

                {hasMoreReviews && (
                  <div className="py-8 text-center border-t border-[#EFEAE0]">
                    <button
                      type="button"
                      id="see-more-reviews-btn"
                      onClick={() => setVisibleReviewsCount((prev) => prev + 5)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#EDE9DF] bg-[#FAF8F5] text-xs font-bold text-[#183D2B] hover:bg-[#EFEAE0] hover:border-[#183D2B]/30 transition-all shadow-2xs cursor-pointer"
                    >
                      See More Reviews ({sortedReviews.length - visibleReviewsCount} remaining)
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Auth Modal */}
        <AccountAuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode="login"
        />

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