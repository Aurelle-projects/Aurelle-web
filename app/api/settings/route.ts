import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PUBLIC_KEYS = [
  "standard_shipping_fee",
  "free_shipping_threshold",
  "vat_rate",
  "store_name",
  "contact_address",
  "contact_phone",
  "contact_email",
  "trade_email",
  "operating_hours",
  "operating_hours_weekend",
  "social_instagram",
  "social_facebook",
  "social_tiktok",
  "social_whatsapp",
  "store_email",
  "store_phone",
  "city",
  "country",
];

const DEFAULTS: Record<string, any> = {
  standard_shipping_fee: 20,
  free_shipping_threshold: 199,
  vat_rate: 5,
  store_name: "Aurelle Cosmetics Trading FZ-LLC",
  contact_address: "Business Center, Meydan Free Zone, Dubai, United Arab Emirates",
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
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (admin as any)
      .from("site_settings")
      .select("key, value")
      .in("key", PUBLIC_KEYS);

    const result = { ...DEFAULTS };

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.value !== null && r.value !== undefined) {
          result[r.key] = r.value;
        }
      }
    }

    // Normalized aliases
    if (result.store_email && !result.contact_email) {
      result.contact_email = result.store_email;
    }
    if (result.store_phone && !result.contact_phone) {
      result.contact_phone = result.store_phone;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Public settings GET error]:", err);
    return NextResponse.json(DEFAULTS);
  }
}
