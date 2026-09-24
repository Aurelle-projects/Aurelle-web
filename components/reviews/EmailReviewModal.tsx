"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Star,
  Check,
  AlertCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export interface ReviewOrderItem {
  orderItemId?: string;
  productId: string;
  name: string;
  image?: string | null;
  quantity?: number;
  alreadyReviewed?: boolean;
  existingRating?: number;
  existingBody?: string;
}

interface EmailReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: ReviewOrderItem[];
  initialProductId?: string | null;
  onAuthRequired?: () => void;
}

export default function EmailReviewModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  customerEmail,
  customerName,
  items: initialItems,
  initialProductId,
  onAuthRequired,
}: EmailReviewModalProps) {
  const [items, setItems] = useState<ReviewOrderItem[]>(initialItems);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  // Review form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewBody, setReviewBody] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success & thank you popup states
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(4);

  // Authentication states
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync items when initialItems changes
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Check current session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setCurrentUserEmail(data.user.email.toLowerCase().trim());
      } else {
        setCurrentUserEmail(null);
      }
    });
  }, [isOpen]);

  // Select initial product
  useEffect(() => {
    if (!isOpen) return;

    if (
      initialProductId &&
      items.some((item) => item.productId === initialProductId)
    ) {
      setSelectedProductId(initialProductId);
    } else {
      const firstUnreviewed = items.find((item) => !item.alreadyReviewed);
      if (firstUnreviewed) {
        setSelectedProductId(firstUnreviewed.productId);
      } else if (items[0]) {
        setSelectedProductId(items[0].productId);
      }
    }
    setRating(5);
    setHoverRating(0);
    setReviewBody("");
    setErrorMessage(null);
    setIsSubmitted(false);
    setAuthError(null);
  }, [isOpen, initialProductId, items]);

  const activeItem = useMemo(() => {
    return items.find((item) => item.productId === selectedProductId) || items[0];
  }, [items, selectedProductId]);

  const unreviewedItems = useMemo(() => {
    return items.filter((item) => !item.alreadyReviewed);
  }, [items]);

  const allReviewed = items.length > 0 && items.every((item) => item.alreadyReviewed);

  // Handle countdown & redirect to home page after submission or when all reviewed
  useEffect(() => {
    if (!isOpen || (!isSubmitted && !allReviewed)) return;

    setCountdown(4);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    const timer = setTimeout(() => {
      window.location.assign("/");
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen, isSubmitted, allReviewed]);

  // When switching product
  function handleSelectProduct(productId: string) {
    setSelectedProductId(productId);
    setRating(5);
    setHoverRating(0);
    setReviewBody("");
    setErrorMessage(null);
    setIsSubmitted(false);
    setAuthError(null);
  }

  // Handle Review Submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeItem) return;

    setErrorMessage(null);
    setAuthError(null);

    if (!reviewBody.trim()) {
      setErrorMessage("Please enter your review message.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      // 1. Verify user is logged in, or authenticate with password if provided
      let {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!authPassword.trim()) {
          setSubmitting(false);
          setErrorMessage(
            "Account authentication required. Please enter your password to submit your review."
          );
          return;
        }

        // Authenticate with customer email and password
        const { data: authData, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: customerEmail.trim().toLowerCase(),
            password: authPassword.trim(),
          });

        if (signInErr || !authData.user) {
          setSubmitting(false);
          setAuthError(
            signInErr?.message || "Incorrect password. Please try again."
          );
          return;
        }

        user = authData.user;
        setCurrentUserEmail(user.email?.toLowerCase().trim() || null);
      }

      // 2. Submit the review to /api/reviews
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: activeItem.productId,
          order_id: orderId,
          rating,
          body: reviewBody.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review. Please try again.");
      }

      // 3. Mark current product as reviewed
      const updated = items.map((it) =>
        it.productId === activeItem.productId
          ? {
              ...it,
              alreadyReviewed: true,
              existingRating: rating,
              existingBody: reviewBody.trim(),
            }
          : it
      );
      setItems(updated);

      // 4. Trigger thank-you state and auto redirect to home
      setReviewBody("");
      setIsSubmitted(true);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An error occurred while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const isLoggedInUser =
    currentUserEmail !== null &&
    (currentUserEmail === customerEmail.toLowerCase().trim() ||
      currentUserEmail.length > 0);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1D211F]/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[440px] rounded-xl bg-white shadow-sm my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Compact padding & fonts */}
        <div className="bg-[#183D2B] px-4 py-3 sm:px-5 sm:py-3.5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-[15px] font-serif font-bold mt-0.5 tracking-tight text-white">
              Rate & Review Your Purchase
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[82vh] overflow-y-auto">
          {/* Submission or All Products Reviewed State (Clean: NO inside box, NO border) */}
          {allReviewed || isSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Check size={22} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-[#183D2B]">
                  {allReviewed
                    ? "All Products Reviewed!"
                    : "Thank You for Submitting Your Review!"}
                </h3>
                <p className="text-xs text-[#5C6460] mt-1 leading-relaxed max-w-xs mx-auto">
                  {allReviewed
                    ? `Thank you for reviewing all items from Order #${orderNumber}.`
                    : `Your review for ${activeItem?.name || "your purchase"} has been submitted.`}
                </p>
              </div>

              <div className="text-[11px] text-[#78827D] font-medium pt-1">
                Redirecting to home page in {countdown}s...
              </div>

              {isSubmitted && unreviewedItems.length > 0 && (
                <div className="pt-2 text-center">
                  <p className="text-[10.5px] text-[#5C6460] mb-1">
                    Have another item from this order?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      const nextRemaining = unreviewedItems[0];
                      if (nextRemaining) handleSelectProduct(nextRemaining.productId);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#183D2B] hover:underline cursor-pointer"
                  >
                    <span>Review next product</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.location.assign("/")}
                  className="py-2.5 px-6 rounded-md bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer shadow-xs"
                >
                  Go to Home Page
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Multiple Products Selector (if order contains multiple products) */}
              {items.length > 1 && (
                <div className="mb-4 pb-3.5 border-b border-[#EDE9DF]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6460]">
                      Order Items ({items.filter((i) => i.alreadyReviewed).length}/{items.length} reviewed)
                    </span>
                    <span className="text-[10px] text-[#183D2B] font-semibold">
                      Switch item
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((it) => {
                      const isSelected = it.productId === activeItem?.productId;
                      return (
                        <button
                          key={it.productId}
                          type="button"
                          onClick={() => handleSelectProduct(it.productId)}
                          className={`flex items-center gap-2 p-1.5 rounded-md border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#183D2B] bg-[#F7F5EF] ring-1 ring-[#183D2B]/30"
                              : "border-[#EDE9DF] hover:border-[#183D2B]/40 bg-white"
                          }`}
                        >
                          <div className="w-7 h-7 rounded bg-[#FAF8F5] border border-[#EDE9DF] shrink-0 overflow-hidden flex items-center justify-center">
                            {it.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={it.image}
                                alt={it.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package size={12} className="text-[#8C938F]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-[#1D211F] truncate leading-tight">
                              {it.name}
                            </p>
                            {it.alreadyReviewed ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700">
                                <Check size={10} />
                                Reviewed
                              </span>
                            ) : (
                              <span className="text-[9px] text-amber-700 font-medium">
                                Pending
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

          {/* Active Product Preview - Reduced box size */}
          {activeItem && !allReviewed && (
            <div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EDE9DF] mb-3.5">
                <div className="w-10 h-10 rounded-md bg-white border border-[#EDE9DF] overflow-hidden shrink-0 flex items-center justify-center">
                  {activeItem.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeItem.image}
                      alt={activeItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={18} className="text-[#8C938F]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#183D2B] uppercase tracking-wider">
                    <ShieldCheck size={11} />
                    Verified Delivered Item
                  </span>
                  <p className="text-xs font-bold text-[#1D211F] truncate leading-tight mt-0.5">
                    {activeItem.name}
                  </p>
                  <p className="text-[10px] text-[#5C6460]">
                    Recipient: {customerName || customerEmail}
                  </p>
                </div>
              </div>

              {/* Feedback error messages */}
              {errorMessage && (
                <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-2.5 text-[11px] text-red-700">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* If active product already reviewed */}
              {activeItem.alreadyReviewed ? (
                <div className="p-3.5 rounded-lg bg-[#F7F5EF] border border-[#EDE9DF] text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={15}
                        className={
                          s <= (activeItem.existingRating || 5)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                  <p className="text-[11px] font-bold text-[#183D2B]">
                    You have already submitted a review for this product.
                  </p>
                  {activeItem.existingBody && (
                    <p className="text-[10.5px] text-[#5C6460] italic max-w-sm mx-auto">
                      &ldquo;{activeItem.existingBody}&rdquo;
                    </p>
                  )}

                  {(() => {
                    const firstRemaining = unreviewedItems[0];
                    if (!firstRemaining) return null;
                    return (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(firstRemaining.productId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#183D2B] text-white text-[10.5px] font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer"
                        >
                          <span>Review {firstRemaining.name}</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Review form - Compact inputs & reduced fonts */
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Rating selection - Smaller stars */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1D211F] mb-1.5">
                      Your Rating *
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isFilled =
                            hoverRating > 0 ? star <= hoverRating : star <= rating;
                          return (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRating(star)}
                              className="p-0.5 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                            >
                              <Star
                                size={22}
                                className={
                                  isFilled
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300 hover:text-amber-200"
                                }
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-[#183D2B] ml-1.5">
                        {rating === 5 && "5 - Exceptional"}
                        {rating === 4 && "4 - Very Good"}
                        {rating === 3 && "3 - Average"}
                        {rating === 2 && "2 - Below Expectation"}
                        {rating === 1 && "1 - Poor"}
                      </span>
                    </div>
                  </div>

                  {/* Review Message - Compact textarea */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1D211F] mb-1">
                      Review Message *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Share your authentic experience with this product regarding texture, fragrance, results, and overall satisfaction..."
                      className="w-full rounded-md border border-[#EDE9DF] bg-[#FAF8F5] p-2.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B] focus:bg-white transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Authentication requirement indicator if not logged in */}
                  {!isLoggedInUser && (
                    <div className="p-2.5 rounded-md bg-amber-50 border border-amber-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-semibold">
                        <Lock size={12} className="shrink-0" />
                        <span>Account Verification Required</span>
                      </div>
                      <p className="text-[10px] text-amber-800 leading-relaxed">
                        Enter password for registered account <strong>{customerEmail}</strong>:
                      </p>
                      <div>
                        <input
                          type="password"
                          required
                          value={authPassword}
                          onChange={(e) => {
                            setAuthPassword(e.target.value);
                            setAuthError(null);
                          }}
                          placeholder="Account password"
                          className="w-full rounded border border-amber-300 bg-white px-2.5 py-1.5 text-xs text-[#1D211F] outline-none focus:border-[#183D2B]"
                        />
                        {authError && (
                          <p className="text-[10px] text-red-600 mt-0.5 font-medium">
                            {authError}
                          </p>
                        )}
                      </div>
                      {onAuthRequired && (
                        <div className="pt-0.5 text-right">
                          <button
                            type="button"
                            onClick={onAuthRequired}
                            className="text-[10px] font-semibold text-[#183D2B] underline cursor-pointer"
                          >
                            Sign in with another account
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit buttons - Compact styling */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#EDE9DF]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-1.5 px-3.5 rounded-md border border-[#EDE9DF] text-[11px] font-semibold text-[#5C6460] hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="py-2 px-5 rounded-md bg-[#183D2B] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  </div>
</div>
  );
}
