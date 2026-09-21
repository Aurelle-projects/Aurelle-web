import React from "react";
import CategoryGrid, { CategoryItem } from "@/components/storefront/CategoryGrid";

interface CategorySectionProps {
  categories: CategoryItem[];
}

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="bg-white py-12 md:py-16 relative overflow-hidden" aria-labelledby="categories-heading">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2
            id="categories-heading"
            className="text-2xl sm:text-3xl text-[#1D211F] tracking-tight uppercase font-bold"
          >
            Shop by Category
          </h2>
        </div>
        <CategoryGrid categories={categories} />
      </div>
    </section>
  );
}
