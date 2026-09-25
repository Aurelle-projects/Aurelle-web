import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WholesaleHeroSection from "@/components/wholesale/WholesaleHeroSection";
import WholesaleAboutSection from "@/components/wholesale/WholesaleAboutSection";
import WholesaleStatisticsSection from "@/components/wholesale/WholesaleStatisticsSection";
import WholesaleFaqSection from "@/components/wholesale/WholesaleFaqSection";
import WholesaleContactSection from "@/components/wholesale/WholesaleContactSection";
import BrandSection from "@/components/storefront/BrandSection";
import WholesaleCategorySection from "@/components/wholesale/WholesaleCategorySection";
import ProductSection from "@/components/storefront/ProductSection";
import HomeBanners from "@/components/storefront/HomeBanners";
import WholesaleAllProducts from "@/components/wholesale/WholesaleAllProducts";
import { getWholesaleCatalogSettings } from "@/lib/wholesale/catalog";

export const metadata: Metadata = {
  title: "Aurelle Wholesale — Commercial GCC Beauty & Cosmetics Distribution",
  description:
    "Direct B2B beauty distribution, genuine cosmetics supply, low starter MOQs, and consolidated GCC logistics for verified pharmacies, retailers, and salons.",
  alternates: { canonical: "/wholesale" },
};

export const revalidate = 30;

export default async function WholesalePage() {
  let categories: any[] = [];
  let brands: any[] = [];
  let allWholesaleProducts: any[] = [];
  let newArrivalProducts: any[] = [];
  let wholesaleBanners: any[] = [];
  let heroSettings: any = {};
  let aboutSettings: any = {};
  let statsSettings: any = {};
  let faqSettings: any = {};

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
      brandsResult,
      productsResult,
      settingsResult,
      catalogSettings,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select(
          "id, name, slug, description, image_url, image_public_id, sort_order, is_active"
        )
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(20),

      supabase
        .from("brands")
        .select("id, name, slug, logo_url, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      supabase
        .from("products")
        .select(`
          id, name, slug, sku, category_id, brand_id, description, benefits,
          retail_price, compare_at_price, wholesale_price, wholesale_moq,
          is_wholesale_available, is_published, is_featured, is_best_seller, is_new_arrival, status,
          brand:brands(name, slug),
          category:categories(name, slug),
          product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
          inventory(stock_status, stock_quantity)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [
          "wholesale_home_banners",
          "wholesale_hero",
          "wholesale_about",
          "wholesale_statistics",
          "wholesale_faq",
        ]),

      getWholesaleCatalogSettings(supabase),
    ]);

    const enabledCatIds = catalogSettings.enabled_category_ids;
    const enabledBrandIds = catalogSettings.enabled_brand_ids;

    // Filter categories that are wholesale available
    const rawCategories: any[] = categoriesResult.data ?? [];
    categories = rawCategories.filter((c) =>
      enabledCatIds.length > 0 ? enabledCatIds.includes(c.id) : true
    );

    // Filter brands that are wholesale available
    const rawBrands: any[] = brandsResult.data ?? [];
    brands = rawBrands.filter((b) =>
      enabledBrandIds.length > 0 ? enabledBrandIds.includes(b.id) : true
    );

    // Process wholesale products (only published products available for wholesale)
    const rawProducts: any[] = productsResult.data ?? [];
    allWholesaleProducts = rawProducts.filter(
      (p) => p.is_wholesale_available !== false && (p.wholesale_price || p.retail_price)
    );

    newArrivalProducts = allWholesaleProducts.filter((p) => p.is_new_arrival);
    if (newArrivalProducts.length === 0) {
      newArrivalProducts = allWholesaleProducts.slice(0, 10);
    }

    // Site settings for wholesale
    if (Array.isArray(settingsResult.data)) {
      for (const row of settingsResult.data) {
        if (row.key === "wholesale_home_banners") {
          wholesaleBanners = row.value?.images || [];
        } else if (row.key === "wholesale_hero") {
          heroSettings = row.value || {};
        } else if (row.key === "wholesale_about") {
          aboutSettings = row.value || {};
        } else if (row.key === "wholesale_statistics") {
          statsSettings = row.value || {};
        } else if (row.key === "wholesale_faq") {
          faqSettings = row.value || {};
        }
      }
    }
  } catch (err) {
    console.error("Wholesale page data load error:", err);
  }

  return (
    <div id="top" className="space-y-0">
      {/* ─── 1. Wholesale Hero Section ─────────────────────────────── */}
      <WholesaleHeroSection
        heroData={heroSettings}
        bannerFallback={wholesaleBanners?.[0]?.url || null}
      />

         {/* ─── 3. Wholesale Statistics Section ───────────────────────── */}
      <div id="statistics">
        <WholesaleStatisticsSection data={statsSettings} />
      </div>

      {/* ─── 2. Wholesale About Section ────────────────────────────── */}
      <div id="about-us">
        <WholesaleAboutSection data={aboutSettings} />
      </div>

   

      {/* ─── 4. Shop by Brand (Reusing BrandSection) ───────────────── */}
      <div id="shop-by-brand">
        <BrandSection brands={brands} />
      </div>

      {/* ─── 5. Shop by Category (Separate Wholesale Square Design) ─────────── */}
      <div id="shop-by-category">
        <WholesaleCategorySection categories={categories} />
      </div>

      {/* ─── 6. New Arrivals (Reusing ProductSection with wholesale pricing) ── */}
      <div id="new-arrivals">
        <ProductSection
          title="New Arrivals"
          badge="New Arrival"
          viewAllHref="/wholesale/shop"
          products={newArrivalProducts}
          maxProducts={10}
          desktopColumns={5}
          emptyMessage="No wholesale new arrival products found."
          background="white"
          showBottomButton={true}
          bottomButtonText="View All Products"
          isWholesaleUser={true}
        />
      </div>

      {/* ─── 7. Wholesale Home Banners (Reusing HomeBanners component) ── */}
      {wholesaleBanners.length > 0 && (
        <HomeBanners images={wholesaleBanners} />
      )}

      {/* ─── 8. All Products (Catalog with category filter & sort) ─── */}
      <div id="all-products">
        <WholesaleAllProducts
          products={allWholesaleProducts}
          categories={categories}
        />
      </div>

      {/* ─── 9. Wholesale FAQ / Accordion Section ──────────────────── */}
      <div id="faq">
        <WholesaleFaqSection data={faqSettings} />
      </div>

      {/* ─── 10. Wholesale Contact CTA Section ──────────────────────── */}
      <div id="contact">
        <WholesaleContactSection />
      </div>

 

   

    

     
    </div>
  );
}
