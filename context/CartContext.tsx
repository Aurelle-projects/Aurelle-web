"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { ProductItem } from "@/lib/products/mock-products";
import { calculateRetailOrderTotals, RETAIL_TAX_RATE } from "@/lib/pricing/retail";

export interface CartItem {
  id: string;
  product: ProductItem;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  vatAmount: number; // backward compatibility alias for taxAmount
  taxRate: number;
  hasTaxableItems: boolean;
  shippingFee: number;
  total: number;
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;
  isHydrated: boolean;
  addItem: (product: ProductItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "aurelle_cart_items";
const FREE_SHIPPING_THRESHOLD = 199; // AED
const STANDARD_SHIPPING_FEE = 20; // AED

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [standardShippingFee, setStandardShippingFee] = useState<number>(20);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(199);

  // 1. Hydrate from localStorage once on client mount & load dynamic store settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {
      console.warn("[CartContext] Failed to load cart from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }

    // Load dynamic shipping charges configured in Admin Settings
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.standard_shipping_fee === "number") {
          setStandardShippingFee(data.standard_shipping_fee);
        }
        if (data && typeof data.free_shipping_threshold === "number") {
          setFreeShippingThreshold(data.free_shipping_threshold);
        }
      })
      .catch((err) => {
        console.warn("[CartContext] Settings fetch warning:", err);
      });
  }, []);

  // 2. Save to localStorage ONLY after hydration has completed
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("[CartContext] Failed to save cart to localStorage:", e);
    }
  }, [items, isHydrated]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const rawSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.product.retail_price) || 0) * item.quantity, 0),
    [items]
  );

  const shippingFee = useMemo(
    () => (rawSubtotal >= freeShippingThreshold || rawSubtotal === 0 ? 0 : standardShippingFee),
    [rawSubtotal, freeShippingThreshold, standardShippingFee]
  );

  const lineInputs = useMemo(
    () =>
      items.map((it) => ({
        price: it.product.retail_price,
        quantity: it.quantity,
        tax_enabled: it.product.tax_enabled,
      })),
    [items]
  );

  const pricingSummary = useMemo(
    () => calculateRetailOrderTotals(lineInputs, shippingFee, 0),
    [lineInputs, shippingFee]
  );

  const subtotal = pricingSummary.subtotal;
  const taxAmount = pricingSummary.taxAmount;
  const vatAmount = pricingSummary.taxAmount;
  const hasTaxableItems = pricingSummary.hasTaxableItems;
  const total = pricingSummary.total;

  const amountUntilFreeShipping = useMemo(
    () => Math.max(0, freeShippingThreshold - subtotal),
    [subtotal, freeShippingThreshold]
  );

  const addItem = useCallback((product: ProductItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { id: product.id, product, quantity }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId && item.product.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== itemId && item.product.id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId || item.product.id === itemId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      taxAmount,
      vatAmount,
      taxRate: RETAIL_TAX_RATE,
      hasTaxableItems,
      shippingFee,
      total,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountUntilFreeShipping,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
      taxAmount,
      vatAmount,
      hasTaxableItems,
      shippingFee,
      total,
      amountUntilFreeShipping,
      isHydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
