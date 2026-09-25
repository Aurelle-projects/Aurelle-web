import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WholesaleHeader from "@/components/wholesale/WholesaleHeader";
import WholesaleFooter from "@/components/wholesale/WholesaleFooter";
import WholesaleFloatingContact from "@/components/wholesale/WholesaleFloatingContact";
import StorefrontProviders from "@/components/providers/StorefrontProviders";
import { getWholesaleCatalogSettings } from "@/lib/wholesale/catalog";

export const metadata: Metadata = {
  title: "Aurelle Wholesale — B2B Beauty & Cosmetics Distribution UAE",
  description:
    "Direct B2B beauty distribution, genuine cosmetics supply, low starter MOQs, and consolidated GCC logistics for verified pharmacies, retailers, and salons across the UAE.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let navBrands: Array<{ id: string; name: string; slug: string }> = [];
  let navCategories: Array<{ id: string; name: string; slug: string }> = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const [brandsRes, categoriesRes, catalogSettings] = await Promise.all([
      supabase
        .from("brands")
        .select("id, name, slug, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, slug, is_active")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      getWholesaleCatalogSettings(supabase),
    ]);

    const enabledCatIds = catalogSettings.enabled_category_ids;
    const enabledBrandIds = catalogSettings.enabled_brand_ids;

    // Filter categories that are wholesale-enabled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allCats: any[] = categoriesRes.data ?? [];
    navCategories = allCats
      .filter((c) =>
        enabledCatIds.length > 0 ? enabledCatIds.includes(c.id) : true
      )
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

    // Filter brands that are wholesale-enabled
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allBrands: any[] = brandsRes.data ?? [];
    navBrands = allBrands
      .filter((b) =>
        enabledBrandIds.length > 0 ? enabledBrandIds.includes(b.id) : true
      )
      .map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
  } catch (err) {
    console.error("Wholesale layout data load fallback:", err);
  }

  return (
    <StorefrontProviders>
      <div className="min-h-screen flex flex-col bg-white text-[#14231B]">
        <WholesaleHeader
          navBrands={navBrands}
          navCategories={navCategories}
        />
        <main className="flex-1">{children}</main>
        <WholesaleFooter />
        <WholesaleFloatingContact />
      </div>
    </StorefrontProviders>
  );
}
