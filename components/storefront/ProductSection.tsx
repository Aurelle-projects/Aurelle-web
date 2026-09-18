import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";

interface ProductSectionProps {
  title: string;
  overline?: string;
  viewAllHref: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  emptyMessage: string;
  background?: "white" | "cream";
}

export default function ProductSection({
  title,
  overline,
  viewAllHref,
  products,
  emptyMessage,
  background = "white",
}: ProductSectionProps) {
  if (products.length === 0 && !emptyMessage) return null;

  return (
    <section
      className={`py-12 md:py-16 ${background === "cream" ? "bg-[#F7F5EF]" : "bg-white"}`}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8 pb-4 border-b border-[#DCCFB9]/30">
          <div>
            {overline && <p className="text-xs font-bold uppercase tracking-widest text-[#183D2B] mb-1">{overline}</p>}
            <h2
              className="font-serif text-2xl sm:text-3xl font-bold text-[#1D211F]"
              id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {title}
            </h2>
          </div>
          {products.length > 0 && (
            <Link href={viewAllHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#183D2B] hover:text-[#102D20] transition-colors">
              View all
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#5C6460]">
            <div className="text-[#8E9590] mb-3" aria-hidden="true">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" role="list" aria-label={`${title} products`}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {products.map((product: any) => (
              <div key={product.id} role="listitem">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
