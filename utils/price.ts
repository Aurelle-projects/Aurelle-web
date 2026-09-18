// ============================================================
// AURELLE — PRICE UTILITIES
// All price formatting for UAE market (AED).
// ============================================================

/**
 * Format a price in AED.
 * Example: 299.99 → "AED 299.99"
 */
export function formatPrice(
  amount: number,
  options?: {
    currency?: string;
    locale?: string;
    compact?: boolean;
  }
): string {
  const currency = options?.currency ?? "AED";
  const locale = options?.locale ?? "en-AE";

  if (options?.compact) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate discount percentage.
 * Returns integer 0–100.
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Convert Stripe amount (cents/fils) to display amount.
 * Stripe stores AED in fils (smallest unit).
 */
export function stripeAmountToDisplay(amount: number): number {
  return amount / 100;
}

/**
 * Convert display amount to Stripe amount (fils/cents).
 */
export function displayAmountToStripe(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Determine the effective unit price for a wholesale order
 * based on quantity tiers.
 */
export function getWholesaleTierPrice(
  quantity: number,
  tiers: Array<{
    min_quantity: number;
    max_quantity: number | null;
    price_per_unit: number;
    is_active: boolean;
  }>,
  defaultWholesalePrice: number
): number {
  const activeTiers = tiers
    .filter((t) => t.is_active)
    .sort((a, b) => b.min_quantity - a.min_quantity);

  for (const tier of activeTiers) {
    const withinMin = quantity >= tier.min_quantity;
    const withinMax =
      tier.max_quantity === null || quantity <= tier.max_quantity;

    if (withinMin && withinMax) {
      return tier.price_per_unit;
    }
  }

  return defaultWholesalePrice;
}
