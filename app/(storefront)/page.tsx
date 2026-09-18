import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import HeroSection from "@/components/storefront/HeroSection";
import TrustBadges from "@/components/storefront/TrustBadges";
import CategoryGrid from "@/components/storefront/CategoryGrid";
import ProductSection from "@/components/storefront/ProductSection";
import FamilyBanner from "@/components/storefront/FamilyBanner";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";

export const metadata: Metadata = {
  title: "Aurelle — Everyday Essentials. Elevated.",
  description:
    "Beauty, personal care and lifestyle essentials for everyone. Shop retail or apply for wholesale at Aurelle Cosmetics, UAE.",
  alternates: { canonical: "/" },
};

// Revalidate public homepage every 5 minutes
export const revalidate = 300;

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
  let newArrivals: unknown[] = [];
  let bestSellers: unknown[] = [];
  let featuredProducts: unknown[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;

    const [
      heroResult,
      categoriesResult,
      newArrivalsResult,
      bestSellersResult,
      featuredResult,
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
        .eq("is_published", true)
        .eq("status", "published")
        .eq("is_new_arrival", true)
        .order("created_at", { ascending: false })
        .limit(8),

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
        .eq("is_published", true)
        .eq("status", "published")
        .eq("is_best_seller", true)
        .order("created_at", { ascending: false })
        .limit(8),

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
        .eq("is_published", true)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    heroContent = (heroResult.data as HeroContent | null) ?? null;
    categories = (categoriesResult.data as CategoryItem[]) ?? [];
    newArrivals = (newArrivalsResult.data as unknown[]) ?? [];
    bestSellers = (bestSellersResult.data as unknown[]) ?? [];
    featuredProducts = (featuredResult.data as unknown[]) ?? [];
  } catch {
    // Graceful degradation — show layout without DB data
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

  // Products: ONLY show real uploaded products — NO mock fallback
  // Sections are hidden when empty → admin must add products first
  const hasNewArrivals = newArrivals.length > 0;
  const hasBestSellers = bestSellers.length > 0;
  const hasFeatured = featuredProducts.length > 0;

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
      <section className="bg-[#FAF6F0] py-12 md:py-16 border-b border-[#E8DFC8]/60 relative overflow-hidden" aria-labelledby="categories-heading">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.2em] uppercase text-[#183D2B] mb-2">
              EXPLORE
            </p>
            <h2
              id="categories-heading"
              className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1D211F] tracking-tight"
            >
              Shop by Category
            </h2>
          </div>
          <CategoryGrid categories={displayCategories} />
        </div>
      </section>

      {/* ─── 4. "FOR THE WHOLE FAMILY" Banner ────────────────────── */}
      <FamilyBanner
        title={(savedHero?.family_title as string) || undefined}
        subtitle={(savedHero?.family_subtitle as string) || undefined}
        imageUrl={
          (savedHero?.family_image_public_id
            ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u"}/image/upload/f_auto,q_auto,w_900,h_700,c_fill,g_auto/${savedHero.family_image_public_id}`
            : (savedHero?.family_image_url as string)) || undefined
        }
      />

      {/* ─── 5. New Arrivals (only when products are uploaded) ───── */}
      {hasNewArrivals && (
        <ProductSection
          title="New Arrivals"
          overline="Fresh"
          viewAllHref="/shop?sort=newest&filter=new"
          products={newArrivals}
          emptyMessage=""
          background="cream"
        />
      )}

      {/* ─── 6. Best Sellers (only when products are uploaded) ───── */}
      {hasBestSellers && (
        <ProductSection
          title="Best Sellers"
          overline="Popular"
          viewAllHref="/shop?filter=bestseller"
          products={bestSellers}
          emptyMessage=""
          background="white"
        />
      )}

      {/* ─── 7. Featured Products (only when products are uploaded) ─ */}
      {hasFeatured && (
        <ProductSection
          title="Featured Products"
          overline="Curated"
          viewAllHref="/shop?filter=featured"
          products={featuredProducts}
          emptyMessage=""
          background="cream"
        />
      )}

      {/* ─── 8. Wholesale Trade Banner ──────────────────────────── */}
      <WholesaleBanner />
    </div>
  );
}

// ─── Wholesale Banner ────────────────────────────────────────────────────────
function WholesaleBanner() {
  return (
    <section className="bg-[#102D20] py-14 md:py-20 text-white" aria-label="Wholesale program">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A8B7A3] mb-3">
              For Businesses
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-4 text-white">
              Stock Aurelle Products in Your Business
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-white/75 mb-8 max-w-lg">
              We partner with retailers, distributors, salons, pharmacies and
              more across the UAE and beyond. Apply for a wholesale account to
              access exclusive trade pricing.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="/wholesale"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#183D2B] font-bold text-xs tracking-widest uppercase hover:bg-[#FAF8F5] transition-colors shadow-sm"
              >
                Apply for Wholesale
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-white/25 bg-white/8 text-white font-bold text-xs tracking-widest uppercase hover:bg-white/15 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: "✦", title: "Trade Pricing", desc: "Exclusive wholesale rates" },
              { icon: "✦", title: "MOQ Flexibility", desc: "Configured per product" },
              { icon: "✦", title: "Tiered Discounts", desc: "15% / 25% / 35% by volume" },
              { icon: "✦", title: "Dedicated Support", desc: "Priority account service" },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-[#A8B7A3] text-base mt-0.5 shrink-0" aria-hidden="true">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-sm text-white mb-0.5">{f.title}</p>
                  <p className="text-xs text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
