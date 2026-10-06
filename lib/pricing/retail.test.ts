// ============================================================
// AURELLE — RETAIL 5% TAX IMPLEMENTATION TEST SUITE
// Tests all 7 required cases according to the specification.
// ============================================================

import {
  RETAIL_TAX_RATE,
  calculateRetailItemTax,
  calculateRetailOrderTotals,
} from "./retail";
import {
  calculateWholesaleItemPrice,
  calculateWholesaleOrderSubtotal,
} from "../wholesale/pricing";

function assertEqual(actual: unknown, expected: unknown, testName: string) {
  if (actual !== expected) {
    throw new Error(`[FAIL] ${testName}: Expected ${expected} (${typeof expected}), but got ${actual} (${typeof actual})`);
  }
  console.log(`[PASS] ${testName}`);
}

export function runRetailTaxTests() {
  console.log("──────────────────────────────────────────────────");
  console.log("Running Retail 5% Tax Verification Tests");
  console.log("──────────────────────────────────────────────────");

  // CASE 1: Taxable retail product (price = 100, quantity = 1, tax = 5, total = 105)
  {
    const item = calculateRetailItemTax(100, 1, true);
    assertEqual(item.lineSubtotal, 100, "Case 1: Line subtotal (100 x 1)");
    assertEqual(item.lineTax, 5, "Case 1: Line tax at 5%");
    assertEqual(item.lineTotal, 105, "Case 1: Line total (subtotal + tax)");

    const order = calculateRetailOrderTotals([{ price: 100, quantity: 1, tax_enabled: true }], 0, 0);
    assertEqual(order.subtotal, 100, "Case 1: Order subtotal");
    assertEqual(order.taxAmount, 5, "Case 1: Order taxAmount");
    assertEqual(order.total, 105, "Case 1: Order total");
    assertEqual(order.hasTaxableItems, true, "Case 1: hasTaxableItems is true");
  }

  // CASE 2: Taxable retail product quantity 2 (price = 100, quantity = 2, subtotal = 200, tax = 10, total = 210)
  {
    const item = calculateRetailItemTax(100, 2, true);
    assertEqual(item.lineSubtotal, 200, "Case 2: Line subtotal (100 x 2)");
    assertEqual(item.lineTax, 10, "Case 2: Line tax at 5%");
    assertEqual(item.lineTotal, 210, "Case 2: Line total (subtotal + tax)");

    const order = calculateRetailOrderTotals([{ price: 100, quantity: 2, tax_enabled: true }], 0, 0);
    assertEqual(order.subtotal, 200, "Case 2: Order subtotal");
    assertEqual(order.taxAmount, 10, "Case 2: Order taxAmount");
    assertEqual(order.total, 210, "Case 2: Order total");
  }

  // CASE 3: Tax-exempt retail product (price = 100, quantity = 1, tax = 0, total = 100)
  {
    const item = calculateRetailItemTax(100, 1, false);
    assertEqual(item.lineSubtotal, 100, "Case 3: Line subtotal (100 x 1)");
    assertEqual(item.lineTax, 0, "Case 3: Line tax (tax_enabled = false)");
    assertEqual(item.lineTotal, 100, "Case 3: Line total (subtotal + 0 tax)");

    const order = calculateRetailOrderTotals([{ price: 100, quantity: 1, tax_enabled: false }], 0, 0);
    assertEqual(order.subtotal, 100, "Case 3: Order subtotal");
    assertEqual(order.taxAmount, 0, "Case 3: Order taxAmount");
    assertEqual(order.taxExemptAmount, 100, "Case 3: Order taxExemptAmount");
    assertEqual(order.total, 100, "Case 3: Order total");
    assertEqual(order.hasTaxableItems, false, "Case 3: hasTaxableItems is false");
  }

  // CASE 4: Mixed cart (taxable products + tax-exempt products -> tax only taxable products)
  {
    // 1 taxable product at 100 (qty 2) -> subtotal 200, tax 10
    // 1 tax-exempt product at 150 (qty 1) -> subtotal 150, tax 0
    // Order subtotal = 350, taxableAmount = 200, taxAmount = 10, total = 360
    const order = calculateRetailOrderTotals(
      [
        { price: 100, quantity: 2, tax_enabled: true },
        { price: 150, quantity: 1, tax_enabled: false },
      ],
      0,
      0
    );
    assertEqual(order.subtotal, 350, "Case 4: Mixed cart subtotal");
    assertEqual(order.taxableAmount, 200, "Case 4: Mixed cart taxableAmount");
    assertEqual(order.taxExemptAmount, 150, "Case 4: Mixed cart taxExemptAmount");
    assertEqual(order.taxAmount, 10, "Case 4: Mixed cart taxAmount (5% of 200 only)");
    assertEqual(order.total, 360, "Case 4: Mixed cart total (350 + 10)");
    assertEqual(order.hasTaxableItems, true, "Case 4: Mixed cart hasTaxableItems");
  }

  // CASE 5: Wholesale cart (tax = 0)
  {
    const mockProduct = {
      id: "ws-prod-1",
      is_wholesale_available: true,
      wholesale_price: 50,
      wholesale_moq: 5,
      wholesale_unit_enabled: true,
      wholesale_unit_price: 50,
      wholesale_box_enabled: false,
      wholesale_units_per_box: null,
      wholesale_box_price: null,
      wholesale_custom_quantity_enabled: true,
    };

    const wsItem = calculateWholesaleItemPrice(mockProduct, [], "unit", 10);
    assertEqual(wsItem.subtotal, 500, "Case 5: Wholesale item subtotal (10 x 50)");

    const wsSummary = calculateWholesaleOrderSubtotal([wsItem]);
    assertEqual(wsSummary.subtotal, 500, "Case 5: Wholesale order subtotal");
    assertEqual(wsSummary.totalPayable, 500, "Case 5: Wholesale order totalPayable (tax = 0)");
  }

  // CASE 6: Wholesale checkout (tax = 0, total remains existing wholesale total)
  {
    const mockBoxProduct = {
      id: "ws-prod-box",
      is_wholesale_available: true,
      wholesale_price: null,
      wholesale_moq: 1,
      wholesale_unit_enabled: false,
      wholesale_unit_price: null,
      wholesale_box_enabled: true,
      wholesale_units_per_box: 24,
      wholesale_box_price: 360,
      wholesale_custom_quantity_enabled: false,
    };

    const wsBoxItem = calculateWholesaleItemPrice(mockBoxProduct, [], "box", 2);
    assertEqual(wsBoxItem.subtotal, 720, "Case 6: Wholesale box item subtotal (2 boxes x 360)");

    const wsSummary = calculateWholesaleOrderSubtotal([wsBoxItem]);
    assertEqual(wsSummary.subtotal, 720, "Case 6: Wholesale checkout subtotal");
    assertEqual(wsSummary.totalPayable, 720, "Case 6: Wholesale checkout totalPayable remains 720");
  }

  // CASE 7: Existing products default behavior (tax_enabled defaults to true when undefined or null)
  {
    const orderWithUndefinedTax = calculateRetailOrderTotals(
      [
        { price: 120, quantity: 1 }, // tax_enabled is undefined -> defaults to true
      ],
      0,
      0
    );
    assertEqual(orderWithUndefinedTax.subtotal, 120, "Case 7: Default subtotal");
    assertEqual(orderWithUndefinedTax.taxAmount, 6, "Case 7: Default taxAmount (5% of 120)");
    assertEqual(orderWithUndefinedTax.total, 126, "Case 7: Default total (120 + 6)");
    assertEqual(orderWithUndefinedTax.hasTaxableItems, true, "Case 7: Default hasTaxableItems is true");
  }

  console.log("──────────────────────────────────────────────────");
  console.log("All 7 Retail 5% Tax Verification Cases Passed Successfully!");
  console.log("──────────────────────────────────────────────────");
}

if (typeof require !== "undefined" && require.main === module) {
  runRetailTaxTests();
}
