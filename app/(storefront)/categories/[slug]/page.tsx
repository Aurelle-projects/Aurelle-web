import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";
import { getProductsByCategory, AURELLE_PRODUCTS } from "@/lib/products/mock-products";
import { ChevronRight, ArrowLeft } from "lucide-react";

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
  const category = AURELLE_CATEGORIES.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  let products = getProductsByCategory(slug);
  // If this specific category has no products in the mock list yet, provide products from catalog to showcase layout
  if (products.length === 0) {
    products = AURELLE_PRODUCTS.slice(0, 4);
  }

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
        <div className="bg-white rounded-3xl border border-[#DCCFB9]/60 p-6 md:p-10 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#183D2B]">
                Aurelle Category #{category.sort_order}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#1D211F] mt-1">
                {category.name}
              </h1>
              <p className="text-sm text-[#5C6460] max-w-2xl mt-2 leading-relaxed">
                {category.description}
              </p>
            </div>

            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6460] hover:text-[#183D2B] px-3.5 py-2 rounded-full border border-[#DCCFB9] transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>All 10 Categories</span>
            </Link>
          </div>

          {/* Subcategories Filter Chips */}
          <div className="pt-4 border-t border-[#DCCFB9]/30">
            <p className="text-xs font-bold uppercase tracking-wider text-[#5C6460] mb-2.5">
              Subcategories:
            </p>
            <div className="flex flex-wrap gap-2">
              {category.subcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/shop?category=${category.slug}&sub=${sub.slug}`}
                  className="px-3 py-1.5 bg-[#F7F5EF] hover:bg-[#183D2B] hover:text-white text-xs font-semibold text-[#1D211F] rounded-lg border border-[#DCCFB9]/50 transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
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

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((prod) => (
              <ProductCard
                key={prod.id}
                product={{
                  id: prod.id,
                  name: prod.name,
                  slug: prod.slug,
                  sku: prod.sku,
                  retail_price: prod.retail_price,
                  compare_at_price: prod.compare_at_price,
                  is_new_arrival: prod.is_new_arrival,
                  is_best_seller: prod.is_best_seller,
                  is_featured: prod.is_featured,
                  brand: { name: prod.brand_name },
                  category: { name: prod.category_name, slug: prod.category_slug },
                  product_images: prod.images.map((img, idx) => ({
                    cloudinary_public_id: img.alt,
                    secure_url: img.url,
                    is_primary: img.is_primary,
                    sort_order: idx,
                  })),
                  inventory: { stock_status: prod.stock_status },
                  wholesale_price: prod.wholesale_price,
                  wholesale_moq: prod.wholesale_moq,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
