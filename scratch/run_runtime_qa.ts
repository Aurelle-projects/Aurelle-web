import { calculateRetailItemTax, calculateRetailOrderTotals } from "./lib_pricing_retail_wrapper.ts";
import { calculateWholesaleItemPrice, calculateWholesaleOrderSubtotal, calculateAdminBoxPricing } from "./lib_wholesale_pricing_wrapper.ts";
import { hashAdminPassword, verifyAdminPassword, safeCompare } from "./lib_auth_admin_wrapper.ts";
import fs from "fs";
import path from "path";

interface TestResult {
  id: string;
  scenario: string;
  expected: string;
  actual: string;
  status: "VERIFIED" | "FAILED";
  evidence: string;
}

const results: TestResult[] = [];

function recordTest(id: string, scenario: string, expected: string, actual: string, passed: boolean, evidence: unknown) {
  results.push({
    id,
    scenario,
    expected,
    actual,
    status: passed ? "VERIFIED" : "FAILED",
    evidence: typeof evidence === "object" ? JSON.stringify(evidence) : String(evidence),
  });
}

// ============================================================
// SUITE 1: RETAIL PRICING & 5% UAE VAT
// ============================================================
try {
  const item1 = calculateRetailItemTax(100, 2, true);
  const pass1 = item1.lineSubtotal === 200 && item1.lineTax === 10 && item1.lineTotal === 210;
  recordTest("RET-PRC-01", "Standard taxable retail line item (100 AED x 2 @ 5% VAT)", 
    "lineSubtotal=200, lineTax=10, lineTotal=210", 
    `lineSubtotal=${item1.lineSubtotal}, lineTax=${item1.lineTax}, lineTotal=${item1.lineTotal}`, 
    pass1, item1);

  const item2 = calculateRetailItemTax(100, 2, false);
  const pass2 = item2.lineSubtotal === 200 && item2.lineTax === 0 && item2.lineTotal === 200;
  recordTest("RET-PRC-02", "Tax-exempt retail line item (tax_enabled: false)", 
    "lineSubtotal=200, lineTax=0, lineTotal=200", 
    `lineSubtotal=${item2.lineSubtotal}, lineTax=${item2.lineTax}, lineTotal=${item2.lineTotal}`, 
    pass2, item2);

  const item3 = calculateRetailItemTax(49.95, 3, true);
  const pass3 = item3.lineSubtotal === 149.85 && item3.lineTax === 7.49 && item3.lineTotal === 157.34;
  recordTest("RET-PRC-03", "Fractional currency 49.95 AED x 3 rounding precision", 
    "lineSubtotal=149.85, lineTax=7.49, lineTotal=157.34", 
    `lineSubtotal=${item3.lineSubtotal}, lineTax=${item3.lineTax}, lineTotal=${item3.lineTotal}`, 
    pass3, item3);

  const orderUnder = calculateRetailOrderTotals([
    { price: 50, quantity: 2, tax_enabled: true }
  ], 20, 0);
  const pass4 = orderUnder.subtotal === 100 && orderUnder.shippingAmount === 20 && orderUnder.taxAmount === 5 && orderUnder.total === 125;
  recordTest("RET-SHP-01", "Order subtotal < 199 AED incurs 20 AED shipping fee", 
    "subtotal=100, shipping=20, tax=5, total=125", 
    `subtotal=${orderUnder.subtotal}, shipping=${orderUnder.shippingAmount}, tax=${orderUnder.taxAmount}, total=${orderUnder.total}`, 
    pass4, orderUnder);

  const orderExact = calculateRetailOrderTotals([
    { price: 199, quantity: 1, tax_enabled: true }
  ], 0, 0);
  const pass5 = orderExact.subtotal === 199 && orderExact.shippingAmount === 0 && orderExact.taxAmount === 9.95 && orderExact.total === 208.95;
  recordTest("RET-SHP-02", "Order subtotal exactly 199 AED receives Free Shipping (0 AED)", 
    "subtotal=199, shipping=0, tax=9.95, total=208.95", 
    `subtotal=${orderExact.subtotal}, shipping=${orderExact.shippingAmount}, tax=${orderExact.taxAmount}, total=${orderExact.total}`, 
    pass5, orderExact);

  const orderMixed = calculateRetailOrderTotals([
    { price: 100, quantity: 1, tax_enabled: true },
    { price: 150, quantity: 1, tax_enabled: false }
  ], 0, 25);
  const pass6 = orderMixed.subtotal === 250 && orderMixed.taxableAmount === 100 && orderMixed.taxExemptAmount === 150 && orderMixed.taxAmount === 5 && orderMixed.total === 230;
  recordTest("RET-PRC-04", "Mixed taxable/exempt order with 25 AED coupon discount", 
    "subtotal=250, taxable=100, taxExempt=150, tax=5, discount=25, total=230", 
    `subtotal=${orderMixed.subtotal}, taxable=${orderMixed.taxableAmount}, taxExempt=${orderMixed.taxExemptAmount}, tax=${orderMixed.taxAmount}, total=${orderMixed.total}`, 
    pass6, orderMixed);

  const itemNegative = calculateRetailItemTax(100, -5, true);
  const pass7 = itemNegative.lineSubtotal === 0 && itemNegative.lineTax === 0 && itemNegative.lineTotal === 0;
  recordTest("SEC-TMP-01", "Negative quantity clamped to 0 in pricing calculation", 
    "lineSubtotal=0, lineTax=0, lineTotal=0", 
    `lineSubtotal=${itemNegative.lineSubtotal}, lineTax=${itemNegative.lineTax}, lineTotal=${itemNegative.lineTotal}`, 
    pass7, itemNegative);

  const itemNegativePrice = calculateRetailItemTax(-100, 2, true);
  const pass8 = itemNegativePrice.lineSubtotal === 0 && itemNegativePrice.lineTax === 0 && itemNegativePrice.lineTotal === 0;
  recordTest("SEC-TMP-02", "Negative unit price clamped to 0 in pricing calculation", 
    "lineSubtotal=0, lineTax=0, lineTotal=0", 
    `lineSubtotal=${itemNegativePrice.lineSubtotal}, lineTax=${itemNegativePrice.lineTax}, lineTotal=${itemNegativePrice.lineTotal}`, 
    pass8, itemNegativePrice);

} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  recordTest("RET-PRC-ERR", "Retail pricing suite exception", "No crash", msg, false, err);
}

// ============================================================
// SUITE 2: WHOLESALE MULTI-MODE PRICING
// ============================================================
try {
  const dummyProduct = {
    id: "prod-100",
    is_wholesale_available: true,
    wholesale_price: 50,
    wholesale_moq: 10,
    wholesale_unit_enabled: true,
    wholesale_unit_price: 50,
    wholesale_box_enabled: true,
    wholesale_units_per_box: 12,
    wholesale_box_price: 540,
    wholesale_custom_quantity_enabled: true,
  };

  const dummyTiers = [
    { id: "tier-1", product_id: "prod-100", min_quantity: 10, max_quantity: 49, price_per_unit: 50, is_active: true, created_at: "", updated_at: "" },
    { id: "tier-2", product_id: "prod-100", min_quantity: 50, max_quantity: 99, price_per_unit: 45, is_active: true, created_at: "", updated_at: "" },
    { id: "tier-3", product_id: "prod-100", min_quantity: 100, max_quantity: null, price_per_unit: 40, is_active: true, created_at: "", updated_at: "" },
  ];

  let moqRejected = false;
  try {
    calculateWholesaleItemPrice(dummyProduct, dummyTiers, "unit", 5);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    moqRejected = msg.includes("below product MOQ");
  }
  recordTest("WHS-MOQ-01", "Wholesale unit purchase below MOQ (qty 5 < MOQ 10) throws Error", 
    "Throws 'below product MOQ'", 
    moqRejected ? "Error correctly thrown" : "Failed to reject", 
    moqRejected, { qty: 5, moq: 10 });

  const wsExactMoq = calculateWholesaleItemPrice(dummyProduct, dummyTiers, "unit", 10);
  const pass10 = wsExactMoq.quantity === 10 && wsExactMoq.effectiveUnitPrice === 50 && wsExactMoq.subtotal === 500;
  recordTest("WHS-PRC-01", "Wholesale unit purchase at exact MOQ (10 units @ 50 AED)", 
    "quantity=10, effectiveUnitPrice=50, subtotal=500", 
    `quantity=${wsExactMoq.quantity}, effectiveUnitPrice=${wsExactMoq.effectiveUnitPrice}, subtotal=${wsExactMoq.subtotal}`, 
    pass10, wsExactMoq);

  const wsTier2 = calculateWholesaleItemPrice(dummyProduct, dummyTiers, "unit", 50);
  const pass11 = wsTier2.quantity === 50 && wsTier2.effectiveUnitPrice === 45 && wsTier2.subtotal === 2250;
  recordTest("WHS-PRC-02", "Wholesale volume tier matching (50 units @ Tier 2: 45 AED)", 
    "quantity=50, effectiveUnitPrice=45, subtotal=2250", 
    `quantity=${wsTier2.quantity}, effectiveUnitPrice=${wsTier2.effectiveUnitPrice}, subtotal=${wsTier2.subtotal}`, 
    pass11, wsTier2);

  const wsBox = calculateWholesaleItemPrice(dummyProduct, dummyTiers, "box", 2);
  const pass12 = wsBox.quantity === 2 && wsBox.totalUnits === 24 && wsBox.effectiveUnitPrice === 540 && wsBox.subtotal === 1080;
  recordTest("WHS-BOX-01", "Wholesale Full Box calculation (2 boxes of 12 units @ 540 AED/box)", 
    "quantity=2, totalUnits=24, effectiveUnitPrice=540, subtotal=1080", 
    `quantity=${wsBox.quantity}, totalUnits=${wsBox.totalUnits}, effectiveUnitPrice=${wsBox.effectiveUnitPrice}, subtotal=${wsBox.subtotal}`, 
    pass12, wsBox);

  const boxDisabledProd = { ...dummyProduct, wholesale_box_enabled: false };
  let boxDisabledRejected = false;
  try {
    calculateWholesaleItemPrice(boxDisabledProd, dummyTiers, "box", 1);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    boxDisabledRejected = msg.includes("Full box purchase mode is disabled");
  }
  recordTest("WHS-BOX-02", "Full box mode rejected when wholesale_box_enabled is false", 
    "Throws 'Full box purchase mode is disabled'", 
    boxDisabledRejected ? "Error correctly thrown" : "Failed to reject", 
    boxDisabledRejected, {});

  const wsOrderSubtotal = calculateWholesaleOrderSubtotal([wsExactMoq, wsTier2, wsBox]);
  const expectedWsTotal = 500 + 2250 + 1080;
  const pass14 = wsOrderSubtotal.subtotal === expectedWsTotal && wsOrderSubtotal.totalPayable === expectedWsTotal;
  recordTest("WHS-ORD-01", "Wholesale multi-item aggregate order subtotal calculation", 
    `subtotal=${expectedWsTotal}, totalPayable=${expectedWsTotal}`, 
    `subtotal=${wsOrderSubtotal.subtotal}, totalPayable=${wsOrderSubtotal.totalPayable}`, 
    pass14, wsOrderSubtotal);

  const boxAnalysis = calculateAdminBoxPricing(12, 50, 540);
  const pass15 = boxAnalysis.calculatedValue === 600 && boxAnalysis.diff === 60 && boxAnalysis.percentage === 10 && boxAnalysis.isLower === true;
  recordTest("ADM-BOX-01", "Admin box pricing comparison helper (12 units @ 50 = 600 vs 540 box = 10% lower)", 
    "calculatedValue=600, diff=60, percentage=10, isLower=true", 
    `calculatedValue=${boxAnalysis.calculatedValue}, diff=${boxAnalysis.diff}, percentage=${boxAnalysis.percentage}, isLower=${boxAnalysis.isLower}`, 
    pass15, boxAnalysis);

} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  recordTest("WHS-PRC-ERR", "Wholesale pricing suite exception", "No crash", msg, false, err);
}

// ============================================================
// SUITE 3: AUTHENTICATION CRYPTO
// ============================================================
try {
  const { salt, hash } = hashAdminPassword("SecureTestPass!2026");
  const validVerification = verifyAdminPassword("SecureTestPass!2026", salt, hash);
  const invalidVerification = verifyAdminPassword("WrongPassword", salt, hash);
  const pass16 = validVerification === true && invalidVerification === false;
  recordTest("AUT-SCR-01", "Admin password scrypt hash and constant-time verification", 
    "valid=true, invalid=false", 
    `valid=${validVerification}, invalid=${invalidVerification}`, 
    pass16, { saltLength: salt.length, hashLength: hash.length });

  const matchSafe = safeCompare("admin@aurelle.ae", "admin@aurelle.ae");
  const mismatchSafe = safeCompare("admin@aurelle.ae", "hacker@evil.com");
  const pass17 = matchSafe === true && mismatchSafe === false;
  recordTest("AUT-CMP-01", "safeCompare constant-time string comparison", 
    "match=true, mismatch=false", 
    `match=${matchSafe}, mismatch=${mismatchSafe}`, 
    pass17, {});

} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  recordTest("AUT-CRYPTO-ERR", "Admin crypto suite exception", "No crash", msg, false, err);
}

// ============================================================
// SUITE 4: SECURITY HEADERS AUDIT
// ============================================================
try {
  const nextConfigContent = fs.readFileSync(path.resolve("next.config.ts"), "utf8");
  const hasNosniff = nextConfigContent.includes("X-Content-Type-Options") && nextConfigContent.includes("nosniff");
  const hasFrameDeny = nextConfigContent.includes("X-Frame-Options") && nextConfigContent.includes("DENY");
  const hasHSTS = nextConfigContent.includes("Strict-Transport-Security") && nextConfigContent.includes("max-age=63072000");
  const hasPermPolicy = nextConfigContent.includes("Permissions-Policy");
  const hasXSS = nextConfigContent.includes("X-XSS-Protection");

  const pass18 = hasNosniff && hasFrameDeny && hasHSTS && hasPermPolicy && hasXSS;
  recordTest("SEC-HDR-01", "next.config.ts security headers declaration (nosniff, frame DENY, HSTS, Permissions)", 
    "All 5 headers configured", 
    pass18 ? "All 5 headers present" : "Missing headers", 
    pass18, { hasNosniff, hasFrameDeny, hasHSTS, hasPermPolicy, hasXSS });
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  recordTest("SEC-HDR-ERR", "Security headers inspection exception", "No crash", msg, false, err);
}

// ============================================================
// SUITE 5: SECRET LEAK SCANNER
// ============================================================
try {
  let secretFoundInClient = false;
  const filesToScan = ["app/layout.tsx", "app/error.tsx", "middleware.ts", "next.config.ts"];
  
  for (const f of filesToScan) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, "utf8");
      if (/sk_live_[0-9a-zA-Z]{24}/.test(content) || /whsec_[0-9a-zA-Z]{32}/.test(content)) {
        secretFoundInClient = true;
      }
    }
  }

  recordTest("SEC-LEAK-01", "Source code scan for hardcoded live Stripe secrets", 
    "NOT FOUND", 
    secretFoundInClient ? "FOUND" : "NOT FOUND", 
    !secretFoundInClient, {});
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  recordTest("SEC-LEAK-ERR", "Secret leak scan exception", "No crash", msg, false, err);
}

console.log("\n========================================================");
console.log("            AURELLE RUNTIME QA TEST RESULTS              ");
console.log("========================================================\n");
console.table(results.map(r => ({ ID: r.id, Scenario: r.scenario, Status: r.status, Actual: r.actual })));

const passedCount = results.filter(r => r.status === "VERIFIED").length;
const totalCount = results.length;
console.log(`\nTOTAL: ${passedCount}/${totalCount} TESTS VERIFIED (${Math.round((passedCount/totalCount)*100)}%)\n`);
