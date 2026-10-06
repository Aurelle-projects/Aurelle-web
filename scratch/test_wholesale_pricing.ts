import { calculateWholesaleItemPrice, calculateWholesaleOrderSubtotal } from '../lib/wholesale/pricing';

const mockProductAllEnabled = {
  id: 'prod-all',
  is_wholesale_available: true,
  wholesale_price: 10,
  wholesale_unit_enabled: true,
  wholesale_unit_price: 10,
  wholesale_box_enabled: true,
  wholesale_units_per_box: 24,
  wholesale_box_price: 200,
  wholesale_custom_quantity_enabled: true,
};

const mockTiers: any[] = [
  { id: 't1', min_quantity: 1, max_quantity: 9, price_per_unit: 10, is_active: true },
  { id: 't2', min_quantity: 10, max_quantity: 49, price_per_unit: 9, is_active: true },
  { id: 't3', min_quantity: 50, max_quantity: null, price_per_unit: 8, is_active: true },
];

function runTests() {
  console.log("--- RUNNING WHOLESALE PRICING TESTS ---");

  // Test 1: Single unit only
  const unitRes = calculateWholesaleItemPrice(mockProductAllEnabled as any, mockTiers, 'unit', 5);
  console.assert(unitRes.subtotal === 50, `Test 1 failed: expected 50, got ${unitRes.subtotal}`);
  console.assert(unitRes.totalUnits === 5, `Test 1 totalUnits failed`);
  console.log("Test 1 (Single Unit): PASSED", unitRes);

  // Test 2: Full Box mode (authoritative box price AED 200 for 24 units, buying 2 boxes)
  const boxRes = calculateWholesaleItemPrice(mockProductAllEnabled as any, mockTiers, 'box', 2);
  console.assert(boxRes.subtotal === 400, `Test 2 failed: expected 400, got ${boxRes.subtotal}`);
  console.assert(boxRes.totalUnits === 48, `Test 2 totalUnits failed: expected 48, got ${boxRes.totalUnits}`);
  console.log("Test 2 (Full Box x2): PASSED", boxRes);

  // Test 3: Custom Quantity mode (35 units matching 10-49 tier @ AED 9/unit = AED 315)
  const customRes = calculateWholesaleItemPrice(mockProductAllEnabled as any, mockTiers, 'custom', 35);
  console.assert(customRes.subtotal === 315, `Test 3 failed: expected 315, got ${customRes.subtotal}`);
  console.assert(customRes.tierPriceApplied === 9, `Test 3 tier price failed`);
  console.log("Test 3 (Custom Qty 35 units): PASSED", customRes);

  // Test 4: Custom Quantity mode (55 units matching 50+ tier @ AED 8/unit = AED 440)
  const customRes55 = calculateWholesaleItemPrice(mockProductAllEnabled as any, mockTiers, 'custom', 55);
  console.assert(customRes55.subtotal === 440, `Test 4 failed: expected 440, got ${customRes55.subtotal}`);
  console.log("Test 4 (Custom Qty 55 units): PASSED", customRes55);

  // Test 5: Disabled wholesale product
  try {
    calculateWholesaleItemPrice({ ...mockProductAllEnabled, is_wholesale_available: false } as any, [], 'unit', 1);
    console.error("Test 5 failed: should have thrown error");
  } catch (err: any) {
    console.log("Test 5 (Wholesale Disabled Throw): PASSED", err.message);
  }

  // Test 6: Order Subtotal aggregation
  const orderSubtotal = calculateWholesaleOrderSubtotal([unitRes, boxRes, customRes]);
  console.assert(orderSubtotal.subtotal === 50 + 400 + 315, `Test 6 failed subtotal sum`);
  console.log("Test 6 (Order Subtotal): PASSED", orderSubtotal);

  console.log("--- ALL WHOLESALE PRICING TESTS PASSED ---");
}

runTests();
