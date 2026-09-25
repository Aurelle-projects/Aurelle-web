import React from "react";

export interface WholesaleStatItem {
  heading?: string | null;
  description?: string | null;
}

interface WholesaleStatisticsSectionProps {
  data?:
    | {
        items?: WholesaleStatItem[];
      }
    | WholesaleStatItem[]
    | null;
}

export default function WholesaleStatisticsSection({
  data,
}: WholesaleStatisticsSectionProps) {
  if (!data) return null;

  const rawItems = Array.isArray(data)
    ? data
    : Array.isArray(data.items)
    ? data.items
    : [];

  // Filter items that have at least one meaningful value, max 4
  const validItems = rawItems
    .slice(0, 4)
    .map((item) => {
      const heading = item?.heading?.trim() || "";
      const description = item?.description?.trim() || "";

      return {
        heading,
        description,
        hasContent: Boolean(heading || description),
      };
    })
    .filter((item) => item.hasContent);

  // Strictly do not render mock data if no statistics are configured
  if (validItems.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-white py-10 md:py-16 border-b border-[#EFEAE0]/60"
      aria-label="Wholesale Statistics"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`grid grid-cols-2 ${
            validItems.length >= 4
              ? "lg:grid-cols-4"
              : validItems.length === 3
              ? "lg:grid-cols-3"
              : "lg:grid-cols-2"
          } gap-3 sm:gap-6 md:gap-8`}
        >
          {validItems.map((stat, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center text-center p-3.5 sm:p-5 rounded-sm border border-[#DCCFB9]/70 bg-white sm:border-0 sm:bg-transparent sm:shadow-none sm:p-2 space-y-1.5 transition-transform duration-200"
            >
              {stat.heading && (
                <h3 className="text-2xl sm:text-3xl text-[#14231B] tracking-tight leading-none text-center">
                  {stat.heading}
                </h3>
              )}

              {stat.description && (
                <p className="text-xs sm:text-sm text-[#5C6460] leading-relaxed text-center whitespace-pre-line">
                  {stat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
