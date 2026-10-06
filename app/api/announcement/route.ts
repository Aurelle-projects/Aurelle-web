import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60; // 60s cache

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, announcement: null });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "announcement")
      .maybeSingle();

    const val = data?.value || {};
    return NextResponse.json({
      success: true,
      announcement: {
        text: val.text || "Free Shipping Across UAE on AED 199+ | 100% Authentic Products",
        link: val.link || "/shop",
        currency_label: val.currency_label || "UAE | AED",
      },
    });
  } catch (err) {
    return NextResponse.json({
      success: true,
      announcement: {
        text: "Free Shipping Across UAE on AED 199+ | 100% Authentic Products",
        link: "/shop",
        currency_label: "UAE | AED",
      },
    });
  }
}
