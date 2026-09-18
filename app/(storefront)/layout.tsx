import type { Metadata } from "next";
import Header from "@/components/layout/Header";
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
  const settings: Record<string, unknown> = {};

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        userRole = profile.role as UserRole;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: cartData } = await (supabase as any)
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (cartData?.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from("cart_items")
          .select("id", { count: "exact", head: true })
          .eq("cart_id", cartData.id);
        cartCount = count ?? 0;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: siteSettings } = await (supabase as any)
      .from("site_settings")
      .select("key, value");

    if (Array.isArray(siteSettings)) {
      for (const s of siteSettings as Array<{ key: string; value: unknown }>) {
        settings[s.key] = s.value;
      }
    }
  } catch {
    // No Supabase credentials yet — render with defaults
  }

  return (
    <StorefrontProviders>
      <Header userRole={userRole} cartCount={cartCount} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer settings={settings} />
    </StorefrontProviders>
  );
}
