import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WholesaleAccountClient from "@/components/wholesale/WholesaleAccountClient";

export const metadata: Metadata = {
  title: "Wholesale Account — Aurelle B2B Portal",
  description: "Manage your verified B2B wholesale business profile, contact details, delivery points, and account security.",
  alternates: { canonical: "/wholesale/account" },
};

export const dynamic = "force-dynamic";

export default async function WholesaleAccountPage() {
  // ── 1. Server-side Auth Check ───────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/wholesale/account");
  }

  // ── 2. Server-side Role Check ───────────────────────────────────────
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    admin = supabase as any;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from("profiles")
    .select("id, email, full_name, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "wholesale_customer") {
    redirect("/wholesale");
  }

  // ── 3. Fetch Wholesale Application Data for Business Details ─────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wholesaleApp } = await (admin as any)
    .from("wholesale_applications")
    .select(
      "id, business_name, contact_person, business_type, country, expected_order_volume, trade_license_url, notes, status"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF8F5] min-h-screen py-16 flex items-center justify-center">
          <div className="text-xs text-[#8E9590] animate-pulse">
            Loading wholesale account details...
          </div>
        </div>
      }
    >
      <WholesaleAccountClient profile={profile} wholesaleApp={wholesaleApp || null} />
    </Suspense>
  );
}
