import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WholesaleContactClient from "@/components/wholesale/WholesaleContactClient";

export const metadata: Metadata = {
  title: "Contact Wholesale & Commercial B2B Desk | Aurelle",
  description:
    "Direct B2B procurement channel for wholesale cosmetics, volume trade carton supply, and GCC logistics for licensed retail, pharmacy, and beauty accounts.",
  alternates: { canonical: "/wholesale/contact" },
};

export const revalidate = 60;

export default async function WholesaleContactPage() {
  let categories: any[] = [];
  let products: any[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, is_active")
        .is("parent_id", null)
        .eq("is_active", true)
        .order("name", { ascending: true }),

      supabase
        .from("products")
        .select(
          "id, name, slug, sku, category_id, wholesale_moq, is_wholesale_available, status"
        )
        .eq("status", "published")
        .order("name", { ascending: true }),
    ]);

    categories = categoriesResult.data || [];
    const rawProducts: any[] = productsResult.data || [];
    products = rawProducts.filter(
      (p) => p.is_wholesale_available !== false
    );
  } catch (err) {
    console.error("Wholesale contact page data load error:", err);
  }

  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[#5C6460]">
          Loading wholesale contact desk...
        </div>
      }
    >
      <WholesaleContactClient
        categories={categories}
        products={products}
      />
    </Suspense>
  );
}
