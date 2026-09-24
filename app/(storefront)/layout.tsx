import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import type { NavBrand, NavCategory } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StorefrontProviders from "@/components/providers/StorefrontProviders";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export const metadata: Metadata = {
  title: "Aurelle — Everyday Essentials. Elevated.",
  description:
    "Beauty, personal care and lifestyle essentials for everyone. Shop skincare, hair care, cosmetics, fragrances and more at Aurelle.",
};

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userRole: UserRole | null = null;
  let cartCount = 0;
  let navBrands: NavBrand[] = [];
  let navCategories: NavCategory[] = [];
  const settings: Record<string, unknown> = {};

  try {
    const supabase = await createClient();

    // Fetch user auth, site settings, brands, and categories in parallel to eliminate waterfall
    const [authRes, settingsRes, brandsRes, categoriesRes] = await Promise.all([
      supabase.auth.getUser(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("site_settings").select("key, value"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("brands")
        .select("name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any)
        .from("categories")
        .select("name, slug")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true }),
    ]);

    const user = authRes.data?.user;

    if (Array.isArray(settingsRes.data)) {
      for (const s of settingsRes.data as Array<{ key: string; value: unknown }>) {
        settings[s.key] = s.value;
      }
    }

    if (Array.isArray(brandsRes.data)) {
      navBrands = brandsRes.data as NavBrand[];
    }

    if (Array.isArray(categoriesRes.data)) {
      navCategories = categoriesRes.data as NavCategory[];
    }

    if (user) {
      // Parallelize profile and cart lookups
      const [profileRes, cartRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("carts")
          .select("id")
          .eq("user_id", user.id)
          .single(),
      ]);

      if (profileRes.data?.role) {
        userRole = profileRes.data.role as UserRole;
      }

      if (cartRes.data?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from("cart_items")
          .select("id", { count: "exact", head: true })
          .eq("cart_id", cartRes.data.id);
        cartCount = count ?? 0;
      }
    }
  } catch {
    // No Supabase credentials yet — render with defaults
  }

  return (
    <StorefrontProviders>
      <Header
        userRole={userRole}
        cartCount={cartCount}
        navBrands={navBrands}
        navCategories={navCategories}
      />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer settings={settings} />
    </StorefrontProviders>
  );
}
