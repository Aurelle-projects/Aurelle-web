"use client";

import React, { useState, useId } from "react";
import {
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Droplets,
  Target,
  Clock,
} from "lucide-react";

interface HighlightItem {
  id: string;
  label: string;
  value: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}

interface SpecificationItem {
  label: string;
  value: string;
}

interface ProductAccordionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
}

/**
 * Normalizes string values, strictly excluding undefined, null, empty strings,
 * or generic placeholder text (e.g. "Verify on packaging").
 */
function cleanValue(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower.includes("verify on your product packaging") ||
    lower.includes("verify on packaging")
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Case- and delimiter-agnostic lookup in specifications object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSpecValue(specs: Record<string, any>, targetKey: string): string | null {
  if (!specs || typeof specs !== "object") return null;
  const normalizedTarget = targetKey.toLowerCase().replace(/[\s_-]+/g, "");
  for (const [k, v] of Object.entries(specs)) {
    const normalizedKey = k.toLowerCase().replace(/[\s_-]+/g, "");
    if (normalizedKey === normalizedTarget) {
      return cleanValue(
        typeof v === "string" ? v : typeof v === "number" ? String(v) : null
      );
    }
  }
  return null;
}

/**
 * Extracts structured key-values from description if present (e.g. "Brand: ...\nNet volume: ...")
 */
function parseDescriptionKeyValues(description: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!description) return result;

  const lines = description.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Za-z\s]+):\s*(.+)$/);
    if (match && match[1] && match[2]) {
      const key = match[1].trim().toLowerCase();
      const val = match[2].trim();
      if (val) {
        result[key] = val;
      }
    }
  }
  return result;
}

/**
 * Extracts available product highlights based solely on real product data.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProductHighlights(product: any): HighlightItem[] {
  if (!product) return [];

  const desc = product.description || "";
  const specs =
    typeof product.specifications === "object" && product.specifications !== null
      ? product.specifications
      : {};
  const descKV = parseDescriptionKeyValues(desc);
  const items: HighlightItem[] = [];

  // 1. Key Benefits
  const benefits =
    cleanValue(product.benefits) ||
    getSpecValue(specs, "benefits") ||
    getSpecValue(specs, "key_benefits") ||
    cleanValue(descKV["benefits"]);
  if (benefits) {
    items.push({
      id: "benefits",
      label: "Key Benefits",
      value: benefits,
      icon: Sparkles,
    });
  }

  // 2. Skin Type / Suitable For
  const skinType =
    getSpecValue(specs, "skin_type") ||
    getSpecValue(specs, "suitable_for") ||
    cleanValue(descKV["suitable for"]) ||
    cleanValue(descKV["skin types"]) ||
    cleanValue(descKV["skin type"]);
  if (skinType) {
    items.push({
      id: "skin_type",
      label: "Skin Type",
      value: skinType,
      icon: ShieldCheck,
    });
  }

  // 3. Main Ingredients
  let mainIngredients =
    getSpecValue(specs, "key_ingredients") ||
    getSpecValue(specs, "main_ingredients") ||
    cleanValue(descKV["key ingredients"]);

  if (!mainIngredients && product.ingredients && typeof product.ingredients === "string") {
    // Check if ingredients has numbered lines (e.g. "1. Ceramides...")
    const numberedMatches = [
      ...product.ingredients.matchAll(/(?:^|\n)\d+\.\s*([^\n\r]+)/g),
    ];
    if (numberedMatches.length > 0) {
      mainIngredients = numberedMatches
        .slice(0, 3)
        .map((m) => m[1].trim())
        .join(", ");
    } else {
      // Check comma list of active ingredients
      const rawParts = product.ingredients
        .split(",")
        .map((s: string) => s.trim().replace(/^Use the exact ingredient list.*$/i, ""))
        .filter(
          (s: string) => s.length > 0 && !s.toLowerCase().includes("ingredient list")
        );
      if (rawParts.length > 0) {
        mainIngredients = rawParts.slice(0, 3).join(", ");
      }
    }
  }

  if (mainIngredients) {
    items.push({
      id: "ingredients",
      label: "Main Ingredients",
      value: mainIngredients,
      icon: Droplets,
    });
  }

  // 4. Target Concerns / Purpose
  const concerns =
    getSpecValue(specs, "concerns") ||
    getSpecValue(specs, "skin_concerns") ||
    getSpecValue(specs, "target_concerns") ||
    cleanValue(descKV["skin concerns"]) ||
    cleanValue(descKV["skin concern"]) ||
    cleanValue(descKV["product purpose"]) ||
    cleanValue(descKV["finish"]);
  if (concerns) {
    items.push({
      id: "concerns",
      label: "Target Concerns",
      value: concerns,
      icon: Target,
    });
  }

  // 5. Usage Instructions Highlight
  let usageSummary: string | null = null;
  if (product.usage_instructions && typeof product.usage_instructions === "string") {
    const rawLines = product.usage_instructions
      .split("\n")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (rawLines.length > 0) {
      const firstLineClean = rawLines[0]
        .replace(/^(?:Step\s*\d+\s*[—–-]\s*|\d+\.\s*)/i, "")
        .trim();

      if (firstLineClean.length > 10) {
        usageSummary = firstLineClean;
      } else if (rawLines.length > 1) {
        // If first line was just "Cleanse" or short header, combine with second line
        const secondLineClean = rawLines[1]
          .replace(/^(?:Step\s*\d+\s*[—–-]\s*|\d+\.\s*)/i, "")
          .trim();
        usageSummary = `${firstLineClean} — ${secondLineClean}`;
      } else {
        usageSummary = firstLineClean;
      }
    }
  }

  if (usageSummary) {
    items.push({
      id: "usage",
      label: "Usage",
      value: usageSummary,
      icon: Clock,
    });
  }

  return items;
}

/**
 * Extracts available product specifications in label-value format.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getProductSpecifications(product: any): SpecificationItem[] {
  if (!product) return [];

  const desc = product.description || "";
  const specs =
    typeof product.specifications === "object" && product.specifications !== null
      ? product.specifications
      : {};
  const descKV = parseDescriptionKeyValues(desc);
  const items: SpecificationItem[] = [];

  // 1. Brand
  const brandName = cleanValue(
    Array.isArray(product.brand) ? product.brand[0]?.name : product.brand?.name
  );
  if (brandName) {
    items.push({ label: "Brand", value: brandName });
  }

  // 2. Product Name
  const productName = cleanValue(product.name);
  if (productName) {
    items.push({ label: "Product Name", value: productName });
  }

  // 3. SKU
  const sku = cleanValue(product.sku);
  if (sku) {
    items.push({ label: "SKU", value: sku });
  }

  // 4. Category
  const categoryName = cleanValue(
    Array.isArray(product.category)
      ? product.category[0]?.name
      : product.category?.name
  );
  if (categoryName) {
    items.push({ label: "Category", value: categoryName });
  }

  // 5. Product Type / Subcategory (if distinct from Category)
  const subcategoryName =
    cleanValue(
      Array.isArray(product.subcategory)
        ? product.subcategory[0]?.name
        : product.subcategory?.name
    ) || cleanValue(descKV["product type"]);

  if (subcategoryName && subcategoryName.toLowerCase() !== categoryName?.toLowerCase()) {
    items.push({ label: "Product Type", value: subcategoryName });
  }

  // Track normalized labels already present to avoid duplication
  const addedNormalizedLabels = new Set(
    items.map((it) => it.label.toLowerCase().replace(/[\s_-]+/g, ""))
  );

  // 6. Direct Admin Key-Value Pairs from specifications JSON (excluding internal IDs)
  for (const [key, val] of Object.entries(specs)) {
    const normKey = key.toLowerCase().replace(/[\s_-]+/g, "");
    if (normKey === "subcategoryid" || normKey === "id") continue;

    const cleanV = cleanValue(
      typeof val === "string" ? val : typeof val === "number" ? String(val) : null
    );
    if (cleanV) {
      items.push({ label: key.trim(), value: cleanV });
      addedNormalizedLabels.add(normKey);
    }
  }

  // 7. Size / Volume fallback if not already provided in admin specs
  const hasSize =
    addedNormalizedLabels.has("size") ||
    addedNormalizedLabels.has("volume") ||
    addedNormalizedLabels.has("sizevolume") ||
    addedNormalizedLabels.has("netvolume") ||
    addedNormalizedLabels.has("netweight");

  if (!hasSize) {
    let sizeOrVolume = cleanValue(descKV["net volume"]) || cleanValue(descKV["net weight"]);
    if (!sizeOrVolume && product.name) {
      const sizeMatch = product.name.match(
        /(\d+(?:\.\d+)?\s*(?:ml|g|fl\s*oz|oz|l))\b/i
      );
      if (sizeMatch && sizeMatch[1]) {
        sizeOrVolume = sizeMatch[1].trim();
      }
    }
    if (sizeOrVolume) {
      items.push({ label: "Size / Volume", value: sizeOrVolume });
      addedNormalizedLabels.add("sizevolume");
    }
  }

  // 8. Country of Origin fallback if not in admin specs
  const hasOrigin =
    addedNormalizedLabels.has("countryoforigin") || addedNormalizedLabels.has("origin");
  if (!hasOrigin) {
    const countryOfOrigin = cleanValue(descKV["country of origin"]);
    if (countryOfOrigin) {
      items.push({ label: "Country of Origin", value: countryOfOrigin });
      addedNormalizedLabels.add("countryoforigin");
    }
  }

  // 9. Ingredients (Full or reference list) fallback if not in admin specs
  const hasIngredients =
    addedNormalizedLabels.has("ingredients") ||
    addedNormalizedLabels.has("keyingredients") ||
    addedNormalizedLabels.has("formulation");
  if (!hasIngredients) {
    const ingredients = cleanValue(product.ingredients);
    if (ingredients) {
      items.push({ label: "Ingredients", value: ingredients });
    }
  }

  return items;
}

export default function ProductAccordions({ product }: ProductAccordionsProps) {
  const baseId = useId();
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);

  const highlights = getProductHighlights(product);
  const specifications = getProductSpecifications(product);

  const highlightsTriggerId = `${baseId}-highlights-trigger`;
  const highlightsPanelId = `${baseId}-highlights-panel`;
  const specsTriggerId = `${baseId}-specs-trigger`;
  const specsPanelId = `${baseId}-specs-panel`;

  // If both sections have no data (e.g. invalid product), do not render empty container
  if (highlights.length === 0 && specifications.length === 0) {
    return null;
  }

  return (
    <div
      className="border border-[#DCCFB9]/60 bg-white rounded-none shadow-xs divide-y divide-[#DCCFB9]/40 w-full"
      data-testid="pdp-accordions"
    >
      {/* ── Section A: Product Highlights ─────────────────────────────────── */}
      {highlights.length > 0 && (
        <div className="transition-colors">
          <h3>
            <button
              type="button"
              id={highlightsTriggerId}
              aria-expanded={highlightsOpen}
              aria-controls={highlightsPanelId}
              onClick={() => setHighlightsOpen((prev) => !prev)}
              className="w-full py-3.5 px-4 sm:px-5 flex items-center justify-between text-left gap-4 hover:bg-[#FAF8F5]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183D2B] focus-visible:ring-offset-2 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#1D211F] group-hover:text-[#183D2B] transition-colors">
                Product Highlights
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2}
                className={`text-[#5C6460] group-hover:text-[#183D2B] shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  highlightsOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              />
            </button>
          </h3>

          <div
            id={highlightsPanelId}
            role="region"
            aria-labelledby={highlightsTriggerId}
            aria-hidden={!highlightsOpen}
            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
              highlightsOpen ? "grid-rows-[1fr] visible" : "grid-rows-[0fr] invisible"
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-[#DCCFB9]/30">
                <ul className="space-y-3 list-none p-0 m-0">
                  {highlights.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <li key={item.id} className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 p-1 rounded-xs bg-[#FAF8F5] border border-[#DCCFB9]/40 text-[#183D2B] shrink-0 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <IconComponent size={13} strokeWidth={2} />
                        </span>
                        <div className="text-xs leading-relaxed">
                          <span className="font-semibold text-[#1D211F]">
                            {item.label}:{" "}
                          </span>
                          <span className="text-[#5C6460]">{item.value}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section B: Product Specifications ─────────────────────────────── */}
      {specifications.length > 0 && (
        <div className="transition-colors">
          <h3>
            <button
              type="button"
              id={specsTriggerId}
              aria-expanded={specsOpen}
              aria-controls={specsPanelId}
              onClick={() => setSpecsOpen((prev) => !prev)}
              className="w-full py-3.5 px-4 sm:px-5 flex items-center justify-between text-left gap-4 hover:bg-[#FAF8F5]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#183D2B] focus-visible:ring-offset-2 transition-colors cursor-pointer group"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-[#1D211F] group-hover:text-[#183D2B] transition-colors">
                Product Specifications
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2}
                className={`text-[#5C6460] group-hover:text-[#183D2B] shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  specsOpen ? "rotate-180" : "rotate-0"
                }`}
                aria-hidden="true"
              />
            </button>
          </h3>

          <div
            id={specsPanelId}
            role="region"
            aria-labelledby={specsTriggerId}
            aria-hidden={!specsOpen}
            className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
              specsOpen ? "grid-rows-[1fr] visible" : "grid-rows-[0fr] invisible"
            }`}
          >
            <div className="overflow-hidden">
              <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-[#DCCFB9]/30">
                <dl className="divide-y divide-[#DCCFB9]/30 text-xs">
                  {specifications.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 first:pt-1 last:pb-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-start"
                    >
                      <dt className="font-semibold text-[#1D211F] sm:col-span-1">
                        {item.label}
                      </dt>
                      <dd className="text-[#5C6460] sm:col-span-2 break-words leading-relaxed whitespace-pre-line">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
