import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

const SETTINGS_DEFAULTS = {
  standard_shipping_fee: 20,
  free_shipping_threshold: 199,
  vat_rate: 5,
  store_name: "Aurelle Cosmetics Trading FZ-LLC",
  trade_license: "FZ-LLC-2026-AURELLE",
  city: "Dubai",
  country: "United Arab Emirates",
  contact_address: "Business Center, Meydan Free Zone\nDubai, United Arab Emirates",
  contact_phone: "+971 50 123 4567",
  contact_email: "care@aurelle.ae",
  trade_email: "trade@aurelle.ae",
  operating_hours: "Monday – Saturday: 9:00 AM – 6:00 PM GST",
  operating_hours_weekend: "Sunday: Closed (Online Orders Processed 24/7)",
  social_instagram: "https://instagram.com/aurelle.ae",
  social_facebook: "https://facebook.com/aurelle.ae",
  social_tiktok: "https://tiktok.com/@aurelle.ae",
  social_whatsapp: "https://wa.me/971501234567",
};

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (admin as any)
      .from("site_settings")
      .select("key, value");

    if (error) throw error;

    const current: Record<string, any> = { ...SETTINGS_DEFAULTS };

    if (Array.isArray(rows)) {
      for (const r of rows) {
        // Only override default if value in DB is non-null and defined
        if (
          (r.key in current || r.key === "store_email" || r.key === "store_phone") &&
          r.value !== null &&
          r.value !== undefined
        ) {
          current[r.key] = r.value;
        }
      }
    }

    // Normalized aliases
    if (current.store_email && !current.contact_email) {
      current.contact_email = current.store_email;
    }
    if (current.store_phone && !current.contact_phone) {
      current.contact_phone = current.store_phone;
    }

    // Final safety check: ensure NO field is null or undefined
    for (const [k, v] of Object.entries(current)) {
      if (v === null || v === undefined) {
        current[k] = (SETTINGS_DEFAULTS as any)[k] ?? "";
      }
    }

    return NextResponse.json({
      success: true,
      settings: current,
    });
  } catch (err: any) {
    console.error("[API admin settings GET error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch settings." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const admin = createAdminClient();

    const allowedKeys = Object.keys(SETTINGS_DEFAULTS);
    const updates: { key: string; value: any }[] = [];

    for (const key of allowedKeys) {
      if (key in body) {
        let val = body[key];
        if (val === null || val === undefined) {
          val = (SETTINGS_DEFAULTS as any)[key] ?? "";
        }

        if (
          key === "standard_shipping_fee" ||
          key === "free_shipping_threshold" ||
          key === "vat_rate"
        ) {
          val = Number(val) || 0;
        } else if (typeof val === "string") {
          val = val.trim();
        }

        // Never let null or undefined reach Postgres jsonb NOT NULL column
        if (val === null || val === undefined) {
          val = "";
        }

        updates.push({ key, value: val });
      }
    }

    // Mirror store_email and store_phone for backwards compatibility
    if (body.contact_email) {
      updates.push({ key: "store_email", value: String(body.contact_email).trim() });
    }
    if (body.contact_phone) {
      updates.push({ key: "store_phone", value: String(body.contact_phone).trim() });
    }

    // Upsert into site_settings with guaranteed non-null value
    for (const u of updates) {
      const safeValue = u.value !== null && u.value !== undefined ? u.value : "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (admin as any).from("site_settings").upsert(
        {
          key: u.key,
          value: safeValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (error) {
        console.error(`[site_settings upsert error for ${u.key}]:`, error);
        throw error;
      }
    }

    // Revalidate affected storefront pages
    try {
      revalidatePath("/");
      revalidatePath("/(storefront)");
      revalidatePath("/contact");
      revalidatePath("/shop");
      revalidatePath("/checkout");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Store settings saved successfully.",
    });
  } catch (err: any) {
    console.error("[API admin settings POST error]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update settings." },
      { status: 500 }
    );
  }
}
