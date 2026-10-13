"use client";

import React, { useState } from "react";
import { X, AlertTriangle, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  total: number;
  isPaidOnline?: boolean;
  guestEmail?: string;
  onSuccess: (result: { message: string; refundIssued: boolean }) => void;
}

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Need to change delivery address or phone",
  "Delivery timeframe is longer than expected",
  "Changed my mind",
  "Found an alternative product",
  "Other reason",
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  total,
  isPaidOnline = false,
  guestEmail,
  onSuccess,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState(CANCELLATION_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConfirmCancel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details,
          email: guestEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order.");
      }

      onSuccess({
        message: data.message,
        refundIssued: data.refundIssued,
      });
      onClose();
    } catch (err: unknown) {
      console.error("[CancelOrderModal error]:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while cancelling your order. Please try again or contact our WhatsApp Concierge."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[#FAF8F5] border border-[#DCCFB9] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ colorScheme: "only light", backgroundColor: "#FAF8F5", color: "#1D211F" }}
      >
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-[#DCCFB9]/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1D211F]">
                Cancel Order
              </h3>
              <p className="text-xs text-[#8E9590] font-mono">
                Order #{orderNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[#8E9590] hover:text-[#1D211F] p-1.5 rounded-md hover:bg-neutral-100 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirmCancel} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Refund Notice Box */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
              isPaidOnline
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
                : "bg-neutral-50 border-neutral-200 text-[#5C6460]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[#183D2B]">
              <ShieldCheck size={15} />
              <span>
                {isPaidOnline
                  ? "Instant Automated Stripe Refund"
                  : "Cash on Delivery Notice"}
              </span>
            </div>
            {isPaidOnline ? (
              <p>
                Your total payment of{" "}
                <strong className="text-[#183D2B]">
                  AED {Number(total).toFixed(2)}
                </strong>{" "}
                will be automatically refunded to your original payment card via Stripe. Funds typically reflect in your bank account within 5 to 7 UAE banking days.
              </p>
            ) : (
              <p>
                No payment was collected for this Cash on Delivery order. Your order will be stopped immediately with zero charges.
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              className="w-full h-11 px-3.5 bg-white border border-[#DCCFB9] rounded-lg text-xs font-medium text-[#1D211F] outline-none focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B] transition-colors"
            >
              {CANCELLATION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Additional details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider">
              Additional Details <span className="text-[#8E9590] font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us if there is anything we can do better..."
              disabled={loading}
              className="w-full p-3 bg-white border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] placeholder:text-[#8E9590] outline-none focus:border-[#183D2B] focus:ring-1 focus:ring-[#183D2B] transition-colors resize-none"
            />
          </div>

          <p className="text-[11px] text-[#8E9590] italic">
            Note: Once confirmed, cancellation cannot be undone. If you need any assistance, our WhatsApp Concierge is always here to assist.
          </p>

          {/* Footer Actions */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 border-t border-[#DCCFB9]/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white border border-[#DCCFB9] text-xs font-bold text-[#1D211F] uppercase tracking-wider rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Keep My Order
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Processing Refund...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} />
                  <span>{isPaidOnline ? "Cancel & Refund Now" : "Confirm Cancellation"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
