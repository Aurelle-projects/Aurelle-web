import React from "react";
import Link from "next/link";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "All Categories | Aurelle Cosmetics Trading FZ-LLC",
  description:
    "Explore our 10 official product categories: Cosmetics, Skincare, Hair Care, Fragrances, Baby Care, Wellness, and more.",
};

export default async function CategoriesPage() {
  // Try to load real category data (with product counts) from Supabase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbCategories: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, image_public_id, sort_order")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });
    if (data && data.length > 0) dbCategories = data;
  } catch {
    // Fallback to static definitions
  }

  // Merge static definitions with DB data (DB wins for images)
  const categories = AURELLE_CATEGORIES.map((staticCat) => {
    const dbCat = dbCategories.find((d: { slug: string }) => d.slug === staticCat.slug);
    return {
      ...staticCat,
      id: dbCat?.id ?? staticCat.slug,
      image_url: dbCat?.image_url ?? null,
      image_public_id: dbCat?.image_public_id ?? null,
    };
  });

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-[#DCCFB9]/40 py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-[#183D2B] mb-2">
            The Essentials System
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1D211F] tracking-tight mb-3">
            10 Distinct Categories
          </h1>
          <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed max-w-xl mx-auto">
            Everyday beauty, personal care and lifestyle formulations tailored
            for modern living across the United Arab Emirates.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {categories.map((category) => {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";
            const imageUrl = category.image_public_id
              ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600,h_400,c_fill,g_auto/${category.image_public_id}`
              : category.image_url ?? null;

            return (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="group bg-white rounded-2xl border border-[#DCCFB9]/50 shadow-xs overflow-hidden hover:shadow-lg hover:border-[#183D2B]/30 transition-all duration-300"
              >
                {/* Category image / gradient placeholder */}
                <div className="relative h-40 bg-gradient-to-br from-[#F4EDE2] to-[#E5D8C8] overflow-hidden">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="font-serif text-5xl font-bold text-[#183D2B]/20 select-none group-hover:text-[#183D2B]/35 transition-colors">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Number badge */}
                  <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-[#183D2B] text-[11px] font-extrabold flex items-center justify-center shadow-sm">
                    {String(category.sort_order).padStart(2, "0")}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="font-serif text-lg font-bold text-[#1D211F] group-hover:text-[#183D2B] transition-colors mb-1.5">
                    {category.name}
                  </h2>
                  <p className="text-xs text-[#5C6460] leading-relaxed mb-4 line-clamp-2">
                    {category.description}
                  </p>

                  {/* Subcategory chips */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <span
                        key={sub.slug}
                        className="px-2.5 py-1 bg-[#F7F5EF] border border-[#DCCFB9]/60 text-[10px] font-semibold text-[#5C6460] rounded-full"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {category.subcategories.length > 4 && (
                      <span className="px-2.5 py-1 bg-[#F7F5EF] border border-[#DCCFB9]/60 text-[10px] font-semibold text-[#8E9590] rounded-full">
                        +{category.subcategories.length - 4} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[#183D2B] text-xs font-bold group-hover:gap-2.5 transition-all">
                    <span>Shop {category.name.split(" ")[0]}</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
