import React from "react";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import CategoriesPageClient from "@/components/storefront/CategoriesPageClient";

export const metadata = {
  title: "10 Product Categories | Aurelle Cosmetics Trading FZ-LLC",
  description:
    "Explore our 10 official product categories: Cosmetics, Skincare, Hair Care, Fragrances, Baby Care, Wellness, and more.",
};

export default async function CategoriesPage() {
  // ─── 1. Load Permanent Server Category Data (from data/categories.json) ───
  let savedCategories: {
    id?: string;
    slug: string;
    name?: string;
    description?: string;
    image_url?: string | null;
    image_public_id?: string | null;
  }[] = [];

  try {
    const catPath = path.join(process.cwd(), "data", "categories.json");
    if (fs.existsSync(catPath)) {
      savedCategories = JSON.parse(fs.readFileSync(catPath, "utf-8"));
    }
  } catch {
    // Fall through
  }

  // ─── 2. Query Supabase Categories if available ───────────────────────────
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
    // Fallback to savedCategories
  }

  // ─── 3. Real Database Categories Only — No Fallback Data ───────────────
  const categories = dbCategories.map((dbCat: any) => {
    const savedCat = savedCategories.find((s) => s.slug === dbCat.slug);
    return {
      id: dbCat.id,
      name: dbCat.name,
      slug: dbCat.slug,
      description: dbCat.description || "",
      sort_order: dbCat.sort_order || 1,
      image_url: savedCat?.image_url ?? dbCat.image_url ?? null,
      image_public_id: savedCat?.image_public_id ?? dbCat.image_public_id ?? null,
      subcategories: [],
    };
  });

  return (
    <div className="bg-[#FAF8F5] min-h-screen">
      {/* ── Haute Parfumerie Page Header ──────────────────────────────────── */}
      <div className="bg-white border-b border-[#DCCFB9]/40 py-12 md:py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <p className="text-[11px] sm:text-xs font-extrabold tracking-[0.22em] uppercase text-[#183D2B] mb-3 inline-block bg-[#183D2B]/[0.06] px-4 py-1.5 rounded-full">
            The Essentials System
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#1D211F] tracking-tight mb-4">
            10 Distinct Categories
          </h1>
          <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed max-w-xl mx-auto font-light">
            Everyday beauty, personal care and lifestyle formulations tailored
            for modern living across the United Arab Emirates.
          </p>
        </div>
      </div>

      {/* ── Interactive Category Cards Grid with Real Admin Images ────────── */}
      <CategoriesPageClient initialCategories={categories} />
    </div>
  );
}
