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
    }));

    return NextResponse.json({
      success: true,
      applications: mapped,
    });
  } catch (err) {
    console.error("[Admin Wholesale API] exception:", err);
    return NextResponse.json({ success: true, applications: [] });
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Admin Wholesale PATCH error]:", err);
    return NextResponse.json({ error: "Failed to update status." }, { status: 500 });
  }
}
