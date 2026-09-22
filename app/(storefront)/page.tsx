import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import HeroSection from "@/components/storefront/HeroSection";
import TrustBadges from "@/components/storefront/TrustBadges";
import BrandSection from "@/components/storefront/BrandSection";
import CategorySection from "@/components/storefront/CategorySection";
import ProductSection from "@/components/storefront/ProductSection";
import PromoBanners from "@/components/storefront/PromoBanners";
import BrandShowcase from "@/components/storefront/BrandShowcase";
import HomeBanners from "@/components/storefront/HomeBanners";
import TopRatedProducts from "@/components/storefront/TopRatedProducts";
import AllProductsSection from "@/components/storefront/AllProductsSection";

export const metadata: Metadata = {
  title: "Aurelle — Everyday Essentials. Elevated.",
  description:
    "Beauty, personal care and lifestyle essentials for everyone. Shop skincare, hair care, cosmetics, fragrances and more at Aurelle Cosmetics, UAE.",
  alternates: { canonical: "/" },
};

// Dynamic fresh data on every request
export const revalidate = 0;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteSettingsRow = { key: string; value: any };

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
};

type BrandItem = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export default async function HomePage() {
  let categories: CategoryItem[] = [];
  let newArrivalProducts: unknown[] = [];
  let bestSellingProducts: unknown[] = [];
  let topRatedProducts: unknown[] = [];
  let allProducts: unknown[] = [];
  let brands: BrandItem[] = [];
  let siteSettings: SiteSettingsRow[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    try {
      const [
        categoriesResult,
        newArrivalsResult,
        topRatedResult,
        bestSellersResult,
        allProductsResult,
        brandsResult,
        settingsResult,
      ] = await Promise.all([
        supabase
          .from("categories")
          .select(
            "id, name, slug, description, image_url, image_public_id, sort_order, is_active",
          )
          .is("parent_id", null)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .limit(20),

        supabase
          .from("products")
          .select(
            `
            id, name, slug, sku, retail_price, compare_at_price,
            is_new_arrival, is_featured, is_best_seller,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status)
          `,
          )
          .eq("status", "published")
          .eq("is_new_arrival", true)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("products")
          .select(`
            id, name, slug, retail_price,
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            reviews(rating)
          `)
          .eq("status", "published")
          .eq("reviews.is_published", true)
          .limit(100),

        supabase
          .from("products")
          .select(
            `
            id, name, slug, sku, retail_price, compare_at_price,
            is_new_arrival, is_featured, is_best_seller,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status)
          `,
          )
          .eq("status", "published")
          .eq("is_best_seller", true)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("products")
          .select(
            `
            id, name, slug, sku, retail_price, compare_at_price,
            is_new_arrival, is_featured, is_best_seller,
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            inventory(stock_status)
          `,
          )
          .eq("is_published", true)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(12),

        supabase
          .from("brands")
          .select("id, name, slug, logo_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),

        supabase
          .from("site_settings")
          .select("key, value")
          .in("key", [
            "hero",
            "family_banner",
            "promo_banners",
            "announcement",
            "trust_badges",
            "showcase_section",
            "home_banners",
          ]),
      ]);

      categories = (categoriesResult.data as CategoryItem[]) ?? [];
      newArrivalProducts = (newArrivalsResult.data as unknown[]) ?? [];
      bestSellingProducts = (bestSellersResult.data as unknown[]) ?? [];
      topRatedProducts = ((topRatedResult.data as any[]) ?? [])
        .map((product) => {
          const ratings = (product.reviews ?? []).map((review: { rating: number }) => review.rating);
          const rating = ratings.length > 0
            ? ratings.reduce((sum: number, value: number) => sum + value, 0) / ratings.length
            : 0;
          return { ...product, rating, reviews_count: ratings.length };
        })
        .filter((product) => product.rating > 0)
        .sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count)
        .slice(0, 10);

      allProducts = (allProductsResult.data as unknown[]) ?? [];
      brands = (brandsResult.data as BrandItem[]) ?? [];
      siteSettings = (settingsResult.data as SiteSettingsRow[]) ?? [];
    } catch {
      // Graceful degradation — show layout without DB data
    }
  } catch {
    // Supabase client creation failed — continue without DB data
  }

  // ─── Parse site_settings JSONB rows ───────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const settings: Record<string, any> = {};
  for (const row of siteSettings) {
    settings[row.key] = row.value;
  }

  const heroSettings = settings.hero || {};
  const familySettings = settings.family_banner || {};
  const promoSettings = settings.promo_banners || {};
  const announcementSettings = settings.announcement || {};
  const badgeSettings = settings.trust_badges || {};
  const showcaseSettings = settings.showcase_section || {};
  const homeBannerSettings = settings.home_banners || {};

  // Build heroData for HeroSection (flat shape expected by component)
  const heroData = {
    hero_title: heroSettings.hero_title || null,
    hero_subtitle: heroSettings.hero_subtitle || null,
    hero_tagline: heroSettings.hero_tagline || heroSettings.overline || null,
    overline: heroSettings.hero_tagline || heroSettings.overline || null,
    cta_primary_text: heroSettings.cta_primary_text || null,
    cta_primary_href: heroSettings.cta_primary_href || "/shop",
    product_image_url: heroSettings.product_image_url || null,
    product_image_public_id: heroSettings.product_image_public_id || null,
    background_image_url: heroSettings.background_image_url || null,
    background_image_public_id: heroSettings.background_image_public_id || null,
    mobile_image_url: heroSettings.mobile_image_url || null,
    mobile_image_public_id: heroSettings.mobile_image_public_id || null,
    // Announcement (for AnnouncementBar)
    top_announcement: announcementSettings.text || null,
    currency_label: announcementSettings.currency_label || "UAE | AED",
  };

  // Real DB categories only — no fallback/mock data
  const displayCategories: CategoryItem[] = categories;

  return (
    <div>
      {/* ─── 1. Hero ─────────────────────────────────────────────── */}
      <HeroSection
        title={heroData.hero_title}
        subtitle={heroData.hero_subtitle}
        heroData={heroData}
      />

      {/* ─── 2. Trust Badges ─────────────────────────────────────── */}
      <TrustBadges badges={badgeSettings.badges} />

      {/* ─── 3. Brand Slider ─────────────────────────────────────── */}
      <BrandSection brands={brands} />

      {/* ─── 4. Shop By Category ─────────────────────────────────── */}
      <CategorySection categories={displayCategories} />

      {/* ─── 5. New Arrivals Section — database products only ── */}
      <ProductSection
        title="New Arrivals"
        viewAllHref="/shop"
        products={newArrivalProducts}
        maxProducts={10}
        desktopColumns={6}
        emptyMessage="No new arrival products yet."
        background="white"
        showBottomButton={true}
        bottomButtonText="All Products"
      />

      {/* ─── 8. Brand Showcase (6-Image Collage + Text) ──── */}
        <HomeBanners images={homeBannerSettings.images || []} />

      {/* ─── 6. Best Selling Section — database products only ── */}
      <ProductSection
        title="Best Selling"
        viewAllHref="/shop"
        products={bestSellingProducts}
        maxProducts={10}
        desktopColumns={5}
        emptyMessage="No best selling products yet."
        background="white"
        showBottomButton={true}
        bottomButtonText="All Products"
      />

      <BrandShowcase
        heading={showcaseSettings.heading}
        description={showcaseSettings.description}
        images={showcaseSettings.images || []}
      />

      <TopRatedProducts products={topRatedProducts as any[]} />

 

   

      {/* ─── 7. Promotional Dual Banners ──── */}
      <PromoBanners
        leftTagline={promoSettings.left?.tagline}
        leftTitle={promoSettings.left?.title}
        leftDiscount={promoSettings.left?.discount}
        leftBtnText={promoSettings.left?.btn_text}
        leftBtnLink={promoSettings.left?.btn_link}
        leftImageUrl={promoSettings.left?.image_url || null}
        rightTagline={promoSettings.right?.tagline}
        rightTitle={promoSettings.right?.title}
        rightDiscount={promoSettings.right?.discount}
        rightBtnText={promoSettings.right?.btn_text}
        rightBtnLink={promoSettings.right?.btn_link}
        rightImageUrl={promoSettings.right?.image_url || null}
      />

      <AllProductsSection initialProducts={allProducts as any[]} />

    </div>
  );
}
