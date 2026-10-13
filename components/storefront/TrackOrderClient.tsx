"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  X,
} from "lucide-react";
import CancelOrderModal from "./CancelOrderModal";

interface OrderItem {
  id: string;
  name: string;
  image?: string | null;
  slug?: string;
  sku?: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethodLabel: string;
  isPaidOnline?: boolean;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    email?: string;
    emirate?: string;
    area?: string;
    streetAddress?: string;
    country?: string;
    payment_method?: string;
  };
  trackingUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", desc: "Received & logged" },
  { key: "processing", label: "Confirmed & Packing", desc: "Being prepared" },
  { key: "shipped", label: "Dispatched", desc: "With UAE courier" },
  { key: "delivered", label: "Delivered", desc: "Completed" },
];

function getStatusIndex(status: string): number {
  const s = (status || "").toLowerCase();
  if (s === "delivered" || s === "completed") return 3;
  if (s === "shipped" || s === "out_for_delivery" || s === "in_transit") return 2;
  if (s === "processing" || s === "confirmed" || s === "packed") return 1;
  return 0; // pending / placed
}

export default function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams?.get("orderNumber") || "");
  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationAlert, setCancellationAlert] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-search if parameters are in the URL (e.g. from confirmation email)
  useEffect(() => {
    const qOrder = searchParams?.get("orderNumber");
    const qEmail = searchParams?.get("email");
    if (qOrder && qEmail) {
      setOrderNumber(qOrder);
      setEmail(qEmail);
      performSearch(qOrder, qEmail);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  async function performSearch(oNum: string, em: string) {
    if (!oNum.trim() || !em.trim()) {
      setError("Please enter both your Order Number and Email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/track-order?orderNumber=${encodeURIComponent(oNum.trim())}&email=${encodeURIComponent(
          em.trim()
        )}`
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Order not found. Please check your order number and email.");
        setOrder(null);
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Network error while looking up order. Please try again.");
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(orderNumber, email);
  }

  const currentStep = order ? getStatusIndex(order.status) : 0;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-6 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8E9590]">
          <Link href="/" className="hover:text-[#183D2B] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-[#1D211F] font-semibold">Track Order</span>
        </nav>

        {/* Page Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Truck size={13} />
            <span>UAE Courier Tracking</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#1D211F] font-medium tracking-tight">
            Track Your Order
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed">
            Enter your order number and email to check your live dispatch status, delivery updates, and shipment details.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#DCCFB9]/70 shadow-sm">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Order Number *
                </label>
                <div className="relative">
                  <Package size={15} className="absolute left-3.5 top-3 text-[#8E9590]" />
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    placeholder="e.g. AUR-2026-1042"
                    className="w-full h-11 pl-10 pr-3.5 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs font-semibold text-[#1D211F] outline-none focus:bg-white focus:border-[#183D2B] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="The email entered at checkout"
                  className="w-full h-11 px-3.5 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg text-xs text-[#1D211F] outline-none focus:bg-white focus:border-[#183D2B] transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle size={15} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-8 h-11 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Looking up Order...</span>
                </>
              ) : (
                <>
                  <Search size={14} />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Order Details Result */}
        {order && (
          <div className="space-y-6">
            {cancellationAlert && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                  cancellationAlert.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-medium">{cancellationAlert.message}</span>
              </div>
            )}

            {/* Order Overview Header Card */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#DCCFB9]/70 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCCFB9]/40 pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#1D211F] tracking-tight font-serif">
                      Order {order.orderNumber}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isCancelled
                          ? "bg-red-100 text-red-700"
                          : order.status === "delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E9590] mt-1">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs px-3 py-1 bg-[#FAF8F5] border border-[#DCCFB9] text-[#1D211F] rounded-md font-semibold flex items-center gap-1.5">
                    <CreditCard size={13} className="text-[#183D2B]" />
                    <span>{order.paymentMethodLabel}</span>
                  </span>

                  {!isCancelled && order.status !== "shipped" && order.status !== "delivered" && (
                    <button
                      type="button"
                      onClick={() => setCancelModalOpen(true)}
                      className="text-xs px-3 py-1 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200/80 rounded-md font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <X size={13} />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Progress Stepper */}
              {!isCancelled ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 relative pt-2">
                    {/* Connecting Bar */}
                    <div className="absolute top-5 left-8 right-8 h-1 bg-neutral-200 -z-0">
                      <div
                        className="h-full bg-[#183D2B] transition-all duration-500"
                        style={{
                          width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    {STATUS_STEPS.map((step, idx) => {
                      const isDone = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isDone
                                ? "bg-[#183D2B] text-white ring-4 ring-[#183D2B]/10"
                                : "bg-neutral-100 text-neutral-400 border border-neutral-300"
                            } ${isCurrent ? "scale-110 shadow-sm" : ""}`}
                          >
                            {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>
                          <span
                            className={`text-xs font-bold mt-2 tracking-tight ${
                              isDone ? "text-[#183D2B]" : "text-[#8E9590]"
                            }`}
                          >
                            {step.label}
                          </span>
                          <span className="text-[10px] text-[#8E9590] hidden sm:block">
                            {step.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Delivery Estimate Box */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                      <Clock size={15} className="text-[#183D2B] shrink-0" />
                      <span>
                        UAE Normal Delivery: Orders typically dispatch and arrive within 1 to 3 working days across Dubai, Sharjah, Ajman & all Emirates.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                  <p className="font-bold">This order has been cancelled.</p>
                  <p className="text-red-700">
                    If you have questions or require a refund update, please contact our concierge team.
                  </p>
                </div>
              )}

              {/* Carrier / Tracking Link if available */}
              {order.trackingUrl && (
                <div className="p-4 bg-[#FAF8F5] border border-[#DCCFB9] rounded-lg flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#1D211F] block">Courier Tracking Available</span>
                    <p className="text-[11px] text-[#5C6460]">
                      Your parcel has been assigned to a courier with a live tracking number.
                    </p>
                  </div>
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-[#102D20] transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Track with Courier</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Items & Shipping Address Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ordered Items (Col 2) */}
              <div className="md:col-span-2 bg-white p-6 rounded-xl border border-[#DCCFB9]/70 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2">
                  Items in this Order ({order.items.length})
                </h3>

                <div className="divide-y divide-neutral-100">
                  {order.items.map((it) => (
                    <div key={it.id} className="py-3.5 flex items-center gap-3.5">
                      <div className="w-16 h-16 bg-[#FAF8F5] rounded-md border border-[#DCCFB9]/50 overflow-hidden shrink-0 flex items-center justify-center">
                        {it.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package size={20} className="text-[#8E9590]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {it.slug ? (
                          <Link
                            href={`/products/${it.slug}`}
                            className="text-xs font-bold text-[#1D211F] hover:text-[#183D2B] transition-colors truncate block"
                          >
                            {it.name}
                          </Link>
                        ) : (
                          <p className="text-xs font-bold text-[#1D211F] truncate">{it.name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8E9590]">
                          <span>Qty: {it.quantity}</span>
                          {it.sku && <span>SKU: {it.sku}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#1D211F]">
                          AED {it.lineTotal.toFixed(2)}
                        </span>
                        {it.quantity > 1 && (
                          <span className="text-[10px] text-[#8E9590] block">
                            (AED {it.price.toFixed(2)} ea)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="pt-3 border-t border-[#DCCFB9]/40 space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Subtotal</span>
                    <span>AED {order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-[#5C6460]">
                      <span>Tax (5% UAE VAT)</span>
                      <span>AED {order.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Shipping</span>
                    <span>{order.shippingAmount === 0 ? "Free Shipping" : `AED ${order.shippingAmount.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#1D211F] pt-2 border-t border-neutral-100 text-sm">
                    <span>Total Amount</span>
                    <span className="text-[#183D2B]">AED {order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address & Support (Col 1) */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-[#DCCFB9]/70 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D211F] border-b border-[#DCCFB9]/30 pb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#183D2B]" />
                    <span>Delivery Address</span>
                  </h3>
                  <div className="text-xs text-[#5C6460] space-y-1 leading-relaxed">
                    <p className="font-bold text-[#1D211F]">
                      {order.shippingAddress.fullName || "Recipient"}
                    </p>
                    {order.shippingAddress.streetAddress && (
                      <p>{order.shippingAddress.streetAddress}</p>
                    )}
                    {order.shippingAddress.area && (
                      <p>{order.shippingAddress.area}</p>
                    )}
                    <p>
                      {[order.shippingAddress.emirate, order.shippingAddress.country || "UAE"]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {order.shippingAddress.phone && (
                      <p className="pt-1 text-[#1D211F] font-medium">{order.shippingAddress.phone}</p>
                    )}
                  </div>
                </div>

                {/* Need Help WhatsApp Concierge */}
                <div className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#183D2B] text-white flex items-center justify-center shrink-0">
                      <MessageCircle size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#183D2B] uppercase tracking-wide">
                        Need Help With This Order?
                      </h4>
                      <p className="text-[11px] text-[#5C6460]">Live Concierge on WhatsApp</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#5C6460] leading-relaxed">
                    Have questions about dispatch time, delivery address adjustments, or payment? Our support team is ready to assist.
                  </p>
                  <a
                    href={`https://wa.me/971562096388?text=${encodeURIComponent(
                      `Hello Aurelle, I need assistance regarding my Order #${order.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={13} />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Order Modal */}
        {order && cancelModalOpen && (
          <CancelOrderModal
            isOpen={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            orderId={order.id}
            orderNumber={order.orderNumber}
            total={order.total}
            isPaidOnline={order.isPaidOnline}
            guestEmail={email || order.shippingAddress?.email}
            onSuccess={(result) => {
              setCancellationAlert({ message: result.message, type: "success" });
              performSearch(order.orderNumber, email || order.shippingAddress?.email || "");
            }}
          />
        )}
      </div>
    </div>
  );
}
