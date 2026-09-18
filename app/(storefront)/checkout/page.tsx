"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from "lucide-react";

const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

export default function CheckoutPage() {
  const { items, subtotal, vatAmount, shippingFee, total, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "Amira Al-Hashemi",
    email: "amira.hashemi@gmail.com",
    phone: "+971 50 123 4567",
    emirate: "Dubai",
    area: "Downtown Dubai",
    streetAddress: "Burj Crown Tower, Apt 1402",
    deliveryNotes: "Please leave with building concierge if not available.",
    paymentMethod: "card", // card | cod | apple_pay
    deliverySpeed: "standard", // standard | express
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);

  const expressFee = formData.deliverySpeed === "express" ? 15 : 0;
  const finalTotal = total + expressFee;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate UAE payment and order placement
    setTimeout(() => {
      const generatedOrderNum = `AUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderComplete(generatedOrderNum);
      clearCart();
      setIsSubmitting(false);
    }, 1500);
  }

  if (orderComplete) {
    return (
      <div className="bg-[#FAF8F5] min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#DCCFB9]/60 p-8 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 size={36} />
          </div>

          <span className="inline-block px-3 py-1 bg-[#183D2B]/10 text-[#183D2B] text-xs font-bold uppercase tracking-widest rounded-full">
            Order Confirmed
          </span>

          <h1 className="text-2xl font-serif font-bold text-[#1D211F]">
            Thank You, {formData.fullName.split(" ")[0]}!
          </h1>

          <p className="text-xs text-[#5C6460] leading-relaxed">
            Your elevated essentials order has been placed successfully. A confirmation message and tracking link have been dispatched to <strong>{formData.email}</strong>.
          </p>

          <div className="p-4 bg-[#F7F5EF] rounded-2xl border border-[#DCCFB9]/50 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Order Number:</span>
              <span className="font-mono font-bold text-[#183D2B]">{orderComplete}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Delivery Address:</span>
              <span className="font-semibold text-[#1D211F]">{formData.emirate}, UAE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C6460]">Payment Method:</span>
              <span className="font-semibold text-[#1D211F] uppercase">{formData.paymentMethod}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/"
              className="w-full py-3 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] transition-colors block"
            >
              Return to Storefront
            </Link>
            <Link
              href="/shop"
              className="text-xs text-[#5C6460] hover:underline"
            >
              Continue Browsing Collections
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex items-center justify-between border-b border-[#DCCFB9]/40 pb-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-[#183D2B]" />
            <h1 className="text-2xl font-serif font-bold text-[#1D211F]">
              UAE Secure Checkout
            </h1>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#5C6460] hover:text-[#183D2B]"
          >
            <ArrowLeft size={14} />
            <span>Return to Bag</span>
          </Link>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left 2 Cols: Shipping & Payment ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Customer Details */}
            <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                1. Customer & Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Phone Number (UAE Mobile) *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+971 50 000 0000"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. UAE Delivery Address */}
            <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                2. UAE Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Emirate *
                  </label>
                  <select
                    name="emirate"
                    value={formData.emirate}
                    onChange={handleChange}
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs font-bold text-[#1D211F] outline-none cursor-pointer"
                  >
                    {UAE_EMIRATES.map((em) => (
                      <option key={em} value={em}>
                        {em}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Area / District *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Downtown / Marina / Jumeirah"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1D211F] uppercase tracking-wider mb-1.5">
                    Street Address / Villa / Apartment Number *
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    required
                    placeholder="Building name, street, apartment number"
                    className="w-full h-10 px-3.5 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-sm text-[#1D211F] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delivery Method */}
            <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                3. Delivery Speed
              </h2>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#DCCFB9] bg-[#F7F5EF]/60 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    value="standard"
                    checked={formData.deliverySpeed === "standard"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#183D2B]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1D211F]">Standard UAE Delivery (24-48 Hours)</p>
                    <p className="text-[11px] text-[#5C6460]">Fast courier dispatch across all 7 Emirates</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                  {shippingFee === 0 ? "FREE" : "AED 20"}
                </span>
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#DCCFB9] bg-[#F7F5EF]/60 cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="deliverySpeed"
                    value="express"
                    checked={formData.deliverySpeed === "express"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#183D2B]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1D211F]">Same-Day Dubai Express Delivery</p>
                    <p className="text-[11px] text-[#5C6460]">Delivered today within 4 hours (Dubai orders only)</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#183D2B]">+AED 15</span>
              </label>
            </div>

            {/* 4. Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-[#1D211F] uppercase tracking-wider border-b border-[#DCCFB9]/30 pb-2">
                4. Payment Method
              </h2>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#DCCFB9] bg-[#F7F5EF]/60 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#183D2B]"
                />
                <CreditCard size={18} className="text-[#183D2B]" />
                <div>
                  <p className="text-xs font-bold text-[#1D211F]">Credit / Debit Card (Stripe)</p>
                  <p className="text-[11px] text-[#5C6460]">Visa, Mastercard, American Express accepted</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-[#DCCFB9] bg-[#F7F5EF]/60 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#183D2B]"
                />
                <Banknote size={18} className="text-[#183D2B]" />
                <div>
                  <p className="text-xs font-bold text-[#1D211F]">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-[#5C6460]">Pay cash upon courier arrival at your UAE doorstep</p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Right 1 Col: Summary ────────────────────────────────────── */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
              <h2 className="text-base font-serif font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-3">
                Order Review ({items.length} items)
              </h2>

              {/* Mini Item List */}
              <div className="divide-y divide-[#DCCFB9]/30 max-h-56 overflow-y-auto space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[170px]">
                      <p className="font-semibold text-[#1D211F] truncate">{item.product.name}</p>
                      <span className="text-[#8E9590]">Qty: {item.quantity}</span>
                    </div>
                    <span className="font-bold text-[#183D2B]">
                      AED {(item.product.retail_price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#DCCFB9]/40 space-y-2 text-xs">
                <div className="flex justify-between text-[#5C6460]">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#1D211F]">AED {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#5C6460]">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? "FREE" : `AED ${shippingFee.toFixed(2)}`}</span>
                </div>
                {expressFee > 0 && (
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Same-Day Express</span>
                    <span>AED {expressFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#5C6460]">
                  <span>5% UAE VAT (Included)</span>
                  <span>AED {vatAmount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-[#DCCFB9]/40 flex justify-between items-baseline text-base font-bold">
                  <span className="text-[#1D211F]">Total (AED)</span>
                  <span className="text-xl font-extrabold text-[#183D2B]">
                    AED {finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-full bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing UAE Order...</span>
                ) : (
                  <span>Place Order • AED {finalTotal.toFixed(2)}</span>
                )}
              </button>

              <p className="text-[10px] text-center text-[#8E9590] leading-tight">
                By placing your order, you agree to Aurelle Cosmetics Trading FZ-LLC terms of sale and privacy policy.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
