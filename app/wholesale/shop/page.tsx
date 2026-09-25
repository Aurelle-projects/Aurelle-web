import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWholesaleCatalogSettings } from "@/lib/wholesale/catalog";
import WholesaleShopClient from "@/components/wholesale/WholesaleShopClient";

export const metadata: Metadata = {
  title: "Wholesale Shop — Commercial Beauty & Cosmetics Catalog | Aurelle",
  description:
    "Direct B2B beauty catalog with verified wholesale pricing, starter MOQs, and consolidated GCC logistics for licensed pharmacies, retailers, and salons.",
  alternates: { canonical: "/wholesale/shop" },
};

export const revalidate = 30;

export default async function WholesaleShopPage() {
  let categories: any[] = [];
  let subcategories: any[] = [];
  let brands: any[] = [];
  let wholesaleProducts: any[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const [
      categoriesResult,
      subcategoriesResult,
      brandsResult,
      productsResult,
      catalogSettings,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      supabase
        .from("subcategories")
        .select("id, name, slug, category_id, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("brands")
        .select("id, name, slug, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      supabase
        .from("products")
        .select(`
          id, name, slug, sku, category_id, subcategory_id, brand_id, description, benefits,
          retail_price, compare_at_price, wholesale_price, wholesale_moq,
          is_wholesale_available, is_published, is_featured, is_best_seller, is_new_arrival, status,
          brand:brands(id, name, slug),
          category:categories(id, name, slug),
          subcategory:subcategories(id, name, slug),
          product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
          inventory(stock_status, stock_quantity),
          created_at
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      getWholesaleCatalogSettings(supabase),
    ]);

    const enabledCatIds = catalogSettings.enabled_category_ids;
    const enabledBrandIds = catalogSettings.enabled_brand_ids;

    // Filter categories that are wholesale available
    const rawCategories: any[] = categoriesResult.data ?? [];
    categories = rawCategories.filter((c) =>
      enabledCatIds.length > 0 ? enabledCatIds.includes(c.id) : true
    );

    // Subcategories
    subcategories = subcategoriesResult.data ?? [];

    // Filter brands that are wholesale available
    const rawBrands: any[] = brandsResult.data ?? [];
    brands = rawBrands.filter((b) =>
      enabledBrandIds.length > 0 ? enabledBrandIds.includes(b.id) : true
    );

    // Process wholesale products (only published products available for wholesale)
    const rawProducts: any[] = productsResult.data ?? [];
    wholesaleProducts = rawProducts.filter(
      (p) =>
        p.is_wholesale_available !== false &&
        (p.wholesale_price || p.retail_price)
    );
  } catch (err) {
    console.error("Wholesale shop page data load error:", err);
  }

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[#5C6460]">
          Loading wholesale catalog...
        </div>
      }
    >
      <WholesaleShopClient
        initialProducts={wholesaleProducts}
        categories={categories}
        subcategories={subcategories}
        brands={brands}
      />
    </Suspense>
  );
}
