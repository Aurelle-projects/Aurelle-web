import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
    return NextResponse.json({ success: true, hero: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save hero data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
