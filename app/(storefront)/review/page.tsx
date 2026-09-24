"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Star, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import AccountAuthModal from "@/components/auth/AccountAuthModal";
import EmailReviewModal, {
  ReviewOrderItem,
} from "@/components/reviews/EmailReviewModal";

interface OrderVerificationData {
  valid: boolean;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  hasAccount: boolean;
  targetProductId: string | null;
  items: ReviewOrderItem[];
}

function ReviewPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const productId = searchParams.get("productId");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderVerificationData | null>(null);

  // Modal states
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    if (!orderId || !token) {
      setError(
        "Invalid review link. Product reviews can only be accessed using the verified link sent to your email upon delivery."
      );
      setLoading(false);
      return;
    }

    async function verifyLink() {
      try {
        setLoading(true);
        setError(null);

        const query = new URLSearchParams({
          orderId: orderId!,
          token: token!,
          ...(productId ? { productId } : {}),
        });

        const res = await fetch(`/api/reviews/verify-order?${query.toString()}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setError(
            data.error ||
              "This review invitation is invalid or has expired. Reviews are available once your order status is marked as Delivered."
          );
          return;
        }

        setOrderData(data);

        // Required logic:
        // When the user clicks a review link, check whether they have a registered account:
        // - If the user does not have an account, show the Sign Up popup.
        // - If the user already has an account, show the Review popup.
        if (!data.hasAccount) {
          setShowSignUpModal(true);
          setShowReviewModal(false);
        } else {
          setShowSignUpModal(false);
          setShowReviewModal(true);
        }
      } catch {
        setError("Network error verifying your review invitation. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyLink();
  }, [orderId, productId, token]);

  // When signup completes successfully:
  function handleSignUpSuccess() {
    setShowSignUpModal(false);
    setShowReviewModal(true);
    if (orderData) {
      setOrderData({ ...orderData, hasAccount: true });
    }
  }

  // When login completes successfully:
  function handleLoginSuccess() {
    setShowLoginModal(false);
    setShowReviewModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="font-serif text-lg font-bold text-[#1D211F]">
            Verifying Your Review Invitation...
          </h2>
          <p className="text-xs text-[#5C6460]">
            Confirming your delivered order details.
          </p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#EDE9DF] shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <h1 className="font-serif text-xl font-bold text-[#1D211F]">
            Review Invitation Unavailable
          </h1>
          <p className="text-xs text-[#5C6460] leading-relaxed">
            {error ||
              "The review link you followed is invalid or has expired. Review popups are only accessible via the delivered order email."}
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors"
            >
              <ShoppingBag size={14} />
              <span>Explore Collection</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#FAF8F5] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#183D2B] bg-[#183D2B]/10 px-3 py-1 rounded-full">
          Delivered Order Review
        </span>
        <h1 className="font-serif text-3xl font-bold text-[#1D211F]">
          Order #{orderData.orderNumber}
        </h1>
        <p className="text-sm text-[#5C6460] max-w-lg mx-auto leading-relaxed">
          Thank you for choosing Aurelle. Share your authentic experience to help other beauty enthusiasts discover the ideal ritual.
        </p>

        {/* Action card if popup is closed */}
        {!showReviewModal && !showSignUpModal && (
          <div className="bg-white p-6 rounded-2xl border border-[#EDE9DF] shadow-sm space-y-4">
            <p className="text-xs text-[#1D211F] font-semibold">
              Delivered Products ({orderData.items.length}):
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {orderData.items.map((it) => (
                <button
                  key={it.productId}
                  type="button"
                  onClick={() => setShowReviewModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F7F5EF] border border-[#EDE9DF] hover:border-[#183D2B] text-xs font-bold text-[#183D2B] transition-colors cursor-pointer"
                >
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span>Review {it.name}</span>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#102D20] transition-colors cursor-pointer"
              >
                <span>Open Review Popup</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sign Up Popup (Triggered when user does not have an account) ── */}
      <AccountAuthModal
        open={showSignUpModal}
        onClose={() => setShowSignUpModal(false)}
        initialMode="signup"
        defaultEmail={orderData.customerEmail}
        defaultFullName={orderData.customerName || ""}
        onSuccess={handleSignUpSuccess}
      />

      {/* ── Optional Login Modal (if user wants to log in with another account) ── */}
      <AccountAuthModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialMode="login"
        defaultEmail={orderData.customerEmail}
        onSuccess={handleLoginSuccess}
      />

      {/* ── Review Popup (Triggered when user already has an account or just signed up) ── */}
      <EmailReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orderId={orderData.orderId}
        orderNumber={orderData.orderNumber}
        customerEmail={orderData.customerEmail}
        customerName={orderData.customerName}
        items={orderData.items}
        initialProductId={orderData.targetProductId}
        onAuthRequired={() => {
          setShowReviewModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-[#FAF8F5] flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReviewPageContent />
    </Suspense>
  );
}
