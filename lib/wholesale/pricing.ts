// ============================================================
// AURELLE — WHOLESALE CENTRALIZED PRICING CALCULATION MODULE
// Server-authoritative wholesale price calculation logic.
// Modularity note: Tax calculation will be inserted after subtotal in a future phase.
// ============================================================

import type { Database } from "@/types/database";

export type PurchaseMode = "unit" | "box" | "custom";
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type WholesaleTierRow = Database["public"]["Tables"]["wholesale_price_tiers"]["Row"];

export interface WholesaleItemPricingResult {
  purchaseMode: PurchaseMode;
  quantity: number;            // Number of units or boxes ordered
  totalUnits: number;          // Total individual pieces included
  unitsPerBox: number | null;  // Units per box if box mode or configured
  unitPrice: number | null;    // Configured unit price
  boxPrice: number | null;     // Configured box price
  tierPriceApplied: number | null; // Tier unit price applied if volume tier matched
  effectiveUnitPrice: number; // Price per unit or price per box used for calculation
  subtotal: number;           // Calculated line subtotal (excl. tax)
}

/**
 * Server-side authoritative calculation for a single wholesale cart/order item.
 */
export function calculateWholesaleItemPrice(
  product: Pick<
    ProductRow,
    | "id"
    | "is_wholesale_available"
    | "wholesale_price"
    | "wholesale_moq"
    | "wholesale_unit_enabled"
    | "wholesale_unit_price"
    | "wholesale_box_enabled"
    | "wholesale_units_per_box"
    | "wholesale_box_price"
    | "wholesale_custom_quantity_enabled"
  >,
  tiers: WholesaleTierRow[] = [],
  purchaseMode: PurchaseMode,
  quantity: number
): WholesaleItemPricingResult {
  const qty = Math.max(1, Math.floor(quantity));

  if (!product.is_wholesale_available) {
    throw new Error(`Wholesale purchasing is not enabled for product ${product.id}`);
  }

  // 1. SINGLE UNIT MODE
  if (purchaseMode === "unit") {
    if (product.wholesale_unit_enabled === false) {
      throw new Error(`Single unit purchase mode is disabled for this product.`);
    }

    const moq = Math.max(1, product.wholesale_moq || 1);
    if (qty < moq) {
      throw new Error(`Order quantity (${qty}) is below product MOQ of ${moq} units.`);
    }

    // Active volume tiers sorted by min_quantity descending
    const activeTiers = (tiers || [])
      .filter((t) => t.is_active !== false)
      .sort((a, b) => b.min_quantity - a.min_quantity);

    const matchedTier = activeTiers.find(
      (t) => qty >= t.min_quantity && (t.max_quantity === null || qty <= t.max_quantity)
    );

    const baseUnitPrice = Number(product.wholesale_unit_price ?? product.wholesale_price ?? 0);
    let effectiveUnitPrice = baseUnitPrice;
    let tierPriceApplied: number | null = null;

    if (matchedTier) {
      tierPriceApplied = Number(matchedTier.price_per_unit);
      effectiveUnitPrice = tierPriceApplied;
    }

    if (effectiveUnitPrice < 0 || isNaN(effectiveUnitPrice)) {
      throw new Error(`Invalid wholesale unit price configured for product.`);
    }

    const subtotal = qty * effectiveUnitPrice;
    return {
      purchaseMode: "unit",
      quantity: qty,
      totalUnits: qty,
      unitsPerBox: product.wholesale_units_per_box ?? null,
      unitPrice: baseUnitPrice,
      boxPrice: product.wholesale_box_price != null ? Number(product.wholesale_box_price) : null,
      tierPriceApplied,
      effectiveUnitPrice,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  // 2. FULL BOX MODE
  if (purchaseMode === "box") {
    if (!product.wholesale_box_enabled) {
      throw new Error(`Full box purchase mode is disabled for this product.`);
    }
    const unitsPerBox = product.wholesale_units_per_box;
    const boxPrice = product.wholesale_box_price != null ? Number(product.wholesale_box_price) : null;

    if (!unitsPerBox || unitsPerBox <= 0 || boxPrice == null || boxPrice < 0 || isNaN(boxPrice)) {
      throw new Error(`Incomplete or invalid box configuration for product.`);
    }

    const totalUnits = qty * unitsPerBox;
    const subtotal = qty * boxPrice;

    return {
      purchaseMode: "box",
      quantity: qty,
      totalUnits,
      unitsPerBox,
      unitPrice: product.wholesale_unit_price != null ? Number(product.wholesale_unit_price) : null,
      boxPrice,
      tierPriceApplied: null,
      effectiveUnitPrice: boxPrice,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  // 3. CUSTOM QUANTITY MODE (Historical / Deprecated fallback)
  if (purchaseMode === "custom") {
    const activeTiers = (tiers || [])
      .filter((t) => t.is_active !== false)
      .sort((a, b) => b.min_quantity - a.min_quantity);

    const matchedTier = activeTiers.find(
      (t) => qty >= t.min_quantity && (t.max_quantity === null || qty <= t.max_quantity)
    );

    let effectiveUnitPrice: number;
    let tierPriceApplied: number | null = null;

    if (matchedTier) {
      tierPriceApplied = Number(matchedTier.price_per_unit);
      effectiveUnitPrice = tierPriceApplied;
    } else {
      effectiveUnitPrice = Number(product.wholesale_unit_price ?? product.wholesale_price ?? 0);
    }

    if (effectiveUnitPrice < 0 || isNaN(effectiveUnitPrice)) {
      throw new Error(`Invalid custom quantity unit price.`);
    }

    const subtotal = qty * effectiveUnitPrice;

    return {
      purchaseMode: "custom",
      quantity: qty,
      totalUnits: qty,
      unitsPerBox: product.wholesale_units_per_box ?? null,
      unitPrice: product.wholesale_unit_price != null ? Number(product.wholesale_unit_price) : null,
      boxPrice: product.wholesale_box_price != null ? Number(product.wholesale_box_price) : null,
      tierPriceApplied,
      effectiveUnitPrice,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  throw new Error(`Unsupported purchase mode: ${purchaseMode}`);
}

/**
 * Calculates overall wholesale order subtotal from individual line calculations.
 * Returns structured summary ready for future tax stage integration.
 */
export function calculateWholesaleOrderSubtotal(items: WholesaleItemPricingResult[]) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  
  return {
    subtotal: roundedSubtotal,
    // Future Tax Expansion Stage:
    // taxAmount: 0,
    // total: roundedSubtotal
    totalPayable: roundedSubtotal,
  };
}

/**
 * Admin UX Reference helper for Box Pricing comparisons.
 */
export function calculateAdminBoxPricing(
  unitsPerBox: number,
  unitPrice: number,
  boxPrice: number
) {
  const calculatedValue = Math.round(unitsPerBox * unitPrice * 100) / 100;
  const diff = Math.round(Math.abs(boxPrice - calculatedValue) * 100) / 100;
  const percentage = calculatedValue > 0 ? Math.round((diff / calculatedValue) * 100) : 0;

  const isHigher = boxPrice > calculatedValue;
  const isEqual = boxPrice === calculatedValue;
  const isLower = boxPrice < calculatedValue;

  return {
    calculatedValue,
    diff,
    percentage,
    isHigher,
    isEqual,
    isLower,
  };
}

