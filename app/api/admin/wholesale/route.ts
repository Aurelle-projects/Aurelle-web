import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("wholesale_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[Admin Wholesale API] load error:", error);
      return NextResponse.json({ success: true, applications: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = (data || []).map((app: any) => ({
      id: app.id,
      company_name: app.business_name || app.company_name || "Company",
      trade_license_number: app.trade_license_number || app.trade_license_url || "—",
      contact_person: app.contact_person || "Contact Person",
      email: app.email || "—",
      phone: app.phone || "—",
      business_type: app.business_type || "retailer",
      status: app.status || "pending",
      created_at: app.created_at || new Date().toISOString(),
      country: app.country || null,
      expected_order_volume: app.expected_order_volume || null,
      notes: app.notes || null,
      tax_number: app.tax_number || null,
      trade_license_url: app.trade_license_url || null,
    }));

    // Also fetch wholesale site_settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: settingsData } = await (admin as any)
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "wholesale_home_banners",
        "wholesale_hero",
        "wholesale_about",
        "wholesale_statistics",
        "wholesale_faq",
        "wholesale_mission_vision",
      ]);

    let wholesale_home_banners = { images: [] };
    let wholesale_hero = {};
    let wholesale_about = {};
    let wholesale_statistics = { items: [] };
    let wholesale_faq = { items: [] };
    let wholesale_mission_vision = {
      mission_heading: "",
      mission_description: "",
      vision_heading: "",
      vision_description: "",
    };

    if (Array.isArray(settingsData)) {
      for (const row of settingsData) {
        if (row.key === "wholesale_home_banners") wholesale_home_banners = row.value || { images: [] };
        if (row.key === "wholesale_hero") wholesale_hero = row.value || {};
        if (row.key === "wholesale_about") wholesale_about = row.value || {};
        if (row.key === "wholesale_statistics") wholesale_statistics = row.value || { items: [] };
        if (row.key === "wholesale_faq") wholesale_faq = row.value || { items: [] };
        if (row.key === "wholesale_mission_vision") wholesale_mission_vision = row.value || {};
      }
    }

    return NextResponse.json({
      success: true,
      applications: mapped,
      wholesale_home_banners,
      wholesale_hero,
      wholesale_about,
      wholesale_statistics,
      wholesale_faq,
      wholesale_mission_vision,
    });
  } catch (err) {
    console.error("[Admin Wholesale API] exception:", err);
    return NextResponse.json({ success: true, applications: [] });
  }
}

// POST /api/admin/wholesale — Save wholesale banners or hero settings
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, value } = await request.json();
    if (
      !key ||
      (key !== "wholesale_home_banners" &&
        key !== "wholesale_hero" &&
        key !== "wholesale_about" &&
        key !== "wholesale_statistics" &&
        key !== "wholesale_faq" &&
        key !== "wholesale_mission_vision")
    ) {
      return NextResponse.json({ error: "Invalid settings key" }, { status: 400 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("site_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Admin Wholesale POST error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to update settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from("wholesale_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also sync matching order in orders table
    try {
      const ordStatus = status === "approved" ? "delivered" : status === "rejected" ? "cancelled" : "pending";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("orders")
        .update({ status: ordStatus, updated_at: new Date().toISOString() })
        .ilike("notes", `%[Wholesale Application ID: ${id}]%`);
    } catch (orderSyncErr) {
      console.warn("[Admin Wholesale PATCH] Order sync error:", orderSyncErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Wholesale PATCH error]:", err);
    return NextResponse.json({ error: "Failed to update status." }, { status: 500 });
  }
}
