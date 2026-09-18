import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/storefront/HeroSection";
import TrustBadges from "@/components/storefront/TrustBadges";
import CategoryGrid from "@/components/storefront/CategoryGrid";
import ProductSection from "@/components/storefront/ProductSection";
import PromoBanners from "@/components/storefront/PromoBanners";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";

export const metadata: Metadata = {
  title: "Aurelle — Everyday Essentials. Elevated.",
  description:
    "Beauty, personal care and lifestyle essentials for everyone. Shop skincare, hair care, cosmetics, fragrances and more at Aurelle Cosmetics, UAE.",
  alternates: { canonical: "/" },
};

// Dynamic fresh data on every request
export const revalidate = 0;

type HeroContent = {
  title: string | null;
  subtitle: string | null;
  data: Record<string, unknown> | null;
};

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
};

export default async function HomePage() {
  let heroContent: HeroContent | null = null;
  let categories: CategoryItem[] = [];
  let publishedProducts: unknown[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dbPromoData: Record<string, any> | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    try {
      const [
        heroResult,
        categoriesResult,
        productsResult,
        promoResult,
      ] = await Promise.all([
        supabase
          .from("homepage_sections")
          .select("title, subtitle, data")
          .eq("section_key", "hero")
          .eq("is_active", true)
          .single(),

        supabase
          .from("categories")
          .select("id, name, slug, description, image_url, image_public_id, sort_order")
          .eq("is_active", true)
          .is("parent_id", null)
          .order("sort_order", { ascending: true })
          .limit(10),

        supabase
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
          .order("created_at", { ascending: false })
          .limit(12),

        supabase
          .from("homepage_sections")
          .select("title, subtitle, data")
          .eq("section_key", "promo_dual_banners")
          .eq("is_active", true)
          .single(),
      ]);

      heroContent = (heroResult.data as HeroContent | null) ?? null;
      categories = (categoriesResult.data as CategoryItem[]) ?? [];
      publishedProducts = (productsResult.data as unknown[]) ?? [];
      dbPromoData = (promoResult?.data?.data as Record<string, any>) ?? null;
    } catch {
      // Graceful degradation — show layout without DB data
    }
  } catch {
    // Supabase client creation failed — continue without DB data
  }

  // ─── Permanent Server Data Loading ───────────────────────────────────────────
  let savedCategories: CategoryItem[] = [];
  try {
    const fs = await import("fs");
    const path = await import("path");
    const catPath = path.join(process.cwd(), "data", "categories.json");
    if (fs.existsSync(catPath)) {
      savedCategories = JSON.parse(fs.readFileSync(catPath, "utf-8"));
    }
  } catch {}

  let savedHero: Record<string, unknown> | null = null;
  try {
    const fs = await import("fs");
    const path = await import("path");
    const heroPath = path.join(process.cwd(), "data", "hero.json");
    if (fs.existsSync(heroPath)) {
      savedHero = JSON.parse(fs.readFileSync(heroPath, "utf-8"));
    }
  } catch {}

  // Canonical 10 categories: merges permanently saved server data with DB
  const displayCategories: CategoryItem[] = AURELLE_CATEGORIES.map((cat, idx) => {
    const savedCat = savedCategories.find((c) => c.slug === cat.slug);
    const dbCat = categories.find((c) => c.slug === cat.slug);
    return {
      id: dbCat?.id || savedCat?.id || cat.slug,
      name: cat.name,
      slug: cat.slug,
      description: savedCat?.description || dbCat?.description || cat.description,
      image_url: savedCat?.image_url ?? dbCat?.image_url ?? null,
      image_public_id: savedCat?.image_public_id ?? dbCat?.image_public_id ?? null,
      sort_order: cat.sort_order || idx + 1,
    };
  });

  // Only show real DB products — no mock fallback
  const bestSellingProducts = publishedProducts.slice(0, 4);

  const mergedHeroData = {
    ...(savedHero || {}),
    ...(heroContent?.data || {}),
  };

  return (
    <div>
      {/* ─── 1. Hero ─────────────────────────────────────────────── */}
      <HeroSection
        title={(savedHero?.hero_title as string) || heroContent?.title || null}
        subtitle={(savedHero?.hero_subtitle as string) || heroContent?.subtitle || null}
        heroData={mergedHeroData}
      />

      {/* ─── 2. Trust Badges ─────────────────────────────────────── */}
      <TrustBadges />

      {/* ─── 3. Shop By Category ─────────────────────────────────── */}
      <section className="bg-white py-12 md:py-10 relative overflow-hidden" aria-labelledby="categories-heading">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
          
            <h2
              id="categories-heading"
              className="text-2xl sm:text-3xl  text-[#1D211F] tracking-tight"
            >
              Shop by Category
            </h2>
          </div>
          <CategoryGrid categories={displayCategories} />
        </div>
      </section>

     

      {/* ─── 5. Best Selling Section — only renders when DB has products ── */}
      {bestSellingProducts.length > 0 && (
        <ProductSection
          title="Best Selling"
          viewAllHref="/shop"
          products={bestSellingProducts}
          emptyMessage="No products in this collection yet."
          background="white"
          showBottomButton={true}
          bottomButtonText="All Products"
        />
      )}

      {/* ─── 4. Promotional Dual Banners (Configurable via Admin & Database) ──── */}
      <PromoBanners
        leftTagline={dbPromoData?.left?.tagline || (savedHero?.promo_left_tagline as string) || undefined}
        leftTitle={dbPromoData?.left?.title || (savedHero?.promo_left_title as string) || undefined}
        leftDiscount={dbPromoData?.left?.discount || (savedHero?.promo_left_discount as string) || undefined}
        leftBtnText={dbPromoData?.left?.btn_text || (savedHero?.promo_left_btn_text as string) || undefined}
        leftBtnLink={dbPromoData?.left?.btn_link || (savedHero?.promo_left_btn_link as string) || undefined}
        leftImageUrl={dbPromoData?.left?.image_url || (savedHero?.promo_left_image_url as string) || null}
        rightTagline={dbPromoData?.right?.tagline || (savedHero?.promo_right_tagline as string) || undefined}
        rightTitle={dbPromoData?.right?.title || (savedHero?.promo_right_title as string) || undefined}
        rightDiscount={dbPromoData?.right?.discount || (savedHero?.promo_right_discount as string) || undefined}
        rightBtnText={dbPromoData?.right?.btn_text || (savedHero?.promo_right_btn_text as string) || undefined}
        rightBtnLink={dbPromoData?.right?.btn_link || (savedHero?.promo_right_btn_link as string) || undefined}
        rightImageUrl={dbPromoData?.right?.image_url || (savedHero?.promo_right_image_url as string) || null}
      />

    </div>
  );
}
