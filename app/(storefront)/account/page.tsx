import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import RetailAccountClient from "@/components/account/RetailAccountClient";

export const metadata: Metadata = {
  title: "My Account — Aurelle",
  description: "Manage your personal Aurelle profile, track recent orders, and view saved delivery addresses.",
  alternates: { canonical: "/account" },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // ── 1. Server-side Auth Check ───────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/account");
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

  // If approved wholesale customer, immediately redirect to wholesale account portal
  if (profile?.role === "wholesale_customer") {
    redirect("/wholesale/account");
  }

  return <RetailAccountClient initialUser={user} initialProfile={profile || null} />;
}