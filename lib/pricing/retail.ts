// ============================================================
// AURELLE — RETAIL CENTRALIZED PRICING & TAX CALCULATION MODULE
// Authoritative Retail 5% VAT Calculation logic and constants.
// ============================================================

/**
 * Global Retail Tax (VAT) rate for Aurelle e-commerce.
 * Currently set to 5% (0.05) under UAE VAT regulations.
 */
export const RETAIL_TAX_RATE = 0.05;

export interface RetailLineItemInput {
  price: number;
  quantity: number;
  tax_enabled?: boolean | null;
}

export interface RetailItemPricingResult {
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
  taxEnabled: boolean;
  lineTax: number;
  lineTotal: number;
}

export interface RetailOrderPricingSummary {
  subtotal: number;        // Sum of all line subtotals (excl. tax)
  taxableAmount: number;   // Subtotal of products where tax_enabled is true
  taxExemptAmount: number; // Subtotal of products where tax_enabled is false
  taxAmount: number;       // Calculated 5% tax on taxableAmount
  taxRate: number;         // 0.05 (5%)
  hasTaxableItems: boolean;// True if any item in cart is taxable
  discountAmount: number;  // Applied discounts / coupons
  shippingAmount: number;  // Standard shipping fee or free shipping
  total: number;           // subtotal - discount + tax + shipping
}

/**
 * Calculates line subtotal and line tax for an individual retail item.
 * 
 * Calculation Formula:
 * line_subtotal = unit_price * quantity
 * If product.tax_enabled !== false:
 *   line_tax = line_subtotal * 0.05
 * Otherwise:
 *   line_tax = 0
 */
export function calculateRetailItemTax(
  unitPrice: number,
  quantity: number,
  taxEnabled: boolean = true
): { lineSubtotal: number; lineTax: number; lineTotal: number } {
  const qty = Math.max(0, Math.floor(quantity));
  const price = Math.max(0, Number(unitPrice) || 0);
  const lineSubtotal = Math.round(price * qty * 100) / 100;
  const isTaxable = taxEnabled !== false;
  const lineTax = isTaxable ? Math.round(lineSubtotal * RETAIL_TAX_RATE * 100) / 100 : 0;
  const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

  return { lineSubtotal, lineTax, lineTotal };
}

/**
 * Calculates authoritative order / cart totals for retail items.
 * 
 * AUTHORITATIVE CALCULATION PIPELINE:
 * 1. Product Line Subtotals: sum(unit_price * quantity)
 * 2. Coupon / Discount Application: subtotal - discount_amount
 * 3. Taxable Subtotal Determination: sum(line_subtotal WHERE tax_enabled = true)
 * 4. 5% Retail Tax Calculation: taxable_subtotal * 0.05
 * 5. Shipping Fee Addition: + shipping_amount
 * 6. Final Payable Total: subtotal - discount + tax + shipping
 */
export function calculateRetailOrderTotals(
  items: RetailLineItemInput[],
  shippingAmount: number = 0,
  discountAmount: number = 0
): RetailOrderPricingSummary {
  let subtotal = 0;
  let taxableAmount = 0;
  let taxExemptAmount = 0;
  let taxAmount = 0;
  let hasTaxableItems = false;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    if (qty <= 0) continue;

    const price = Math.max(0, Number(item.price) || 0);
    const lineSubtotal = Math.round(price * qty * 100) / 100;
    const isTaxable = item.tax_enabled !== false;

    subtotal += lineSubtotal;

    if (isTaxable) {
      hasTaxableItems = true;
      taxableAmount += lineSubtotal;
      const lineTax = Math.round(lineSubtotal * RETAIL_TAX_RATE * 100) / 100;
      taxAmount += lineTax;
    } else {
      taxExemptAmount += lineSubtotal;
    }
  }

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const roundedTaxableAmount = Math.round(taxableAmount * 100) / 100;
  const roundedTaxExemptAmount = Math.round(taxExemptAmount * 100) / 100;
  const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
  const roundedDiscount = Math.max(0, Math.round(discountAmount * 100) / 100);
  const roundedShipping = Math.max(0, Math.round(shippingAmount * 100) / 100);

  const finalTotal = Math.max(
    0,
    Math.round((roundedSubtotal - roundedDiscount + roundedTaxAmount + roundedShipping) * 100) / 100
  );

  return {
    subtotal: roundedSubtotal,
    taxableAmount: roundedTaxableAmount,
    taxExemptAmount: roundedTaxExemptAmount,
    taxAmount: roundedTaxAmount,
    taxRate: RETAIL_TAX_RATE,
    hasTaxableItems,
    discountAmount: roundedDiscount,
    shippingAmount: roundedShipping,
    total: finalTotal,
  };
}
