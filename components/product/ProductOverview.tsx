"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import {
  getProductHighlights,
  getProductSpecifications,
} from "@/components/product/ProductAccordions";

interface ProductOverviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any;
}

/** Splits free-text benefits into clean bullet lines (newline, bullet, or semicolon separated). */
function splitIntoBullets(text: string | null | undefined): string[] {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\r?\n|•|;|\u2022/)
    .map((s) => s.replace(/^[\s\-–—*·\d.)]+/, "").trim())
    .filter((s) => s.length > 1);
}

/**
 * Renders bullet text with bold emphasis:
 * - Markdown **bold** parsed properly
 * - "Label: Value" format renders Label: in bold (Noon style)
 * - "Label - Value" format renders Label: in bold
 * - Protects against splitting times like "2:00 PM"
 */
function BulletText({ text }: { text: string }) {
  if (!text) return null;

  // 1. Check for markdown bold syntax: **bold text**
  if (text.includes("**")) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className="font-bold text-[#1D211F]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  }

  // 2. Noon highlights pattern: "Label: Details" -> Label in bold
  // Be careful to NOT split on times like "before 2:00 PM" (verify label does not end with digit)
  const colonMatch = text.match(/^([A-Za-z][A-Za-z0-9\s/&'’–-]{1,40}):\s*(.+)$/);
  if (colonMatch && colonMatch[1] && colonMatch[2]) {
    const label = colonMatch[1].trim();
    const value = colonMatch[2].trim();
    if (!/\b\d+$/.test(label)) {
      return (
        <>
          <strong className="font-bold text-[#1D211F]">{label}:</strong>{" "}
          <span>{value}</span>
        </>
      );
    }
  }

  // 3. Dash separated: "Label - Details" -> Label: in bold
  const dashMatch = text.match(/^([A-Za-z][A-Za-z0-9\s/&'’–-]{2,40})\s*[-–—]\s*(.+)$/);
  if (dashMatch && dashMatch[1] && dashMatch[2]) {
    const label = dashMatch[1].trim();
    const value = dashMatch[2].trim();
    if (!/\b\d+$/.test(label)) {
      return (
        <>
          <strong className="font-bold text-[#1D211F]">{label}:</strong>{" "}
          <span>{value}</span>
        </>
      );
    }
  }

  return <>{text}</>;
}

/** Formats multi-paragraph description with bold lead-ins and markdown support */
function FormattedDescription({ text }: { text: string }) {
  if (!text) return null;
  const paragraphs = text.split(/\r?\n\r?\n/).filter((p) => p.trim().length > 0);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, pIdx) => {
        const lines = p.split(/\r?\n/).filter((l) => l.trim().length > 0);
        return (
          <p key={pIdx} className="text-sm 2xl:text-[15px] text-[#3F4643] leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <BulletText text={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function ReadMoreToggle({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="mt-2 inline-flex items-center gap-1.5 text-[13px] 2xl:text-sm font-semibold text-[#183D2B] hover:text-[#143223] underline decoration-[#183D2B]/40 hover:decoration-[#183D2B] cursor-pointer"
    >
      {expanded ? <Minus size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
      <span>{expanded ? "Read less" : "Read more"}</span>
    </button>
  );
}

const HIGHLIGHTS_PREVIEW_COUNT = 4;
const DESCRIPTION_PREVIEW_CHARS = 380;

export default function ProductOverview({ product }: ProductOverviewProps) {
  const [descExpanded, setDescExpanded] = useState(false);
  const [highlightsExpanded, setHighlightsExpanded] = useState(false);
  const [usageExpanded, setUsageExpanded] = useState(false);

  if (!product) return null;

  const description: string = (product.description || "").trim();
  const descIsLong =
    description.length > DESCRIPTION_PREVIEW_CHARS || description.split("\n").length > 5;

  // ── Highlights: admin "Key Benefits" lines first, then structured highlight attributes ──
  const highlightItems = getProductHighlights(product);
  const benefitsItem = highlightItems.find((h) => h.id === "benefits");
  const bullets: string[] = [
    ...splitIntoBullets(benefitsItem?.value),
    ...highlightItems
      .filter((h) => h.id !== "benefits" && h.id !== "usage")
      .map((h) => `${h.label}: ${h.value}`),
  ];
  const visibleBullets = highlightsExpanded ? bullets : bullets.slice(0, HIGHLIGHTS_PREVIEW_COUNT);
  const hasMoreBullets = bullets.length > HIGHLIGHTS_PREVIEW_COUNT;

  // ── Specifications grid (long ingredient lists get their own section) ──
  const specifications = getProductSpecifications(product).filter(
    (s) => s.label.toLowerCase() !== "ingredients"
  );

  // Split specifications into two balanced columns for Noon table layout
  const halfSpecs = Math.ceil(specifications.length / 2);
  const leftColSpecs = specifications.slice(0, halfSpecs);
  const rightColSpecs = specifications.slice(halfSpecs);

  const usage: string = (product.usage_instructions || "").trim();
  const usageIsLong = usage.length > 260 || usage.split("\n").length > 4;
  const ingredients: string = (product.ingredients || "").trim();

  // ── Shipping & Returns bullets (Admin configurable or Noon-style defaults where every line is bold) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const specs = typeof product.specifications === "object" && product.specifications !== null
    ? (product.specifications as Record<string, any>)
    : {};
  const customShipping = specs.shipping_policy || specs.shipping_returns || specs.shipping_info;

  const defaultShippingBullets = [
    "Same-Day Dispatch: Orders placed before 2:00 PM GST are processed the same day.",
    "Express UAE Delivery: Delivery across Dubai, Abu Dhabi, Sharjah & all 7 Emirates within 24–48 business hours.",
    "Flexible Payment: Cash on Delivery (COD) and all major credit/debit cards accepted.",
    "Easy Returns: 14-day hassle-free return policy for unused, unopened items.",
  ];

  const shippingBullets: string[] = customShipping
    ? splitIntoBullets(customShipping)
    : defaultShippingBullets;

  const headingClass =
    "text-base 2xl:text-lg font-bold text-[#1D211F] tracking-tight mb-3 flex items-center gap-2";
  const bodyClass = "text-sm 2xl:text-[15px] text-[#3F4643] leading-relaxed";

  return (
    <section
      aria-label="Product overview"
      className="bg-white rounded-none border border-[#DCCFB9]/60 p-6 md:p-8 2xl:p-10 shadow-xs"
      data-testid="pdp-overview"
    >
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DCCFB9]/40">
        <div>
          <h2 className="text-lg 2xl:text-xl font-bold text-[#1D211F] tracking-tight">
            Product Overview
          </h2>
          <p className="text-xs 2xl:text-[13px] text-[#8E9590] mt-0.5">
            Key highlights, detailed specifications, and usage instructions
          </p>
        </div>
      </div>

      <div className="max-w-4xl 2xl:max-w-5xl space-y-9">
        {/* ── 1. Highlights (Noon style: bold feature label, bullet list) ── */}
        {bullets.length > 0 && (
          <div>
            <h3 className={headingClass}>Highlights</h3>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {visibleBullets.map((b, idx) => (
                <li key={idx} className={`${bodyClass} flex items-start gap-2.5`}>
                  <span
                    className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[#183D2B] shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    <BulletText text={b} />
                  </span>
                </li>
              ))}
            </ul>
            {hasMoreBullets && (
              <ReadMoreToggle
                expanded={highlightsExpanded}
                onClick={() => setHighlightsExpanded((v) => !v)}
              />
            )}
          </div>
        )}

        {/* ── 2. Specifications (Noon style: 2-column alternating table with bold values) ── */}
        {specifications.length > 0 && (
          <div>
            <h3 className={headingClass}>Specifications</h3>
            <div className="border border-[#DCCFB9]/60 overflow-hidden bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#DCCFB9]/50">
                {/* Column 1 */}
                <div className="divide-y divide-[#DCCFB9]/40">
                  {leftColSpecs.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start justify-between gap-3 py-2.5 px-4 ${
                        idx % 2 === 0 ? "bg-[#FAF8F5]/80" : "bg-white"
                      }`}
                    >
                      <span className="text-xs 2xl:text-[13px] text-[#6B726E] font-medium shrink-0 w-2/5">
                        {item.label}
                      </span>
                      <span className="text-xs 2xl:text-[13px] font-bold text-[#1D211F] text-right w-3/5 break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Column 2 */}
                <div className="divide-y divide-[#DCCFB9]/40">
                  {rightColSpecs.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start justify-between gap-3 py-2.5 px-4 ${
                        idx % 2 === 0 ? "bg-[#FAF8F5]/80" : "bg-white"
                      }`}
                    >
                      <span className="text-xs 2xl:text-[13px] text-[#6B726E] font-medium shrink-0 w-2/5">
                        {item.label}
                      </span>
                      <span className="text-xs 2xl:text-[13px] font-bold text-[#1D211F] text-right w-3/5 break-words">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Description (Rich paragraphs with bold keywords & Read more) ── */}
        <div>
          <h3 className={headingClass}>Description</h3>
          {description ? (
            <>
              <div
                className={`transition-all ${
                  descIsLong && !descExpanded ? "line-clamp-4 overflow-hidden" : ""
                }`}
              >
                <FormattedDescription text={description} />
              </div>
              {descIsLong && (
                <ReadMoreToggle
                  expanded={descExpanded}
                  onClick={() => setDescExpanded((v) => !v)}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-[#8E9590]">No detailed description provided.</p>
          )}
        </div>

        {/* ── 4. How to Use ──────────────────────────────────────────────── */}
        {usage && (
          <div>
            <h3 className={headingClass}>How to Use</h3>
            <div
              className={`transition-all ${
                usageIsLong && !usageExpanded ? "line-clamp-4 overflow-hidden" : ""
              }`}
            >
              <FormattedDescription text={usage} />
            </div>
            {usageIsLong && (
              <ReadMoreToggle
                expanded={usageExpanded}
                onClick={() => setUsageExpanded((v) => !v)}
              />
            )}
          </div>
        )}

        {/* ── 5. Ingredients ─────────────────────────────────────────────── */}
        {ingredients && (
          <div>
            <h3 className={headingClass}>Ingredients</h3>
            <p className="text-[13px] 2xl:text-sm text-[#3F4643] leading-relaxed bg-[#FAF8F5] p-4 border border-[#DCCFB9]/40">
              {ingredients}
            </p>
          </div>
        )}

        {/* ── 6. Shipping & Returns (All points bold lead-in titles) ──────── */}
        <div>
          <h3 className={headingClass}>Shipping &amp; Returns</h3>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {shippingBullets.map((line, idx) => (
              <li key={idx} className={`${bodyClass} flex items-start gap-2.5`}>
                <span
                  className="mt-[8px] w-1.5 h-1.5 rounded-full bg-[#183D2B] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  <BulletText text={line} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
