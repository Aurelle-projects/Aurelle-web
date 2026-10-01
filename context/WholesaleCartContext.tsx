"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateWholesaleItemPrice, calculateWholesaleOrderSubtotal, WholesaleItemPricingResult, PurchaseMode } from "@/lib/wholesale/pricing";
import type { Database } from "@/types/database";

export type WholesaleTierRow = Database["public"]["Tables"]["wholesale_price_tiers"]["Row"];

export interface WholesaleCartProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  brand_name: string | null;
  wholesale_unit_enabled?: boolean;
  wholesale_unit_price?: number | null;
  wholesale_box_enabled?: boolean;
  wholesale_units_per_box?: number | null;
  wholesale_box_price?: number | null;
  wholesale_custom_quantity_enabled?: boolean;
  wholesale_price?: number | null;
  wholesale_moq?: number | null;
  is_wholesale_available?: boolean;
}

export interface WholesaleCartItem {
  id: string;
  productId: string;
  purchaseMode: PurchaseMode;
  quantity: number;
  unitsPerBox?: number | null;
  product: WholesaleCartProduct;
  tiers?: WholesaleTierRow[];
  pricing: WholesaleItemPricingResult;
}

interface WholesaleCartContextType {
  items: WholesaleCartItem[];
  itemCount: number;
  totalPieces: number;
  subtotal: number;
  totalPayable: number;
  isLoading: boolean;
  addItem: (
    product: WholesaleCartProduct,
    purchaseMode: PurchaseMode,
    quantity: number,
    tiers?: WholesaleTierRow[]
  ) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const WholesaleCartContext = createContext<WholesaleCartContextType | undefined>(undefined);
const STORAGE_KEY = "aurelle_b2b_wholesale_cart";

export function WholesaleCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WholesaleCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync to localStorage as client fallback
  const saveToLocalStorage = (cartItems: WholesaleCartItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  };

  // Load cart from DB if authenticated wholesale_customer, else fallback to localStorage
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Verify user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "wholesale_customer") {
          // Fetch or create user's wholesale cart
          let { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .eq("cart_type", "wholesale")
            .maybeSingle();

          if (!cart) {
            const { data: newCart } = await supabase
              .from("carts")
              .insert({ user_id: user.id, cart_type: "wholesale" })
              .select("id")
              .single();
            cart = newCart;
          }

          if (cart?.id) {
            const { data: dbItems } = await supabase
              .from("cart_items")
              .select(`
                id, quantity, purchase_mode, units_per_box,
                product:products(
                  id, name, slug, sku, is_wholesale_available, wholesale_price, wholesale_moq,
                  wholesale_unit_enabled, wholesale_unit_price, wholesale_box_enabled,
                  wholesale_units_per_box, wholesale_box_price, wholesale_custom_quantity_enabled,
                  brand:brands(name),
                  product_images(secure_url, is_primary)
                )
              `)
              .eq("cart_id", cart.id);

            if (dbItems && dbItems.length > 0) {
              const formattedItems: WholesaleCartItem[] = [];

              for (const item of dbItems) {
                if (!item.product) continue;

                // Fetch tiers for custom mode
                const { data: tiers } = await supabase
                  .from("wholesale_price_tiers")
                  .select("*")
                  .eq("product_id", item.product.id)
                  .eq("is_active", true);

                const primaryImg = item.product.product_images?.find((img: any) => img.is_primary)?.secure_url ||
                  item.product.product_images?.[0]?.secure_url || null;

                const productObj: WholesaleCartProduct = {
                  id: item.product.id,
                  name: item.product.name,
                  slug: item.product.slug,
                  sku: item.product.sku,
                  image: primaryImg,
                  brand_name: item.product.brand?.name || null,
                  wholesale_unit_enabled: item.product.wholesale_unit_enabled ?? true,
                  wholesale_unit_price: item.product.wholesale_unit_price,
                  wholesale_box_enabled: item.product.wholesale_box_enabled ?? false,
                  wholesale_units_per_box: item.product.wholesale_units_per_box,
                  wholesale_box_price: item.product.wholesale_box_price,
                  wholesale_custom_quantity_enabled: item.product.wholesale_custom_quantity_enabled ?? true,
                  wholesale_price: item.product.wholesale_price,
                  wholesale_moq: item.product.wholesale_moq ?? 1,
                  is_wholesale_available: item.product.is_wholesale_available ?? true,
                };

                const pricing = calculateWholesaleItemPrice(
                  productObj as any,
                  tiers || [],
                  (item.purchase_mode || "unit") as PurchaseMode,
                  item.quantity
                );

                formattedItems.push({
                  id: item.id,
                  productId: item.product.id,
                  purchaseMode: (item.purchase_mode || "unit") as PurchaseMode,
                  quantity: item.quantity,
                  unitsPerBox: item.units_per_box ?? productObj.wholesale_units_per_box,
                  product: productObj,
                  tiers: tiers || [],
                  pricing,
                });
              }

              setItems(formattedItems);
              saveToLocalStorage(formattedItems);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // LocalStorage Fallback
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Aggregate totals
  const itemCount = useMemo(() => items.length, [items]);

  const totalPieces = useMemo(
    () => items.reduce((sum, item) => sum + item.pricing.totalUnits, 0),
    [items]
  );

  const { subtotal, totalPayable } = useMemo(
    () => calculateWholesaleOrderSubtotal(items.map((i) => i.pricing)),
    [items]
  );

  // Add Item
  const addItem = useCallback(
    async (
      product: WholesaleCartProduct,
      purchaseMode: PurchaseMode,
      quantity: number,
      tiers: WholesaleTierRow[] = []
    ) => {
      const pricing = calculateWholesaleItemPrice(product as any, tiers, purchaseMode, quantity);
      const itemId = `${product.id}-${purchaseMode}`;

      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === product.id && i.purchaseMode === purchaseMode);
        let updated: WholesaleCartItem[];

        if (existingIdx >= 0 && prev[existingIdx]) {
          const item = prev[existingIdx];
          const newQty = item.quantity + quantity;
          const newPricing = calculateWholesaleItemPrice(product as any, tiers, purchaseMode, newQty);
          updated = [...prev];
          updated[existingIdx] = {
            ...item,
            quantity: newQty,
            pricing: newPricing,
          };
        } else {
          updated = [
            ...prev,
            {
              id: itemId,
              productId: product.id,
              purchaseMode,
              quantity,
              unitsPerBox: product.wholesale_units_per_box,
              product,
              tiers,
              pricing,
            },
          ];
        }
        saveToLocalStorage(updated);
        return updated;
      });

      // Persist to DB if logged in as wholesale customer
      try {
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          let { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .eq("cart_type", "wholesale")
            .maybeSingle();

          if (!cart) {
            const { data: newCart } = await supabase
              .from("carts")
              .insert({ user_id: user.id, cart_type: "wholesale" })
              .select("id")
              .single();
            cart = newCart;
          }

          if (cart?.id) {
            // Check if cart_item exists
            const { data: existingItem } = await supabase
              .from("cart_items")
              .select("id, quantity")
              .eq("cart_id", cart.id)
              .eq("product_id", product.id)
              .eq("purchase_mode", purchaseMode)
              .maybeSingle();

            if (existingItem) {
              await supabase
                .from("cart_items")
                .update({
                  quantity: existingItem.quantity + quantity,
                  units_per_box: product.wholesale_units_per_box || null,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingItem.id);
            } else {
              await supabase.from("cart_items").insert({
                cart_id: cart.id,
                product_id: product.id,
                quantity,
                purchase_mode: purchaseMode,
                units_per_box: product.wholesale_units_per_box || null,
              });
            }
          }
        }
      } catch (dbErr) {
        console.warn("[WholesaleCart] DB sync notice:", dbErr);
      }
    },
    []
  );

  // Remove Item
  const removeItem = useCallback(
    async (itemId: string) => {
      let targetItem = items.find((i) => i.id === itemId || `${i.productId}-${i.purchaseMode}` === itemId);

      setItems((prev) => {
        const updated = prev.filter((i) => i.id !== itemId && `${i.productId}-${i.purchaseMode}` !== itemId);
        saveToLocalStorage(updated);
        return updated;
      });

      try {
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (user && targetItem) {
          const { data: cart } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .eq("cart_type", "wholesale")
            .maybeSingle();

          if (cart?.id) {
            await supabase
              .from("cart_items")
              .delete()
              .eq("cart_id", cart.id)
              .eq("product_id", targetItem.productId)
              .eq("purchase_mode", targetItem.purchaseMode);
          }
        }
      } catch {
        // silent
      }
    },
    [items]
  );

  // Update Quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setItems((prev) => {
        const target = prev.find((i) => i.id === itemId || `${i.productId}-${i.purchaseMode}` === itemId);
        if (!target) return prev;

        const minQty = target.purchaseMode === "unit" ? Math.max(1, target.product.wholesale_moq || 1) : 1;

        if (quantity <= 0) {
          return prev.filter((i) => i.id !== target.id);
        }
        const finalQty = Math.max(minQty, quantity);

        const updated = prev.map((item) => {
          if (item.id === target.id) {
            const newPricing = calculateWholesaleItemPrice(item.product as any, item.tiers || [], item.purchaseMode, finalQty);
            return {
              ...item,
              quantity: finalQty,
              pricing: newPricing,
            };
          }
          return item;
        });
        saveToLocalStorage(updated);
        return updated;
      });

      try {
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const target = items.find((i) => i.id === itemId || `${i.productId}-${i.purchaseMode}` === itemId);
          if (target) {
            const minQty = target.purchaseMode === "unit" ? Math.max(1, target.product.wholesale_moq || 1) : 1;
            if (quantity <= 0) {
              await removeItem(itemId);
              return;
            }
            const finalQty = Math.max(minQty, quantity);

            const { data: cart } = await supabase
              .from("carts")
              .select("id")
              .eq("user_id", user.id)
              .eq("cart_type", "wholesale")
              .maybeSingle();

            if (cart?.id) {
              await supabase
                .from("cart_items")
                .update({ quantity: finalQty, updated_at: new Date().toISOString() })
                .eq("cart_id", cart.id)
                .eq("product_id", target.productId)
                .eq("purchase_mode", target.purchaseMode);
            }
          }
        }
      } catch {
        // silent
      }
    },
    [items, removeItem]
  );

  // Clear Cart
  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: cart } = await supabase
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .eq("cart_type", "wholesale")
          .maybeSingle();

        if (cart?.id) {
          await supabase.from("cart_items").delete().eq("cart_id", cart.id);
        }
      }
    } catch {
      // silent
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalPieces,
      subtotal,
      totalPayable,
      isLoading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      refreshCart: loadCart,
    }),
    [items, itemCount, totalPieces, subtotal, totalPayable, isLoading, addItem, removeItem, updateQuantity, clearCart, loadCart]
  );

  return (
    <WholesaleCartContext.Provider value={value}>
      {children}
    </WholesaleCartContext.Provider>
  );
}

export function useWholesaleCart() {
  const context = useContext(WholesaleCartContext);
  if (!context) {
    throw new Error("useWholesaleCart must be used within a WholesaleCartProvider");
  }
  return context;
}
