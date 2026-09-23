import React from "react";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";

interface ProductSectionProps {
  title: string;
  overline?: string;
  viewAllHref?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  emptyMessage?: string;
  background?: "white" | "cream";
  showBottomButton?: boolean;
  bottomButtonText?: string;
  maxProducts?: number;
  desktopColumns?: 5 | 6;
  badge?: string;
}

export default function ProductSection({
  title,
  overline,
  viewAllHref = "/shop",
  products,
  emptyMessage = "No products found.",
  background = "white",
  showBottomButton = true,
  bottomButtonText = "All Products",
  maxProducts = 4,
  desktopColumns = 6,
  badge,
}: ProductSectionProps) {
  if (products.length === 0 && !emptyMessage) return null;

  const displayProducts = products.slice(0, maxProducts);

  return (
    <section
      className={`py-6 md:py-16 ${background === "cream" ? "bg-[#FAF6F0]" : "bg-white"}`}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-left mb-8 sm:mb-10">
          {overline && (
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#183D2B] mb-2">
              {overline}
            </p>
          )}
          <h2
            className="md:text-xl text-lg font-bold text-[#14231B] mb-6 uppercase tracking-wide"
           
          >
            {title}
          </h2>
        </div>

        {/* Product Grid: 4 products show in first tier (2 cols mobile, 4 cols desktop) */}
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[#5C6460]">
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 ${desktopColumns === 5 ? "md:grid-cols-5" : "md:grid-cols-5"} gap-4 sm:gap-6 lg:gap-8`}
            role="list"
            aria-label={`${title} products`}
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {displayProducts.map((product: any) => (
              <div key={product.id} role="listitem">
                <ProductCard
                  product={product}
                  badge={badge ?? (title.toLowerCase().includes("new arrival") ? "New Arrival" : undefined)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Bottom All Products Button (Outline rectangular button, green on hover) */}
        {showBottomButton && (
          <div className="mt-10 sm:mt-14 text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center justify-center px-9 py-3.5 border border-[#1D211F] bg-transparent text-[#1D211F] hover:bg-[#183D2B] hover:text-white hover:border-[#183D2B] text-xs sm:text-[13px] font-medium tracking-wide transition-all duration-200 rounded-none cursor-pointer"
            >
              {bottomButtonText}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
