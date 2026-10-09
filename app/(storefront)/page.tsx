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
import TopRatedProducts, { type TopRatedProduct } from "@/components/storefront/TopRatedProducts";
import AllProductsSection from "@/components/storefront/AllProductsSection";
import B2BHomeCTASection from "@/components/storefront/B2BHomeCTASection";
import ComboOffersSection from "@/components/storefront/ComboOffersSection";

const SITE_URL = "https://aurellecosmeticshop.com";

export const metadata: Metadata = {
  title: "Aurelle Cosmetics UAE | Luxury Beauty, Skincare & Fragrance Shop Dubai | متجر أوريل للتجميل",
  description:
    "Aurelle Cosmetics UAE — Shop 100% genuine luxury cosmetics, skincare, haircare, perfumes & exclusive combo offers in UAE. Express delivery in Dubai, Abu Dhabi, Sharjah & all Emirates. Cash on Delivery & Card. متجر أوريل لمستحضرات التجميل والمكياج والعناية بالبشرة أونلاين في الإمارات.",
  keywords: [
    // ── Primary Brand Exact Keywords ──
    "Aurelle",
    "Aurelle Cosmetics",
    "Aurelle UAE",
    "Aurelle Cosmetics UAE",
    "Aurelle Cosmetic Shop",
    "Aurelle Beauty",
    "Aurelle Dubai",
    "Aurelle online shop",
    "Aurelle store",
    "Aurelle beauty shop",
    "Aurelle cosmetics trading",
    "aurellecosmeticshop.com",
    // ── Arabic Brand Keywords ──
    "أوريل",
    "أوريل كوزمتكس",
    "أوريل للتجميل",
    "أوريل لمستحضرات التجميل",
    "متجر أوريل",
    "أوريل الإمارات",
    "أوريل دبي",
    // ── UAE Commercial High-Intent Keywords ──
    "cosmetics UAE",
    "online beauty shop Dubai",
    "buy makeup online UAE",
    "skincare Dubai",
    "perfumes online UAE",
    "haircare products UAE",
    "luxury beauty Dubai",
    "cosmetics Abu Dhabi",
    "beauty store Sharjah",
    "Korean skincare UAE",
    "cash on delivery cosmetics UAE",
    "express beauty delivery Dubai",
    // ── Arabic Search Keywords ──
    "مستحضرات تجميل دبي",
    "مكياج الإمارات",
    "عناية بالبشرة أبوظبي",
    "عطور أصلية دبي",
    "متجر مكياج أونلاين الإمارات",
  ],
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: "Aurelle Cosmetics UAE | Luxury Beauty, Skincare & Fragrance Shop Dubai",
    description:
      "Aurelle Cosmetics UAE — Shop authentic cosmetics, skincare, haircare, perfumes & combo sets in UAE. Express delivery across Dubai, Abu Dhabi & GCC.",
    url: `${SITE_URL}/`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Aurelle Cosmetics UAE — Luxury Beauty, Skincare & Fragrances",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelle Cosmetics UAE | Luxury Beauty, Skincare & Fragrance Shop Dubai",
    description:
      "Authentic cosmetics, skincare, haircare & fragrances delivered across UAE by Aurelle Cosmetics.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Aurelle Cosmetics?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aurelle Cosmetics (Aurelle Cosmetics Trading FZ-LLC) is a premier luxury beauty and skincare destination based in Dubai, UAE, offering 100% authentic cosmetics, skincare, haircare, fragrances, and exclusive beauty combos.",
      },
    },
    {
      "@type": "Question",
      name: "Does Aurelle Cosmetics deliver across all UAE emirates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Aurelle provides express delivery across all 7 Emirates in the United Arab Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain, as well as GCC shipping.",
      },
    },
    {
      "@type": "Question",
      name: "Are products on Aurelle Cosmetics 100% authentic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, all products sold on Aurelle Cosmetics are 100% guaranteed genuine and authentic, sourced directly from certified manufacturers and authorized brand distributors.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods are accepted on Aurelle Cosmetics?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Aurelle accepts Cash on Delivery (COD) as well as secure online payments via Credit Card, Debit Card, and Apple Pay.",
      },
    },
    {
      "@type": "Question",
      name: "Does Aurelle offer wholesale cosmetics in the UAE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Aurelle Wholesale provides direct B2B supply, starter MOQs, and volume discounts for UAE pharmacies, salons, and retail beauty shops.",
      },
    },
  ],
};

// Enable ISR caching (60s) to eliminate repeated slow DB queries on page navigation
export const revalidate = 60;

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
  let topRatedProducts: TopRatedProduct[] = [];
  let allProducts: unknown[] = [];
  let brands: BrandItem[] = [];
  let siteSettings: SiteSettingsRow[] = [];
  let heroBanners: any[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = await createClient();
    } catch {
      supabase = createAdminClient();
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
        heroBannersResult,
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
            id, name, slug, sku, retail_price, compare_at_price, tax_enabled, is_out_of_stock,
            is_new_arrival, is_featured, is_best_seller,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
          `,
          )
          .eq("status", "published")
          .eq("is_new_arrival", true)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("products")
          .select(`
            id, name, slug, sku, retail_price, compare_at_price, tax_enabled, is_out_of_stock,
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
            reviews(rating, is_published)
          `)
          .eq("status", "published")
          .limit(100),

        supabase
          .from("products")
          .select(
            `
            id, name, slug, sku, retail_price, compare_at_price, tax_enabled, is_out_of_stock,
            is_new_arrival, is_featured, is_best_seller,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
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
            id, name, slug, sku, retail_price, compare_at_price, tax_enabled, is_out_of_stock,
            is_new_arrival, is_featured, is_best_seller,
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
          `,
          )
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

        supabase
          .from("banners")
          .select("*")
          .eq("position", "hero")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      categories = (categoriesResult.data as CategoryItem[]) ?? [];
      newArrivalProducts = (newArrivalsResult.data as unknown[]) ?? [];
      bestSellingProducts = (bestSellersResult.data as unknown[]) ?? [];
      const rawTopRated = ((topRatedResult.data as any[]) ?? [])
        .map((product) => {
          const validReviews = (product.reviews ?? []).filter(
            (review: { rating?: number | null; is_published?: boolean | null }) =>
              typeof review?.rating === "number" &&
              review.rating >= 1 &&
              review.rating <= 5 &&
              review.is_published !== false,
          );
          const ratings = validReviews.map((review: { rating: number }) => Number(review.rating));
          const rating =
            ratings.length > 0
              ? Number(
                  (
                    ratings.reduce((sum: number, value: number) => sum + value, 0) /
                    ratings.length
                  ).toFixed(1),
                )
              : 0;
          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            retail_price: Number(product.retail_price) || 0,
            compare_at_price: product.compare_at_price ? Number(product.compare_at_price) : null,
            tax_enabled: product.tax_enabled !== false,
            is_out_of_stock: Boolean(product.is_out_of_stock),
            rating,
            reviews_count: ratings.length,
            product_images: product.product_images ?? [],
          } satisfies TopRatedProduct;
        })
        .filter((product) => product.rating > 0 && product.reviews_count > 0)
        .sort((a, b) => b.rating - a.rating || b.reviews_count - a.reviews_count);

      // Ensure each product appears strictly once by canonical product ID
      const uniqueTopRatedMap = new Map<string, TopRatedProduct>();
      for (const p of rawTopRated) {
        if (p.id && !uniqueTopRatedMap.has(p.id)) {
          uniqueTopRatedMap.set(p.id, p);
        }
      }
      topRatedProducts = Array.from(uniqueTopRatedMap.values()).slice(0, 10);

      allProducts = (allProductsResult.data as unknown[]) ?? [];
      brands = (brandsResult.data as BrandItem[]) ?? [];
      siteSettings = (settingsResult.data as SiteSettingsRow[]) ?? [];

      const rawBanners = (heroBannersResult?.data as any[]) ?? [];
      const now = new Date();
      heroBanners = rawBanners.filter((b: any) => {
        if (!b || b.is_active === false) return false;
        if (b.starts_at && new Date(b.starts_at) > now) return false;
        if (b.ends_at && new Date(b.ends_at) < now) return false;
        const hasImage = Boolean(
          b.image_url ||
          b.background_image_url ||
          b.product_image_url ||
          b.mobile_image_url
        );
        return hasImage;
      });
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeFaqSchema),
        }}
      />
      <h1 className="sr-only">
        Aurelle Cosmetics UAE — Luxury Beauty, Skincare & Fragrance Online Shop Dubai
      </h1>
      {/* ─── 1. Hero ─────────────────────────────────────────────── */}
      <HeroSection
        title={heroData.hero_title}
        subtitle={heroData.hero_subtitle}
        heroData={heroData}
        banners={heroBanners.length > 0 ? heroBanners : undefined}
      />

      {/* ─── 2. Trust Badges ─────────────────────────────────────── */}
      <TrustBadges badges={badgeSettings.badges} />

      {/* ─── 3. Brand Slider ─────────────────────────────────────── */}
      <BrandSection brands={brands} />

      {/* ─── 4. Shop By Category ─────────────────────────────────── */}
      <CategorySection categories={displayCategories} />

         {topRatedProducts.length > 0 && (
        <TopRatedProducts products={topRatedProducts} />
      )}


      {/* ─── 5. New Arrivals Section — database products only ── */}
      <ProductSection
        title="New Arrivals"
        badge="New Arrival"
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

   
      {/* ─── 4b. Exclusive Combo Offers ───────────────────────────── */}
      <ComboOffersSection />

   

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

      {/* ─── 8. B2B Wholesale Entry Point ────
      <B2BHomeCTASection /> */}

      <AllProductsSection initialProducts={allProducts as any[]} />

    </div>
  );
}
