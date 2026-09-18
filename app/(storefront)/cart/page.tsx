"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    vatAmount,
    shippingFee,
    total,
    freeShippingThreshold,
    amountUntilFreeShipping,
    updateQuantity,
    removeItem,
  } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; success: boolean } | null>(null);

  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );

  function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    if (couponCode.toUpperCase() === "AURELLE10") {
      const disc = Math.round(subtotal * 0.1);
      setDiscount(disc);
      setCouponMessage({ text: "10% Welcome Discount applied!", success: true });
    } else {
      setCouponMessage({ text: "Invalid promo code. Try AURELLE10", success: false });
    }
  }

  const finalTotal = Math.max(0, total - discount);

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Page Title */}
        <div className="flex items-baseline justify-between border-b border-[#DCCFB9]/40 pb-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1D211F]">
            Your Shopping Bag ({itemCount})
          </h1>
          <Link
            href="/shop"
            className="text-xs font-bold text-[#183D2B] hover:text-[#102D20] hover:underline transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#F7F5EF] text-[#8E9590] flex items-center justify-center mx-auto">
              <ShoppingBag size={28} />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#1D211F]">Your bag is currently empty</h2>
            <p className="text-xs text-[#5C6460] leading-relaxed">
              Explore our curated UAE collection of skincare, fragrances, cosmetics, and wellness formulations.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] shadow-sm transition-colors mt-2"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left 2 Cols: Cart Items & Shipping Meter ─────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Free Shipping Meter */}
              <div className="bg-white p-5 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1D211F] flex items-center gap-1.5">
                    <Truck size={16} className="text-[#183D2B]" />
                    {amountUntilFreeShipping === 0 ? (
                      <span className="text-emerald-700">Congratulations! You unlocked FREE UAE Shipping!</span>
                    ) : (
                      <span>
                        Add <strong>AED {amountUntilFreeShipping.toFixed(2)}</strong> more to unlock <strong>FREE Delivery</strong>
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[#5C6460]">{freeShippingProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#F7F5EF] overflow-hidden">
                  <div
                    className="h-full bg-[#183D2B] rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-2xl border border-[#DCCFB9]/60 shadow-xs divide-y divide-[#DCCFB9]/40 overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Item Thumbnail */}
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="w-20 h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#DCCFB9]/40 shrink-0 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.images[0]?.url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#183D2B]">
                        {item.product.category_name}
                      </span>
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="font-bold text-sm text-[#1D211F] hover:text-[#183D2B] transition-colors truncate">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#5C6460] mt-0.5">
                        AED {item.product.retail_price.toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center border border-[#DCCFB9] rounded-full bg-[#F7F5EF] p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-white text-xs font-bold text-[#1D211F] flex items-center justify-center shadow-xs hover:bg-[#183D2B] hover:text-white transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-[#1D211F]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-white text-xs font-bold text-[#1D211F] flex items-center justify-center shadow-xs hover:bg-[#183D2B] hover:text-white transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Subtotal */}
                      <span className="text-sm font-bold text-[#183D2B] min-w-[75px] text-right">
                        AED {(item.product.retail_price * item.quantity).toFixed(2)}
                      </span>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[#8E9590] hover:text-red-600 p-1.5 transition-colors"
                        title="Remove from cart"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right Column: Order Summary & Checkout ────────────────── */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#DCCFB9]/60 shadow-xs space-y-4">
                <h2 className="text-base font-serif font-bold text-[#1D211F] border-b border-[#DCCFB9]/30 pb-3">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#1D211F]">AED {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[#5C6460]">
                    <span>Estimated Shipping</span>
                    <span>
                      {shippingFee === 0 ? (
                        <strong className="text-emerald-700 font-bold uppercase">FREE</strong>
                      ) : (
                        `AED ${shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#5C6460]">
                    <span>UAE 5% VAT (Included)</span>
                    <span>AED {vatAmount.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount</span>
                      <span>-AED {discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#DCCFB9]/40 flex justify-between items-baseline text-base">
                    <span className="font-bold text-[#1D211F]">Total Amount</span>
                    <span className="text-xl font-extrabold text-[#183D2B]">
                      AED {finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyCoupon} className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. AURELLE10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 h-9 px-3 bg-[#F7F5EF] border border-[#DCCFB9] rounded-lg text-xs uppercase font-semibold text-[#1D211F] outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-[#183D2B] text-white text-xs font-bold rounded-lg hover:bg-[#102D20] transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={`text-[11px] font-semibold mt-1.5 ${
                        couponMessage.success ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {couponMessage.text}
                    </p>
                  )}
                </form>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-3.5 px-6 rounded-full bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <span>Proceed to UAE Checkout</span>
                  <ArrowRight size={15} />
                </Link>

                <div className="space-y-2 pt-2 text-[11px] text-[#5C6460]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#183D2B]" />
                    <span>256-Bit SSL Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw size={14} className="text-[#183D2B]" />
                    <span>14-Day Hassle-Free UAE Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
