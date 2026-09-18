import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DATA_DIR = path.join(process.cwd(), "data");
const HERO_FILE = path.join(DATA_DIR, "hero.json");

const DEFAULT_HERO = {
  top_announcement: "Free Shipping Across UAE on AED 199+ | 100% Authentic Products | Skincare, Fragrance, Wellness",
  currency_label: "UAE | AED",
  hero_title: "EVERYDAY ESSENTIALS. ELEVATED.",
  hero_subtitle: "Beauty, personal care and lifestyle products for every member of the family.",
  hero_tagline: "CARE BEAUTY WELLNESS LIFESTYLE",
  cta_primary_text: "SHOP COLLECTION →",
  cta_primary_href: "/shop",
  product_image_url: null,
  product_image_public_id: null,
  background_image_url: null,
  background_image_public_id: null,
  family_title: "FOR THE WHOLE FAMILY",
  family_subtitle: "Everyday beauty, personal care and lifestyle essentials for the whole family.",
  family_image_url: null,
  family_image_public_id: null,
  badge_1_title: "UAE-Wide Delivery",
  badge_1_sub: "Fast & Reliable",
  badge_2_title: "100% Authentic",
  badge_2_sub: "Products",
  badge_3_title: "Secure",
  badge_3_sub: "Payments",
  badge_4_title: "Trusted & Professional",
  badge_4_sub: "Support",
  badge_5_title: "Easy & Hassle-Free",
  badge_5_sub: "Returns",
  promo_left_tagline: "MERRY",
  promo_left_title: "Christmas",
  promo_left_discount: "30%off",
  promo_left_btn_text: "Shop Now",
  promo_left_btn_link: "/shop",
  promo_left_image_url: null,
  promo_left_image_public_id: null,
  promo_right_tagline: "YOUR NEXT",
  promo_right_title: "Purchase",
  promo_right_discount: "15%off",
  promo_right_btn_text: "Shop Now",
  promo_right_btn_link: "/shop",
  promo_right_image_url: null,
  promo_right_image_public_id: null,
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HERO_FILE)) {
    fs.writeFileSync(HERO_FILE, JSON.stringify(DEFAULT_HERO, null, 2), "utf-8");
  }
}

export async function GET() {
  try {
    ensureFile();
    const raw = fs.readFileSync(HERO_FILE, "utf-8");
    const data = JSON.parse(raw);

    // Also attempt to load fresh DB data if available
    try {
      const supabase = (await createClient()) as any;
      const { data: dbPromo } = await supabase
        .from("homepage_sections")
        .select("data")
        .eq("section_key", "promo_dual_banners")
        .single();

      if (dbPromo?.data) {
        if (dbPromo.data.left) {
          data.promo_left_tagline = dbPromo.data.left.tagline ?? data.promo_left_tagline;
          data.promo_left_title = dbPromo.data.left.title ?? data.promo_left_title;
          data.promo_left_discount = dbPromo.data.left.discount ?? data.promo_left_discount;
          data.promo_left_btn_text = dbPromo.data.left.btn_text ?? data.promo_left_btn_text;
          data.promo_left_btn_link = dbPromo.data.left.btn_link ?? data.promo_left_btn_link;
          data.promo_left_image_url = dbPromo.data.left.image_url ?? data.promo_left_image_url;
          data.promo_left_image_public_id = dbPromo.data.left.image_public_id ?? data.promo_left_image_public_id;
        }
        if (dbPromo.data.right) {
          data.promo_right_tagline = dbPromo.data.right.tagline ?? data.promo_right_tagline;
          data.promo_right_title = dbPromo.data.right.title ?? data.promo_right_title;
          data.promo_right_discount = dbPromo.data.right.discount ?? data.promo_right_discount;
          data.promo_right_btn_text = dbPromo.data.right.btn_text ?? data.promo_right_btn_text;
          data.promo_right_btn_link = dbPromo.data.right.btn_link ?? data.promo_right_btn_link;
          data.promo_right_image_url = dbPromo.data.right.image_url ?? data.promo_right_image_url;
          data.promo_right_image_public_id = dbPromo.data.right.image_public_id ?? data.promo_right_image_public_id;
        }
      }
    } catch {
      // Non-blocking fallback to hero.json
    }

    return NextResponse.json({ success: true, hero: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to read hero data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFile();
    const body = await req.json();
    const raw = fs.readFileSync(HERO_FILE, "utf-8");
    const current = JSON.parse(raw);
    const updated = { ...current, ...body };
    fs.writeFileSync(HERO_FILE, JSON.stringify(updated, null, 2), "utf-8");

    // Also sync to Supabase database (homepage_sections table)
    try {
      const supabase = (await createClient()) as any;
      await supabase
        .from("homepage_sections")
        .upsert(
          {
            section_key: "promo_dual_banners",
            title: "Promotional Dual Banners",
            subtitle: "Two side-by-side promotional campaign banners",
            data: {
              left: {
                tagline: updated.promo_left_tagline,
                title: updated.promo_left_title,
                discount: updated.promo_left_discount,
                btn_text: updated.promo_left_btn_text,
                btn_link: updated.promo_left_btn_link,
                image_url: updated.promo_left_image_url,
                image_public_id: updated.promo_left_image_public_id,
              },
              right: {
                tagline: updated.promo_right_tagline,
                title: updated.promo_right_title,
                discount: updated.promo_right_discount,
                btn_text: updated.promo_right_btn_text,
                btn_link: updated.promo_right_btn_link,
                image_url: updated.promo_right_image_url,
                image_public_id: updated.promo_right_image_public_id,
              },
            },
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "section_key" }
        );
    } catch {
      // Non-blocking if DB connection is offline
    }

    return NextResponse.json({ success: true, hero: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save hero data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
