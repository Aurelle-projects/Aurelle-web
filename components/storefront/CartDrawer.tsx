"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, itemCount, subtotal, shippingFee, total, amountUntilFreeShipping, updateQuantity, removeItem } =
    useCart();

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl w-full max-w-[420px]"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE9DF]">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} strokeWidth={1.7} className="text-[#183D2B]" />
                <h2 className="text-[15px] font-bold text-[#1D211F] tracking-tight uppercase">
                  Cart
                  {itemCount > 0 && (
                    <span className="ml-2 text-[12px] font-semibold text-[#183D2B] bg-[#F0F7F3] px-2 py-0.5 rounded-full">
                      {itemCount}
                    </span>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F0F7F3] transition-colors"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={1.7} />
              </button>
            </div>

            {/* Free shipping progress */}
            {amountUntilFreeShipping > 0 && itemCount > 0 && (
              <div className="px-5 pt-3 pb-2 bg-[#FAFAF8] border-b border-[#EDE9DF]">
                <p className="text-[11.5px] text-[#5C6460] mb-1.5">
                  Add <strong className="text-[#183D2B]">AED {amountUntilFreeShipping.toFixed(0)}</strong> more for free shipping
                </p>
                <div className="h-1 w-full bg-[#EDE9DF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#183D2B] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((subtotal) / (subtotal + amountUntilFreeShipping)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-[#F7F5EF] flex items-center justify-center">
                    <ShoppingBag size={32} strokeWidth={1.3} className="text-[#DCCFB9]" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#1D211F] mb-1">Your cart is empty</p>
                    <p className="text-[13px] text-[#8C938F]">Add something beautiful to get started.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2.5 bg-[#183D2B] text-white text-[13px] font-semibold rounded-sm hover:bg-[#102D20] transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => {
                  const image = item.product.images?.find((i) => i.is_primary) ?? item.product.images?.[0];
                  return (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-[#EDE9DF] last:border-0 last:pb-0">
                      {/* Image */}
                      <Link href={`/products/${item.product.slug}`} onClick={onClose} className="shrink-0">
                        <div className="w-[76px] h-[90px] bg-[#F5F5F5] rounded-sm overflow-hidden relative">
                          {image?.url ? (
                            <Image
                              src={image.url}
                              alt={image.alt || item.product.name}
                              fill
                              sizes="76px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-xl font-bold text-[#183D2B]/20">
                              {item.product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={onClose}
                          className="text-[13px] font-semibold text-[#1D211F] line-clamp-2 hover:text-[#183D2B] transition-colors leading-snug"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-1 text-[12px] text-[#8C938F]">
                          AED {item.product.retail_price.toFixed(2)}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          {/* Qty control */}
                          <div className="flex items-center border border-[#D8CDBB] rounded-sm overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F7F5EF] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} strokeWidth={2} />
                            </button>
                            <span className="w-8 text-center text-[13px] font-semibold text-[#1D211F]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F7F5EF] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} strokeWidth={2} />
                            </button>
                          </div>

                          {/* Line total + remove */}
                          <div className="flex items-center gap-2.5">
                            <span className="text-[13px] font-bold text-[#183D2B]">
                              AED {(item.product.retail_price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[#C4C4C4] hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 size={14} strokeWidth={1.8} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-[#EDE9DF] bg-[#FAFAF8] space-y-3">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#1D211F]">AED {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5C6460]">
                    <span>Shipping</span>
                    <span className={shippingFee === 0 ? "text-[#183D2B] font-semibold" : "font-medium text-[#1D211F]"}>
                      {shippingFee === 0 ? "Free" : `AED ${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[15px] text-[#1D211F] pt-1.5 border-t border-[#EDE9DF]">
                    <span>Total</span>
                    <span className="text-[#183D2B]">AED {total.toFixed(2)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#183D2B] text-white text-[13.5px] font-bold uppercase tracking-wide rounded-sm hover:bg-[#102D20] transition-colors"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-[12.5px] font-medium text-[#5C6460] hover:text-[#183D2B] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
