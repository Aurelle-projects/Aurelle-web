import React from "react";
import CategoryGrid, { CategoryItem } from "@/components/storefront/CategoryGrid";

interface CategorySectionProps {
  categories: CategoryItem[];
}

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="bg-white py-12 md:py-16 relative overflow-hidden" aria-labelledby="categories-heading">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-start mb-8 sm:mb-10">
          <h2
            id="categories-heading"
            className="md:text-xl text-lg font-bold text-[#14231B] sm:text-center text-start mb-6 px-4 uppercase tracking-wide"
          >
            Shop by Category
          </h2>
        </div>
        <CategoryGrid categories={categories} />
      </div>
    </section>
  );
}
