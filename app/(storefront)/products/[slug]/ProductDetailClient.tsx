"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Heart,
  Share2,
} from "lucide-react";
import { toggleWishlist, isWishlisted as checkWishlisted } from "@/components/storefront/WishlistDrawer";
import ProductAccordions from "@/components/product/ProductAccordions";

interface ProductDetailClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProduct: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialRelatedProducts?: any[];
  slug: string;
}

export default function ProductDetailClient({
  initialProduct,
  initialRelatedProducts = [],
  slug,
}: ProductDetailClientProps) {
  const router = useRouter();
  const cart = useCart();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [product, setProduct] = useState<any>(initialProduct);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>(initialRelatedProducts);
  const [isLoading, setIsLoading] = useState(!initialProduct);
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("971501234567");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          const raw =
            data.settings.social_whatsapp ||
            data.settings.contact_phone ||
            data.settings.store_phone ||
            "";
          const clean = raw.replace(/\D/g, "");
          if (clean) setWhatsappNumber(clean);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (product?.id) {
      setIsWishlisted(checkWishlisted(product.id));
    }
  }, [product?.id]);

  const handleToggleWishlist = () => {
    if (!product?.id) return;
    const next = toggleWishlist(product.id);
    setIsWishlisted(next);
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const shareData = {
      title: product.name,
      text: `${product.name} | Aurelle UAE`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Progressive background loading (reviews + auth) - does NOT block product view
  useEffect(() => {
    if (!product && initialProduct) {
      setProduct(initialProduct);
      setIsLoading(false);
    }

    const currentProductId = product?.id || initialProduct?.id;
    if (currentProductId) {
      fetch(`/api/reviews?productId=${currentProductId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.reviews) {
            setReviews(data.reviews);
            if (data.summary) {
              setReviewSummary(data.summary);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load reviews:", err);
        });
    }

    async function checkAuth() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user ?? null);
      } catch {
        setCurrentUser(null);
      }
    }

    checkAuth();
  }, [product?.id, initialProduct]);

  async function handleRateClick() {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (!product) return;
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
      setNotEligibleMessage("Failed to verify eligibility. Please try again.");
    } finally {
      setEligibilityChecking(false);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || reviewRating === 0 || !reviewBody.trim()) {
      setReviewError("Please provide a rating and review text.");
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

  function getCartReadyProduct() {
    if (!product) return null;
    const primaryImg =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (product as any).product_images?.find((img: any) => img.is_primary)?.secure_url ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (product as any).product_images?.[0]?.secure_url;
    return {
      ...product,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tax_enabled: (product as any).tax_enabled !== false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      is_out_of_stock: Boolean((product as any).is_out_of_stock),
      images:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (product as any).images?.length > 0
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (product as any).images
          : primaryImg
          ? [{ url: primaryImg, alt: product.name, is_primary: true }]
          : [],
    };
  }

  function handleAddToCart() {
    if (product?.is_out_of_stock) return;
    const p = getCartReadyProduct();
    if (!p) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cart.addItem(p as any, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (product?.is_out_of_stock) return;
    const p = getCartReadyProduct();
    if (!p) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cart.addItem(p as any, quantity);
    router.push("/checkout");
  }

  // Smooth luxury shimmer fallback instead of harsh spinning wheel
  if (isLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 animate-pulse">
        <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 2xl:gap-16">
            <div className="lg:col-span-7 aspect-[3/4] 2xl:aspect-[4/5] bg-gray-200 rounded-none max-w-lg mx-auto w-full" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-6 w-32 bg-gray-200 rounded" />
              <div className="h-24 w-full bg-gray-200 rounded" />
              <div className="h-12 w-full bg-[#183D2B]/20 rounded" />
            </div>
          </div>
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
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  // Images resolution
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productImages = (product.product_images || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => img.secure_url);

  if (productImages.length === 0 && product.images) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product.images.forEach((img: any) => {
      const u = typeof img === "string" ? img : img.url;
      if (u) productImages.push(u);
    });
  }

  const primaryImage = productImages[selectedImageIdx] || productImages[0];
  const brandName = Array.isArray(product.brand)
    ? product.brand[0]?.name
    : product.brand?.name;
  const categoryName = Array.isArray(product.category)
    ? product.category[0]?.name
    : product.category?.name;
  const categorySlug = Array.isArray(product.category)
    ? product.category[0]?.slug
    : product.category?.slug;

  const originalPrice = product.compare_at_price;
  const currentPrice = product.retail_price;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12 2xl:py-16">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10 2xl:space-y-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs 2xl:text-sm text-[#5C6460]">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="hover:text-[#183D2B] transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/shop" className="hover:text-[#183D2B] transition-colors">
                Shop
              </Link>
            </li>
            {categoryName && (
              <>
                <li>/</li>
                <li>
                  <Link
                    href={`/categories/${categorySlug}`}
                    className="hover:text-[#183D2B] transition-colors"
                  >
                    {categoryName}
                  </Link>
                </li>
              </>
            )}
            <li>/</li>
            <li className="font-semibold text-[#14231B] truncate max-w-xs">{product.name}</li>
          </ol>
        </nav>

        {/* ── Mobile-Only Header: Brand, Product Name & Rating at Top of Product (Reference UX) ── */}
        <div className="block lg:hidden mb-4 space-y-2">
          {brandName && (
            <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
              {brandName}
            </span>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-[#1D211F] leading-snug tracking-tight">
            {product.name}
          </h1>

          {/* Rating & Reviews Aggregate (Only show stars if reviews exist, otherwise show badge) */}
          <div className="flex items-center gap-2 pt-0.5">
            {reviewSummary.totalReviews > 0 ? (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= Math.round(reviewSummary.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs text-[#5C6460]">
                  <span className="font-semibold text-[#1D211F]">
                    {reviewSummary.averageRating.toFixed(1)}
                  </span>{" "}
                  ({reviewSummary.totalReviews}{" "}
                  {reviewSummary.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : product.is_out_of_stock ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-semibold tracking-wide border border-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span>Out of Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold tracking-wide border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>In Stock — Ready to Dispatch</span>
              </span>
            )}
            {product.sku && (
              <>
                <span className="text-xs text-[#8E9590]">•</span>
                <span className="text-[11px] text-[#8E9590]">SKU: {product.sku}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Main Product Section ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 2xl:gap-14 items-start">
          {/* Left: Gallery (Col 7) */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4 2xl:gap-5">
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[560px] 2xl:max-h-[640px] pb-2 md:pb-0 scrollbar-none">
                {productImages.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative w-16 h-20 md:w-20 md:h-24 2xl:w-24 2xl:h-28 shrink-0 rounded-none overflow-hidden border transition-all ${
                      selectedImageIdx === idx
                        ? "border-[#183D2B] ring-1 ring-[#183D2B]"
                        : "border-[#DCCFB9]/60 hover:border-[#183D2B]/50"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-[3/4] 2xl:aspect-[4/5] bg-white rounded-none border border-[#DCCFB9]/60 overflow-hidden shadow-xs flex items-center justify-center min-h-[440px] lg:min-h-[520px] 2xl:min-h-[600px]">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl font-extrabold text-[#183D2B]/10 uppercase">
                  {product.name?.charAt(0) ?? "A"}
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-3 left-3 2xl:top-4 2xl:left-4 flex flex-col gap-1.5 z-10">
                {product.is_out_of_stock && (
                  <span className="bg-[#1D211F]/90 text-white text-[10px] 2xl:text-xs font-semibold tracking-wider px-2.5 py-1 uppercase rounded-none">
                    Out of Stock
                  </span>
                )}
                {discountPercent && !product.is_out_of_stock && (
                  <span className="bg-red-700 text-white text-[10px] 2xl:text-xs font-bold tracking-wider px-2 py-0.5 uppercase">
                    SAVE {discountPercent}%
                  </span>
                )}
                {product.is_new_arrival && (
                  <span className="bg-[#183D2B] text-white text-[10px] 2xl:text-xs font-medium tracking-wider px-2 py-0.5 uppercase">
                    New Arrival
                  </span>
                )}
              </div>

              {/* Top-Right Wishlist & Share Action Buttons (Reference UX) */}
              <div className="absolute top-3 right-3 2xl:top-4 2xl:right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-11 2xl:h-11 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCCFB9]/60 flex items-center justify-center text-[#1D211F] hover:text-[#183D2B] shadow-xs transition-colors cursor-pointer"
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart
                    size={17}
                    strokeWidth={1.8}
                    className={`2xl:w-5 2xl:h-5 ${isWishlisted ? "fill-[#183D2B] text-[#183D2B]" : "text-[#1D211F]"}`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 2xl:w-11 2xl:h-11 rounded-full bg-white/95 backdrop-blur-xs border border-[#DCCFB9]/60 flex items-center justify-center text-[#1D211F] hover:text-[#183D2B] shadow-xs transition-colors cursor-pointer"
                  aria-label="Share product"
                >
                  <Share2 size={15} strokeWidth={1.8} className="2xl:w-4.5 2xl:h-4.5" />
                  {copiedShare && (
                    <span className="absolute -bottom-7 right-0 bg-[#1D211F] text-white text-[10px] py-0.5 px-1.5 rounded-xs whitespace-nowrap shadow-md">
                      Link copied!
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile Pagination Dots (Reference UX) */}
              {productImages.length > 1 && (
                <div className="md:hidden absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
                  {productImages.map((_: string, idx: number) => (
                    <span
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        selectedImageIdx === idx ? "w-5 bg-[#183D2B]" : "w-1.5 bg-[#183D2B]/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Buy Box (Col 5) */}
          <div className="lg:col-span-5 space-y-5 2xl:space-y-6">
            <div className="hidden lg:block">
              {brandName && (
                <span className="text-xs 2xl:text-sm font-bold uppercase tracking-widest text-[#183D2B]">
                  {brandName}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl md:text-3xl 2xl:text-4xl font-bold text-[#1D211F] mt-1.5 leading-tight tracking-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews Aggregate (Only show stars if reviews exist, otherwise show badge) */}
              <div className="mt-2.5 flex items-center gap-2">
                {reviewSummary.totalReviews > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={`2xl:w-4 2xl:h-4 ${
                            s <= Math.round(reviewSummary.averageRating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs 2xl:text-sm text-[#5C6460]">
                      <span className="font-semibold text-[#1D211F]">
                        {reviewSummary.averageRating.toFixed(1)}
                      </span>{" "}
                      ({reviewSummary.totalReviews}{" "}
                      {reviewSummary.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : product.is_out_of_stock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-0.5 2xl:py-1 rounded-full bg-neutral-100 text-neutral-600 text-[10px] 2xl:text-xs font-semibold tracking-wide border border-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span>Out of Stock</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 2xl:px-3 py-0.5 2xl:py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] 2xl:text-xs font-semibold tracking-wide border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock — Ready to Dispatch</span>
                  </span>
                )}
              </div>

              {product.sku && (
                <p className="text-[11px] 2xl:text-xs text-[#8E9590] mt-1.5">SKU: {product.sku}</p>
              )}
            </div>

            {/* Price Box */}
            <div className="border-y border-[#DCCFB9]/40 py-4 2xl:py-5 space-y-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-[#1D211F] tracking-tight">
                  AED {currentPrice.toFixed(2)}
                </span>
                {originalPrice && originalPrice > currentPrice && (
                  <span className="text-base 2xl:text-lg text-[#8E9590] line-through font-medium">
                    AED {originalPrice.toFixed(2)}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs 2xl:text-sm font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-xs">
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs 2xl:text-sm text-[#8E9590]">
                Inclusive of 5% UAE VAT. Express courier delivery across all 7 Emirates.
              </p>
            </div>

            {/* Quick Description */}
            {product.description && (
              <p className="text-sm 2xl:text-base text-[#5C6460] leading-relaxed line-clamp-3 2xl:line-clamp-4">
                {product.description}
              </p>
            )}

            {/* UAE Express Delivery Promise Card (Dynamic from Product Specs) */}
            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dSpecs = (product.specifications as any) || {};
              const isEnabled = dSpecs.delivery_enabled !== false;
              if (!isEnabled) return null;

              const badge = dSpecs.delivery_badge || "UAE Express Delivery";
              const dispatch = dSpecs.delivery_dispatch || "Dispatches in 24h";
              const note =
                dSpecs.delivery_note ||
                "Delivering across Dubai, Abu Dhabi, Sharjah & all 7 Emirates. Free shipping on orders ≥ 199 AED.";

              return (
                <div className="p-3.5 2xl:p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-sm flex items-start gap-3">
                  <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-full bg-[#183D2B] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Truck size={17} className="2xl:w-5 2xl:h-5" />
                  </div>
                  <div className="text-xs 2xl:text-sm space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#183D2B] uppercase tracking-wide text-[11px] 2xl:text-xs bg-[#183D2B]/10 px-2 py-0.5 rounded-xs">
                        {badge}
                      </span>
                      <span className="text-emerald-800 font-semibold text-[11px] 2xl:text-xs">
                        {dispatch}
                      </span>
                    </div>
                    <p className="text-[#5C6460] text-[11px] 2xl:text-xs leading-normal">
                      {note}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Quantity Selector & Add to Cart */}
            {!product.is_out_of_stock ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-[#DCCFB9] rounded-none bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-10 2xl:w-12 h-11 2xl:h-13 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] disabled:opacity-30 cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-10 2xl:w-12 text-center text-sm 2xl:text-base font-semibold text-[#1D211F]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-10 2xl:w-12 h-11 2xl:h-13 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 2xl:h-13 px-6 2xl:px-8 text-xs 2xl:text-sm uppercase tracking-widest font-bold rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      added
                        ? "bg-[#183D2B] text-white"
                        : "bg-[#183D2B] text-white hover:bg-[#102D20] active:scale-[0.99] shadow-sm hover:shadow-md"
                    }`}
                  >
                    {added ? (
                      <>
                        <Check size={18} />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full h-11 2xl:h-13 border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B] hover:text-white text-xs 2xl:text-sm uppercase tracking-widest font-bold rounded-none transition-colors cursor-pointer"
                >
                  Buy Now with Express Checkout
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 2xl:p-6 bg-[#FAF8F5] border border-[#DCCFB9] rounded-none space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-[#1D211F]">
                    Currently Out of Stock
                  </span>
                </div>

                <p className="text-xs 2xl:text-sm text-[#5C6460] leading-relaxed">
                  This product is temporarily sold out and being restocked. Want to check estimated arrival or pre-order? Message us directly on WhatsApp for instant restock updates.
                </p>

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hello Aurelle UAE, I want to enquire about restocking for:\n\n• Product: ${product.name}\n• SKU: ${product.sku || "N/A"}\n\nPlease notify me when available!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 2xl:h-13 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs 2xl:text-sm uppercase tracking-wider rounded-none flex items-center justify-center gap-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" className="shrink-0">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.214 8.214 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.19-.31a8.232 8.232 0 01-1.26-4.44c0-4.54 3.7-8.24 8.24-8.24v.02zm-3.53 4.67c-.2 0-.41.02-.6.1-.21.09-.64.38-.64 1.15 0 .76.56 1.73.64 1.84.08.11 1.1 1.68 2.67 2.36 1.57.67 1.57.45 1.85.42.29-.02.92-.38 1.05-.74.13-.37.13-.68.09-.75-.04-.07-.15-.11-.32-.19-.17-.08-1.03-.51-1.19-.57-.16-.06-.28-.09-.39.09-.12.17-.45.57-.55.69-.1.11-.2.13-.37.04-.17-.08-.73-.27-1.39-.86-.51-.46-.86-1.03-.96-1.2-.1-.17-.01-.27.07-.35.08-.08.17-.2.26-.3.09-.1.12-.17.18-.28.06-.11.03-.21-.01-.3-.05-.08-.39-.95-.54-1.3-.14-.34-.29-.29-.39-.3z" />
                  </svg>
                  <span>Notify Me / Enquire on WhatsApp</span>
                </a>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 2xl:gap-3.5 pt-4 2xl:pt-6 border-t border-[#DCCFB9]/40 text-center">
              <div className="flex flex-col items-center gap-1.5 p-2.5 2xl:p-3.5 rounded-xs bg-[#FAF8F5]/80 border border-[#DCCFB9]/40">
                <Truck size={20} className="text-[#183D2B] 2xl:w-6 2xl:h-6" />
                <span className="text-[11px] 2xl:text-xs font-bold text-[#1D211F]">Next-Day Delivery</span>
                <span className="text-[10px] 2xl:text-[11px] text-[#8E9590]">Across all UAE</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2.5 2xl:p-3.5 rounded-xs bg-[#FAF8F5]/80 border border-[#DCCFB9]/40">
                <ShieldCheck size={20} className="text-[#183D2B] 2xl:w-6 2xl:h-6" />
                <span className="text-[11px] 2xl:text-xs font-bold text-[#1D211F]">100% Genuine</span>
                <span className="text-[10px] 2xl:text-[11px] text-[#8E9590]">Direct from brand</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2.5 2xl:p-3.5 rounded-xs bg-[#FAF8F5]/80 border border-[#DCCFB9]/40">
                <RotateCcw size={20} className="text-[#183D2B] 2xl:w-6 2xl:h-6" />
                <span className="text-[11px] 2xl:text-xs font-bold text-[#1D211F]">Easy Returns</span>
                <span className="text-[10px] 2xl:text-[11px] text-[#8E9590]">14-day policy</span>
              </div>
            </div>

            {/* Product Highlights & Specifications Accordions */}
            <ProductAccordions product={product} />
          </div>
        </div>

        {/* ── Product Information Tabs ────────────────────────────────────── */}
        <div className="bg-white rounded-none border border-[#DCCFB9]/60 p-6 md:p-8 2xl:p-10 shadow-xs space-y-6">
          <div className="flex border-b border-[#DCCFB9]/40 gap-6 2xl:gap-8">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`pb-3 2xl:pb-4 text-xs 2xl:text-sm uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "details"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Description & Benefits
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ingredients")}
              className={`pb-3 2xl:pb-4 text-xs 2xl:text-sm uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "ingredients"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Ingredients & Usage
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 2xl:pb-4 text-xs 2xl:text-sm uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === "shipping"
                  ? "border-[#183D2B] text-[#183D2B]"
                  : "border-transparent text-[#8E9590] hover:text-[#1D211F]"
              }`}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="pt-2 text-sm 2xl:text-base text-[#5C6460] leading-relaxed">
            {activeTab === "details" && (
              <div className="space-y-4">
                <p>{product.description || "No detailed description provided."}</p>
                {product.benefits && (
                  <div className="pt-2">
                    <h4 className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-[#1D211F] mb-2">
                      Key Benefits:
                    </h4>
                    <p className="whitespace-pre-line">{product.benefits}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div className="space-y-4">
                {product.ingredients ? (
                  <div>
                    <h4 className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-[#1D211F] mb-1.5">
                      Full Ingredients:
                    </h4>
                    <p className="text-xs 2xl:text-sm font-mono bg-[#FAF8F5] p-3 2xl:p-4 border border-[#DCCFB9]/40 rounded-sm">
                      {product.ingredients}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs 2xl:text-sm text-[#8E9590]">
                    Ingredients list not specified for this product.
                  </p>
                )}
                {product.usage_instructions && (
                  <div>
                    <h4 className="text-xs 2xl:text-sm font-bold uppercase tracking-wider text-[#1D211F] mb-1.5">
                      How to Use:
                    </h4>
                    <p className="whitespace-pre-line">{product.usage_instructions}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="space-y-3">
                <p>
                  Orders placed before 2:00 PM GST are processed same day. Delivery across
                  Dubai, Abu Dhabi, Sharjah, and other Emirates within 24-48 business hours.
                </p>
                <p>
                  Standard domestic shipping is AED 20 (Free on orders above AED 199). Cash on
                  delivery (COD) and major cards accepted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Verified Customer Reviews Section ────────────────────────────── */}
        <div className="bg-white rounded-none border border-[#DCCFB9]/60 p-6 md:p-8 2xl:p-10 shadow-xs space-y-6 2xl:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#DCCFB9]/40 pb-4">
            <div>
              <h3 className="text-lg 2xl:text-2xl font-bold text-[#1D211F] tracking-tight">Customer Reviews</h3>
              <p className="text-xs 2xl:text-sm text-[#8E9590]">
                Verified reviews from verified Aurelle purchasers only.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRateClick}
              disabled={eligibilityChecking}
              className="inline-flex items-center gap-1.5 px-4 2xl:px-5 py-2 2xl:py-2.5 border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B] hover:text-white text-xs 2xl:text-sm font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50"
            >
              <Edit3 size={14} />
              <span>{eligibilityChecking ? "Checking eligibility..." : "Write a Review"}</span>
            </button>
          </div>

          {/* Not eligible message alert */}
          {notEligible && notEligibleMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm">
              {notEligibleMessage}
            </div>
          )}

          {/* Review Form (Conditional) */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit}
              className="p-4 bg-[#FAF8F5] border border-[#DCCFB9] rounded-sm space-y-4"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D211F]">
                Submit Your Review
              </h4>

              {/* Star Selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5C6460]">Your Rating:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        size={18}
                        className={
                          (hoverRating || reviewRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text Area */}
              <div>
                <textarea
                  rows={3}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share details of your experience with this product..."
                  className="w-full p-3 text-xs border border-[#DCCFB9] rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#183D2B]"
                />
              </div>

              {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs text-green-700">{reviewSuccess}</p>}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={reviewSubmitting || reviewRating === 0 || !reviewBody.trim()}
                  className="px-5 py-2 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-none hover:bg-[#102D20] disabled:opacity-40 cursor-pointer"
                >
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="text-xs text-[#8E9590] hover:text-[#1D211F]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-xs 2xl:text-sm text-[#8E9590]">
              No reviews have been submitted for this product yet. Be the first verified customer to leave feedback!
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-[#DCCFB9]/30">
              {reviews.slice(0, visibleReviewsCount).map((rev) => (
                <div key={rev.id} className="pt-4 first:pt-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
                        />
                      ))}
                      <span className="text-[11px] 2xl:text-xs font-semibold text-[#1D211F] ml-1">
                        {rev.customer_name || "Verified Customer"}
                      </span>
                    </div>
                    <span className="text-[10px] 2xl:text-[11px] text-[#8E9590]">
                      {new Date(rev.created_at).toLocaleDateString("en-AE", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs 2xl:text-sm text-[#5C6460] leading-relaxed">{rev.body}</p>
                </div>
              ))}

              {visibleReviewsCount < reviews.length && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setVisibleReviewsCount((c) => c + 5)}
                    className="text-xs 2xl:text-sm font-bold text-[#183D2B] hover:underline uppercase tracking-wider"
                  >
                    View More Reviews ({reviews.length - visibleReviewsCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Related Products ────────────────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl 2xl:text-2xl font-bold text-[#1D211F] tracking-tight">You May Also Like</h3>
              <Link
                href={`/categories/${categorySlug || "all"}`}
                className="text-xs 2xl:text-sm font-bold text-[#183D2B] hover:underline uppercase tracking-wider"
              >
                View Category
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 2xl:gap-8">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal for guest reviews */}
      <AccountAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
      />
    </div>
  );
}
