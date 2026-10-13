import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { formatWhatsAppUrl } from "@/utils/whatsapp";

export const revalidate = 60; // 60s cache

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: true,
        announcement: {
          text: "Free Shipping Dubai, Sharjah, Ajman, Ras Al Khaimah on AED 249+ | 100% Authentic Products | Skincare, Hair Care & Styling, Personal Care & Hygiene, Fragrance, Wellness",
          link: "/shop",
          currency_label: "UAE | AED",
          whatsapp_url: "https://wa.me/971562096388?text=Hello%20Aurelle%2C%20I%20need%20assistance.",
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: rows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [
        "announcement",
        "social_whatsapp",
        "retail_whatsapp",
        "contact_phone",
      ]);

    const byKey: Record<string, any> = {};
    (rows || []).forEach((row) => {
      byKey[row.key] = row.value;
    });

    const val = byKey.announcement || {};
    const rawWa =
      byKey.social_whatsapp ||
      byKey.retail_whatsapp ||
      byKey.contact_phone ||
      "971562096388";
    const whatsappUrl = formatWhatsAppUrl(
      rawWa,
      "Hello Aurelle, I need assistance with an order or product inquiry."
    );

    let cleanCurrency =
      typeof val.currency_label === "string"
        ? val.currency_label.trim()
        : "UAE | AED";
    cleanCurrency =
      cleanCurrency.replace(/\s*\|\s*Help\s*\|\s*Track\s*Order.*$/i, "").trim() ||
      "UAE | AED";

    return NextResponse.json({
      success: true,
      announcement: {
        text:
          val.text ||
          "Free Shipping Dubai, Sharjah, Ajman, Ras Al Khaimah on AED 249+ | 100% Authentic Products | Skincare, Hair Care & Styling, Personal Care & Hygiene, Fragrance, Wellness",
        link: val.link || "/shop",
        currency_label: cleanCurrency,
        whatsapp_url: whatsappUrl,
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      announcement: {
        text: "Free Shipping Dubai, Sharjah, Ajman, Ras Al Khaimah on AED 249+ | 100% Authentic Products | Skincare, Hair Care & Styling, Personal Care & Hygiene, Fragrance, Wellness",
        link: "/shop",
        currency_label: "UAE | AED",
        whatsapp_url: "https://wa.me/971562096388?text=Hello%20Aurelle%2C%20I%20need%20assistance.",
      },
    });
  }
}

