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
    const allRows = data || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped = allRows.map((app: any) => ({
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

    // Separate Account Applications vs Trade Enquiries
    const applications = mapped.filter(
      (item: any) =>
        item.business_type !== "Wholesale Trade Enquiry" &&
        !(item.notes && item.notes.includes("[Wholesale Product Enquiry]"))
    );

    const enquiries = mapped.filter(
      (item: any) =>
        item.business_type === "Wholesale Trade Enquiry" ||
        (item.notes && item.notes.includes("[Wholesale Product Enquiry]"))
    );

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
      applications,
      enquiries,
      wholesale_home_banners,
      wholesale_hero,
      wholesale_about,
      wholesale_statistics,
      wholesale_faq,
      wholesale_mission_vision,
    });
  } catch (err) {
    console.error("[Admin Wholesale API] exception:", err);
    return NextResponse.json({ success: true, applications: [], enquiries: [] });
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

import { sendWholesaleApprovalEmail } from "@/lib/email/brevo";

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, rejection_reason } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch application details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: appFetchErr } = await (admin as any)
      .from("wholesale_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (appFetchErr || !application) {
      return NextResponse.json(
        { error: appFetchErr?.message || "Wholesale application not found." },
        { status: 404 }
      );
    }

    // 2. Idempotency Check
    if (application.status === status && status === "approved") {
      return NextResponse.json({
        success: true,
        message: "Application is already approved.",
      });
    }

    let authUserId: string | null = application.user_id || null;

    // 3. Handle Admin Approval Action
    if (status === "approved") {
      const normalizedEmail = application.email.trim().toLowerCase();

      // If user_id is missing (legacy application record), look up by email in profiles/auth
      if (!authUserId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingProfile } = await (admin as any)
          .from("profiles")
          .select("id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (existingProfile?.id) {
          authUserId = existingProfile.id;
        } else {
          const { data: usersList } = await admin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          const existingAuthUser = usersList?.users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail
          );
          if (existingAuthUser) {
            authUserId = existingAuthUser.id;
          }
        }
      }

      if (!authUserId) {
        return NextResponse.json(
          {
            error:
              "Cannot approve application: No linked authentication account found for this application.",
          },
          { status: 400 }
        );
      }

      // 4. Elevate Profile Role to 'wholesale_customer'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (admin as any)
        .from("profiles")
        .upsert({
          id: authUserId,
          email: normalizedEmail,
          full_name: application.contact_person || application.business_name,
          phone: application.phone,
          role: "wholesale_customer",
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("[Admin Wholesale Approval] Profile update error:", profileError);
        return NextResponse.json(
          { error: "Failed to update profile role to wholesale_customer." },
          { status: 500 }
        );
      }

      // 4b. Create initial default address from application if not already present
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingAddresses } = await (admin as any)
          .from("addresses")
          .select("id")
          .eq("user_id", authUserId)
          .limit(1);

        if (!existingAddresses || existingAddresses.length === 0) {
          const appAddressLine1 = application.address_line1 || application.address || null;
          const appCity = application.city || null;
          const appCountry = application.country || "AE";

          if (appAddressLine1 && appCity) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin as any).from("addresses").insert({
              user_id: authUserId,
              label: "Main Business / Warehouse",
              full_name: application.contact_person || application.business_name || "Wholesale Recipient",
              phone: application.phone || null,
              address_line1: appAddressLine1,
              address_line2: application.address_line2 || null,
              city: appCity,
              state: application.state || appCity,
              postal_code: application.postal_code || null,
              country: appCountry.length === 2 ? appCountry.toUpperCase() : "AE",
              is_default: true,
            });
          }
        }
      } catch (addrErr) {
        console.warn("[Admin Wholesale Approval] Address initialization error:", addrErr);
      }

      // 5. Send Approval Email via Brevo (Non-blocking)
      try {
        await sendWholesaleApprovalEmail({
          email: normalizedEmail,
          companyName: application.business_name,
          contactPerson: application.contact_person,
        });
      } catch (emailErr) {
        console.error("[Admin Wholesale Approval] Brevo email failure:", emailErr);
      }
    }

    // 6. Update Application Record Status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("wholesale_applications")
      .update({
        status,
        user_id: authUserId,
        rejection_reason: status === "rejected" ? rejection_reason || null : null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Admin Wholesale PATCH error]:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Application approved successfully and wholesale customer account activated."
          : `Application status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error("[Admin Wholesale PATCH exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update application status." },
      { status: 500 }
    );
  }
}

