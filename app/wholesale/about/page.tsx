import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import WholesaleAboutSection from "@/components/wholesale/WholesaleAboutSection";
import WholesaleStatisticsSection from "@/components/wholesale/WholesaleStatisticsSection";
import WholesaleMissionVisionSection from "@/components/wholesale/WholesaleMissionVisionSection";
import WholesaleFaqSection from "@/components/wholesale/WholesaleFaqSection";
import WholesaleContactSection from "@/components/wholesale/WholesaleContactSection";

export const metadata: Metadata = {
  title: "About Us — Aurelle Wholesale & B2B Commercial Portal",
  description:
    "Learn about Aurelle Wholesale B2B cosmetics distribution, regional GCC logistics, authentic beauty supply, and commercial trade partnerships.",
  alternates: { canonical: "/wholesale/about" },
};

export const revalidate = 30;

export default async function WholesaleAboutPage() {
  let aboutSettings: any = {};
  let statsSettings: any = {};
  let missionVisionSettings: any = {};
  let faqSettings: any = {};

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let supabase: any;
    try {
      supabase = createAdminClient();
    } catch {
      supabase = await createClient();
    }

    const { data: settingsData, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "wholesale_about",
        "wholesale_statistics",
        "wholesale_mission_vision",
        "wholesale_faq",
      ]);

    if (error) {
      console.error("Wholesale About Page settings fetch error:", error.message);
    }

    if (Array.isArray(settingsData)) {
      for (const row of settingsData) {
        if (row.key === "wholesale_about") {
          aboutSettings = row.value || {};
        } else if (row.key === "wholesale_statistics") {
          statsSettings = row.value || {};
        } else if (row.key === "wholesale_mission_vision") {
          missionVisionSettings = row.value || {};
        } else if (row.key === "wholesale_faq") {
          faqSettings = row.value || {};
        }
      }
    }
  } catch (err) {
    console.error("Wholesale about page load error:", err);
  }

  return (
    <main className="bg-white min-h-screen">
      {/* ─── 1. Wholesale About Section ────────────────────────────── */}
      <WholesaleAboutSection data={aboutSettings} showButton={false} />

      {/* ─── 2. Wholesale Statistics Section ───────────────────────── */}
      <WholesaleStatisticsSection data={statsSettings} />

      {/* ─── 3. Wholesale Mission & Vision Section (Only on About page) */}
      <WholesaleMissionVisionSection data={missionVisionSettings} />

      {/* ─── 4. Wholesale FAQ / Accordion Section ──────────────────── */}
      <WholesaleFaqSection data={faqSettings} />

      {/* ─── 5. Wholesale Contact CTA Section ──────────────────────── */}
      <WholesaleContactSection />
    </main>
  );
}
