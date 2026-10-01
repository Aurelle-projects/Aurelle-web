"use client";

import React from "react";
import Link from "next/link";
import { useWholesaleCart } from "@/context/WholesaleCartContext";
import { formatPrice } from "@/utils/price";
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  Package,
  Building2,
  ShieldCheck,
  Truck,
} from "lucide-react";

export default function WholesaleCartPage() {
  const { items, itemCount, totalPieces, subtotal, totalPayable, updateQuantity, removeItem, clearCart, isLoading } =
    useWholesaleCart();

  if (isLoading) {
    return (
      <div className="bg-[#FAF8F5] min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#183D2B] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#5C6460]">Loading wholesale cart...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#FAF8F5] min-h-[65vh] py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-xl border border-[#EFEAE0] shadow-xs space-y-4">
          <div className="w-16 h-16 bg-[#183D2B]/10 rounded-full flex items-center justify-center mx-auto text-[#183D2B]">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-xl font-bold text-[#14231B]">Your Wholesale Cart is Empty</h1>
          <p className="text-xs text-[#5C6460] leading-relaxed">
            Browse our catalog of verified cosmetics and beauty products to add items to your B2B trade order.
          </p>
          <Link
            href="/wholesale/shop"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
          >
            <span>Explore Wholesale Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFEAE0] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#183D2B] text-white px-2 py-0.5 rounded-xs">
                B2B Trade Cart
              </span>
              <span className="text-xs text-[#5C6460]">{itemCount} product(s)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#14231B] mt-1">Wholesale Order Review</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => clearCart()}
              className="text-xs font-bold text-[#8E9590] hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={14} />
              <span>Clear Cart</span>
            </button>
            <Link
              href="/wholesale/shop"
              className="text-xs font-bold text-[#183D2B] hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span>Continue Browsing</span>
            </Link>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const { pricing, product, purchaseMode } = item;
              const unitMoq = Math.max(1, product.wholesale_moq || 1);
              const minQty = purchaseMode === "unit" ? unitMoq : 1;

              return (
                <div
                  key={item.id}
                  className="bg-white p-4 sm:p-5 rounded-lg border border-[#EFEAE0] shadow-xs space-y-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-[#FAF8F5] rounded-sm overflow-hidden shrink-0 border border-[#EFEAE0]">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8E9590]">
                          <Package size={28} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-[#183D2B] uppercase tracking-wider">
                            {product.brand_name || "Aurelle"}
                          </p>
                          <Link
                            href={`/wholesale/products/${product.slug}`}
                            className="text-sm font-bold text-[#14231B] hover:text-[#183D2B] line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          {product.sku && (
                            <p className="text-[11px] text-[#8E9590] font-mono">SKU: {product.sku}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[#8E9590] hover:text-red-600 transition-colors p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Purchasing Mode Badge & Details */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
                        {purchaseMode === "box" ? (
                          <span className="font-bold text-[#14231B] bg-[#C9A84C]/20 border border-[#C9A84C]/40 px-2 py-0.5 rounded-sm">
                            BOX ({pricing.unitsPerBox} pcs/box &bull; {pricing.totalUnits} pcs total)
                          </span>
                        ) : (
                          <span className="font-bold text-[#183D2B] bg-[#183D2B]/10 border border-[#183D2B]/20 px-2 py-0.5 rounded-sm">
                            UNIT ({pricing.totalUnits} pcs)
                          </span>
                        )}
                        {purchaseMode === "unit" && unitMoq > 1 && (
                          <span className="text-[10px] text-[#5C6460]">
                            (MOQ: {unitMoq} pcs)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Line Total */}
                  <div className="pt-3 border-t border-[#EFEAE0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#5C6460]">
                        Qty ({purchaseMode === "box" ? "Boxes" : "Units"}):
                      </span>
                      <div className="flex items-center bg-[#FAF8F5] rounded-sm border border-[#DCCFB9]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= minQty}
                          className="w-8 h-8 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] transition-colors cursor-pointer disabled:opacity-30"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-12 text-center text-xs font-bold text-[#14231B]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#14231B] hover:bg-[#EFEAE0] transition-colors cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8E9590] block">
                        Rate: {formatPrice(pricing.effectiveUnitPrice)} / {purchaseMode === "box" ? "box" : "piece"}
                      </span>
                      <span className="text-base font-bold text-[#183D2B]">
                        {formatPrice(pricing.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wholesale Order Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-[#EFEAE0] shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold text-[#14231B] uppercase tracking-wider border-b border-[#EFEAE0] pb-3">
                Commercial Order Summary
              </h2>

              <div className="space-y-2.5 text-xs text-[#5C6460]">
                <div className="flex justify-between">
                  <span>Line Items</span>
                  <span className="font-bold text-[#14231B]">{itemCount} product(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Wholesale Units</span>
                  <span className="font-bold text-[#14231B]">{totalPieces} pcs</span>
                </div>
                <div className="flex justify-between border-t border-[#EFEAE0] pt-2">
                  <span>Subtotal (excl. Tax)</span>
                  <span className="font-bold text-[#14231B] text-sm">{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Order Terms Note */}
              <div className="p-3 bg-[#FAF8F5] border border-[#EFEAE0] rounded-sm text-[11px] text-[#5C6460] space-y-1">
                <p className="font-bold text-[#183D2B]">B2B Direct Order Terms:</p>
                <p>
                  No payment gateway is required at checkout. Official commercial invoice &amp; payment settlement will be arranged directly with Aurelle&apos;s B2B team via WhatsApp/Phone.
                </p>
              </div>

              {/* Final Subtotal & CTA */}
              <div className="pt-3 border-t border-[#EFEAE0] space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#14231B] uppercase tracking-wider">Total Payable Amount</span>
                  <span className="text-xl font-bold text-[#183D2B]">{formatPrice(totalPayable)}</span>
                </div>

                <Link
                  href="/wholesale/checkout"
                  className="w-full py-3.5 px-4 bg-[#183D2B] hover:bg-[#102D20] text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Proceed to Wholesale Checkout</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-center text-[10px] text-[#8E9590]">
                <div className="flex items-center gap-1.5 justify-center">
                  <Truck size={14} className="text-[#183D2B]" />
                  <span>24-48h GCC Freight</span>
                </div>
                <div className="flex items-center gap-1.5 justify-center">
                  <Building2 size={14} className="text-[#183D2B]" />
                  <span>Official B2B Order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
