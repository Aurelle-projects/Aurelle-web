"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

interface VerifiedOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  paymentStatus: string;
  status: string;
  shippingAddress?: {
    fullName?: string;
    streetAddress?: string;
    area?: string;
    emirate?: string;
    city?: string;
  };
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    clearCart();

    if (!sessionId) {
      setErrorMessage("No payment session reference provided.");
      setLoading(false);
      return;
    }

    async function verifyPayment() {
      try {
        const query = new URLSearchParams({ session_id: sessionId! });
        if (orderId) query.set("order_id", orderId);

        const res = await fetch(`/api/orders/verify-session?${query.toString()}`);
        const data = await res.json();

        if (res.ok && data.verified && data.order) {
          setVerifiedOrder(data.order);
        } else {
          setErrorMessage(
            data.message || data.error || "Payment verification could not be confirmed in the database."
          );
        }
      } catch (err) {
        console.error("Verification error:", err);
        setErrorMessage("Network error while verifying payment status with server.");
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId]);

  // ── LOADING STATE ──────────────────────────────────────────
  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-md border border-[#EDE9DF] p-5 text-center space-y-3.5 shadow-xl">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-[#183D2B]/10 text-[#183D2B] text-[10px] font-bold uppercase tracking-widest rounded-md">
                Verifying Payment
              </span>
            </div>
            <p className="text-[11px] text-[#5C6460] leading-relaxed">
              Confirming your transaction with Stripe and updating order records…
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── ERROR / UNVERIFIED STATE ───────────────────────────────
  if (errorMessage || !verifiedOrder) {
    return (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-md border border-[#EDE9DF] p-5 text-center space-y-3.5 shadow-xl">
            {/* Icon + Badge */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <AlertTriangle size={28} />
              </div>
              <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                Verification Incomplete
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-serif font-bold text-[#1D211F]">
                Payment Not Confirmed
              </h1>
              <p className="text-[11px] text-[#5C6460] leading-relaxed">
                {errorMessage || "We could not verify a completed payment for this order."}
              </p>
            </div>

            <div className="p-3 bg-[#F7F5EF] rounded-md border border-[#EDE9DF] text-[11px] text-[#5C6460] text-left">
              If funds were debited, your order will be updated automatically upon bank confirmation.
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                className="w-full py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-md hover:bg-[#102D20] transition-colors block text-center"
              >
                Return to Checkout
              </Link>
              <Link
                href="/shop"
                className="w-full py-2.5 border border-[#EDE9DF] text-[#1D211F] text-xs font-bold rounded-md hover:bg-[#F7F5EF] transition-colors block text-center"
              >
                Continue Browsing
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── SUCCESS STATE ──────────────────────────────────────────
  const addr = verifiedOrder.shippingAddress || {};

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-md border border-[#EDE9DF] p-5 text-center space-y-3.5 shadow-xl">
          {/* Icon + Badge row */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-[#183D2B]/10 text-[#183D2B] flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <span className="inline-block px-2.5 py-0.5 bg-[#183D2B]/10 text-[#183D2B] text-[10px] font-bold uppercase tracking-widest rounded-md">
              Order Confirmed
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-serif font-bold text-[#1D211F]">
              Thank You for Your Order!
            </h1>
            <p className="text-[11px] text-[#5C6460] leading-relaxed">
              Payment confirmed via Stripe. Confirmation dispatched to{" "}
              <strong>{verifiedOrder.customerEmail}</strong>.
            </p>
          </div>

          <div className="p-3 bg-[#F7F5EF] rounded-md border border-[#EDE9DF] text-left text-[11px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Order Reference:</span>
              <span className="font-mono font-bold text-[#183D2B]">{verifiedOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Delivery:</span>
              <span className="font-semibold text-[#1D211F] text-right max-w-[55%] truncate">
                {addr.area ? `${addr.area}, ` : ""}{addr.emirate || addr.city || "UAE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Payment:</span>
              <span className="font-semibold text-[#1D211F] flex items-center gap-1">
                <ShieldCheck size={11} className="text-emerald-600" />
                Verified (Stripe)
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-[#EDE9DF]">
              <span className="text-[#5C6460] font-medium">Total:</span>
              <span className="font-bold text-[#183D2B]">AED {Number(verifiedOrder.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/account?tab=orders"
              className="w-full py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-md hover:bg-[#102D20] transition-colors block text-center"
            >
              View Order in Account
            </Link>
            <Link
              href="/shop"
              className="w-full py-2.5 border border-[#EDE9DF] text-[#1D211F] text-xs font-bold rounded-md hover:bg-[#F7F5EF] transition-colors block text-center"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
