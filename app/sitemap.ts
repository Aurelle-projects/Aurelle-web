import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { AURELLE_CATEGORIES } from "@/lib/categories/data";

const SITE_URL = "https://aurellecosmeticshop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // ── 1. Static Core Storefront Routes ──────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/shop`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/combos`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/wholesale`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/shipping-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/return-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // ── 2. Category Pages ─────────────────────────────────────────────────────
  const categoryRoutes: MetadataRoute.Sitemap = AURELLE_CATEGORIES.map((cat) => ({
    url: `${SITE_URL}/categories/${cat.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  // ── 3. Dynamic Products & Combo Offers from Supabase ──────────────────────
  let productRoutes: MetadataRoute.Sitemap = [];
  let comboRoutes: MetadataRoute.Sitemap = [];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch all published retail products
      const { data: products } = await supabase
        .from("products")
        .select("slug, updated_at")
        .eq("status", "published");

      if (Array.isArray(products) && products.length > 0) {
        productRoutes = products
          .filter((p) => Boolean(p.slug))
          .map((p) => ({
            url: `${SITE_URL}/products/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : currentDate,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }));
      }

      // Fetch all active combo offers
      const { data: combos } = await supabase
        .from("combo_offers")
        .select("slug, updated_at, created_at")
        .eq("is_active", true);

      if (Array.isArray(combos) && combos.length > 0) {
        comboRoutes = combos
          .filter((c) => Boolean(c.slug))
          .map((c) => ({
            url: `${SITE_URL}/combos/${c.slug}`,
            lastModified: c.updated_at
              ? new Date(c.updated_at)
              : c.created_at
              ? new Date(c.created_at)
              : currentDate,
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }));
      }
    }
  } catch (err) {
    console.error("Error generating dynamic sitemap from Supabase:", err);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...comboRoutes];
}
