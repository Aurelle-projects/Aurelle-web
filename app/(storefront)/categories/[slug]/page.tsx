import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight, ArrowLeft, Package } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = AURELLE_CATEGORIES.find((c) => c.slug === slug);
  if (!category) return { title: "Category Not Found | Aurelle" };

  return {
    title: `${category.name} | Aurelle UAE`,
    description: category.description,
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const staticCategory = AURELLE_CATEGORIES.find((c) => c.slug === slug);

  if (!staticCategory) {
    notFound();
  }

  const category = staticCategory;

  // Load saved category image if available
  let categoryImage: string | null = null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const catPath = path.join(process.cwd(), "data", "categories.json");
    if (fs.existsSync(catPath)) {
      const savedList = JSON.parse(fs.readFileSync(catPath, "utf-8"));
      const matched = savedList.find((s: { slug: string }) => s.slug === slug);
      if (matched) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";
        categoryImage = matched.image_public_id
          ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_800,h_550,c_fill,g_auto/${matched.image_public_id}`
          : matched.image_url || null;
      }
    }
  } catch {}

  // Fetch real products from DB for this category — no mock fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let products: any[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, sku, retail_price, compare_at_price,
        is_new_arrival, is_featured, is_best_seller,
        brand:brands(name),
        category:categories(name, slug),
        product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
        inventory(stock_status)
      `)
      .eq("status", "published")
      .eq("category.slug", slug)
      .order("created_at", { ascending: false });

    if (!error && data) {
      products = data;
    }
  } catch {}

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#5C6460]">
          <Link href="/" className="hover:text-[#183D2B] transition-colors">
            Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/categories" className="hover:text-[#183D2B] transition-colors">
            Categories
          </Link>
          <ChevronRight size={13} />
          <span className="font-semibold text-[#1D211F]">{category.name}</span>
        </nav>

        {/* Category Hero Banner */}
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 p-6 md:p-8 shadow-xs overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#183D2B] bg-[#183D2B]/[0.06] px-3 py-1 rounded-full">
                    Aurelle Category #{category.sort_order}
                  </span>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] px-3.5 py-1.5 rounded-full border border-[#DCCFB9] hover:border-[#183D2B] transition-colors shrink-0"
                  >
                    <ArrowLeft size={13} />
                    <span>All 10 Categories</span>
                  </Link>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1D211F] mt-2 tracking-tight">
                  {category.name}
                </h1>
                <p className="text-sm text-[#5C6460] max-w-xl mt-3 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Subcategories Filter Chips */}
              <div className="pt-4 border-t border-[#DCCFB9]/30">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#5C6460] mb-2">
                  Subcategories:
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub.slug}
                      href={`/shop?category=${category.slug}&sub=${sub.slug}`}
                      className="px-3 py-1 bg-[#F7F5EF] hover:bg-[#183D2B] hover:text-white text-xs font-semibold text-[#1D211F] rounded-lg border border-[#DCCFB9]/50 transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {categoryImage && (
              <div className="relative w-full md:w-72 lg:w-80 h-52 md:h-auto rounded-2xl overflow-hidden shrink-0 border border-[#DCCFB9]/50 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={categoryImage}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-[#1D211F]">
              Available Products ({products.length})
            </h2>
            <Link
              href={`/shop?category=${category.slug}`}
              className="text-xs font-bold text-[#183D2B] hover:underline"
            >
              View in Shop Filter →
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCCFB9]/60 py-16 text-center">
              <Package size={40} className="mx-auto mb-3 text-[#8E9590]" />
              <p className="font-semibold text-[#1D211F]">No products in this category yet</p>
              <p className="text-xs text-[#8E9590] mt-1">
                Products will appear here once added from the admin panel.
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-[#183D2B] text-white text-xs font-bold rounded-full hover:bg-[#102D20] transition-colors"
              >
                Browse All Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
