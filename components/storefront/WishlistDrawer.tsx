"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Heart, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import type { ProductItem } from "@/lib/products/mock-products";

// ─── Wishlist stored in localStorage ──────────────────────────────
const WISH_KEY = "aurelle_wishlist";

export function getWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(productId: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  let added: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    added = false;
  } else {
    list.push(productId);
    added = true;
  }
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event("wishlist-change"));
  return added;
}

export function isWishlisted(productId: string): boolean {
  return getWishlist().includes(productId);
}

// ─── Types ────────────────────────────────────────────────────────
export interface TopRatedProduct {
  id: string;
  name: string;
  slug: string;
  retail_price: number;
  rating: number;
  reviews_count: number;
  product_images?: Array<{
    secure_url?: string;
    alt_text?: string | null;
    is_primary?: boolean;
  }>;
}

interface WishlistDrawerProps {
  open: boolean;
  onClose: () => void;
  wishlistedProducts?: ProductItem[];
  topRatedProducts?: TopRatedProduct[];
}

// ─── Main Drawer ──────────────────────────────────────────────────
export default function WishlistDrawer({
  open,
  onClose,
  wishlistedProducts = [],
  topRatedProducts = [],
}: WishlistDrawerProps) {
  const { addItem } = useCart();
  const [items, setItems] = useState<ProductItem[]>(wishlistedProducts);
  const [loading, setLoading] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Sync wishlist from database and localStorage
  const loadData = useCallback(async () => {
    const ids = getWishlist();
    if (ids.length === 0) {
      setItems([]);
    } else {
      setLoading(true);
      try {
        const supabase = createClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("products")
          .select(`
            id, name, slug, sku, retail_price, description, short_description,
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
          `)
          .in("id", ids);

        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: ProductItem[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku || p.id,
            description: p.description || "",
            short_description: p.short_description || "",
            retail_price: Number(p.retail_price) || 0,
            category_id: "",
            category_slug: "",
            category_name: "",
            subcategory: "",
            brand_name: "",
            is_featured: false,
            is_best_seller: false,
            is_new_arrival: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            images: (p.product_images || []).map((img: any) => ({
              url: img.secure_url || "",
              alt: img.alt_text || p.name,
              is_primary: img.is_primary ?? false,
            })),
            stock_quantity: 1,
            stock_status: "in_stock" as const,
            wholesale_moq: 1,
            wholesale_price: Number(p.retail_price) || 0,
            rating: 5,
            reviews_count: 0,
            tags: [],
          }));
          setItems(mapped);
        }
      } catch {
        // Silently fail if offline or db issue
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  useEffect(() => {
    const onWishlistChange = () => {
      if (open) loadData();
    };
    window.addEventListener("wishlist-change", onWishlistChange);
    return () => window.removeEventListener("wishlist-change", onWishlistChange);
  }, [open, loadData]);

  function handleAdd(product: ProductItem) {
    addItem(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  function handleRemove(productId: string) {
    toggleWishlist(productId);
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="wl-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="wl-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl w-full max-w-[420px]"
            style={{ height: "100dvh" }}
            role="dialog"
            aria-modal="true"
            aria-label="Wishlist"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE9DF] shrink-0">
              <div className="flex items-center gap-2">
                <Heart size={20} strokeWidth={1.7} className="text-[#183D2B]" fill="#183D2B" />
                <h2 className="text-[15px] font-bold text-[#1D211F] tracking-tight uppercase">
                  Wishlist
                  {items.length > 0 && (
                    <span className="ml-2 text-[12px] font-semibold text-[#183D2B] bg-[#F0F7F3] px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-[#5C6460] hover:text-[#183D2B] hover:bg-[#F0F7F3] transition-colors"
                aria-label="Close wishlist"
              >
                <X size={20} strokeWidth={1.7} />
              </button>
            </div>

            {/* Scrollable body — min-h-0 lets this flex child clip to the
                remaining drawer height instead of growing to fit all its
                content (wishlist items + Top Rated slider), which is what
                was pushing Top Rated past the viewport and out of reach. */}
            <div
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* Wishlisted items */}
              <div className="px-5 py-4 space-y-4">
                {loading && items.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8C938F]">Loading wishlist...</div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-[#F7F5EF] flex items-center justify-center">
                      <Heart size={32} strokeWidth={1.3} className="text-[#DCCFB9]" />
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-[#1D211F] mb-1">Your wishlist is empty</p>
                      <p className="text-[13px] text-[#8C938F]">Save items you love for later.</p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-2 px-6 py-2.5 bg-[#183D2B] text-white text-[13px] font-semibold rounded-sm hover:bg-[#102D20] transition-colors"
                    >
                      Shop Now
                    </button>
                  </div>
                ) : (
                  items.map((product) => {
                    const image = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
                    return (
                      <div key={product.id} className="flex gap-3 pb-4 border-b border-[#EDE9DF] last:border-0 last:pb-0">
                        <Link href={`/products/${product.slug}`} onClick={onClose} className="shrink-0">
                          <div className="w-[72px] h-[88px] bg-[#F5F5F5] rounded-sm overflow-hidden relative">
                            {image?.url ? (
                              <Image
                                src={image.url}
                                alt={image.alt || product.name}
                                fill
                                sizes="72px"
                                className="object-contain p-1.5"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-xl font-bold text-[#183D2B]/20">
                                {product.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={onClose}
                            className="text-[13px] font-semibold text-[#1D211F] line-clamp-2 hover:text-[#183D2B] transition-colors leading-snug"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-0.5 text-[13px] font-bold text-[#183D2B]">
                            AED {product.retail_price.toFixed(2)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdd(product)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#183D2B] text-white text-[11px] font-semibold uppercase tracking-wide rounded-sm hover:bg-[#102D20] transition-colors"
                            >
                              <ShoppingBag size={12} strokeWidth={2} />
                              {addedId === product.id ? "Added!" : "Add to Cart"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(product.id)}
                              className="p-1.5 text-[#C4C4C4] hover:text-red-500 transition-colors"
                              aria-label="Remove from wishlist"
                            >
                              <X size={14} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}