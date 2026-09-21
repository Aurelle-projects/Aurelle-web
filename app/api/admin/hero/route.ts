import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Keys we store in site_settings
const SETTINGS_KEYS = ["hero", "family_banner", "promo_banners", "announcement", "trust_badges", "showcase_section", "home_banners"];

function dbRowsToFlat(rows: { key: string; value: any }[]): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byKey: Record<string, any> = {};
  for (const row of rows) {
    byKey[row.key] = row.value || {};
  }

  const hero = byKey.hero || {};
  const family = byKey.family_banner || {};
  const ann = byKey.announcement || {};
  const badges = byKey.trust_badges?.badges || [];
  const promo = byKey.promo_banners || {};
  const promoLeft = promo.left || {};
  const promoRight = promo.right || {};
  const showcase = byKey.showcase_section || {};
  const showcaseImages = showcase.images || [];
  const homeBanners = byKey.home_banners || {};

  return {
    top_announcement: ann.text ?? "",
    currency_label: ann.currency_label ?? "",
    hero_title: hero.hero_title ?? "",
    hero_subtitle: hero.hero_subtitle ?? "",
    hero_tagline: hero.hero_tagline ?? hero.overline ?? "",
    cta_primary_text: hero.cta_primary_text ?? "",
    cta_primary_href: hero.cta_primary_href ?? "",
    product_image_url: hero.product_image_url ?? null,
    product_image_public_id: hero.product_image_public_id ?? null,
    background_image_url: hero.background_image_url ?? null,
    background_image_public_id: hero.background_image_public_id ?? null,
    mobile_image_url: hero.mobile_image_url ?? null,
    mobile_image_public_id: hero.mobile_image_public_id ?? null,
    family_title: family.title ?? "",
    family_subtitle: family.subtitle ?? "",
    family_image_url: family.image_url ?? null,
    family_image_public_id: family.image_public_id ?? null,
    badge_1_title: badges[0]?.title ?? "",
    badge_1_sub: badges[0]?.subtitle ?? "",
    badge_2_title: badges[1]?.title ?? "",
    badge_2_sub: badges[1]?.subtitle ?? "",
    badge_3_title: badges[2]?.title ?? "",
    badge_3_sub: badges[2]?.subtitle ?? "",
    badge_4_title: badges[3]?.title ?? "",
    badge_4_sub: badges[3]?.subtitle ?? "",
    badge_5_title: badges[4]?.title ?? "",
    badge_5_sub: badges[4]?.subtitle ?? "",
    promo_left_tagline: promoLeft.tagline ?? "",
    promo_left_title: promoLeft.title ?? "",
    promo_left_discount: promoLeft.discount ?? "",
    promo_left_btn_text: promoLeft.btn_text ?? "",
    promo_left_btn_link: promoLeft.btn_link ?? "",
    promo_left_image_url: promoLeft.image_url ?? null,
    promo_left_image_public_id: promoLeft.image_public_id ?? null,
    promo_right_tagline: promoRight.tagline ?? "",
    promo_right_title: promoRight.title ?? "",
    promo_right_discount: promoRight.discount ?? "",
    promo_right_btn_text: promoRight.btn_text ?? "",
    promo_right_btn_link: promoRight.btn_link ?? "",
    promo_right_image_url: promoRight.image_url ?? null,
    promo_right_image_public_id: promoRight.image_public_id ?? null,
    showcase_heading: showcase.heading ?? "",
    showcase_description: showcase.description ?? "",
    showcase_image_1_url: showcaseImages[0]?.url ?? null,
    showcase_image_1_public_id: showcaseImages[0]?.public_id ?? null,
    showcase_image_2_url: showcaseImages[1]?.url ?? null,
    showcase_image_2_public_id: showcaseImages[1]?.public_id ?? null,
    showcase_image_3_url: showcaseImages[2]?.url ?? null,
    showcase_image_3_public_id: showcaseImages[2]?.public_id ?? null,
    showcase_image_4_url: showcaseImages[3]?.url ?? null,
    showcase_image_4_public_id: showcaseImages[3]?.public_id ?? null,
    showcase_image_5_url: showcaseImages[4]?.url ?? null,
    showcase_image_5_public_id: showcaseImages[4]?.public_id ?? null,
    showcase_image_6_url: showcaseImages[5]?.url ?? null,
    showcase_image_6_public_id: showcaseImages[5]?.public_id ?? null,
    home_banner_1_url: homeBanners.images?.[0]?.url ?? null,
    home_banner_1_public_id: homeBanners.images?.[0]?.public_id ?? null,
    home_banner_1_link: homeBanners.images?.[0]?.link ?? "",
    home_banner_2_url: homeBanners.images?.[1]?.url ?? null,
    home_banner_2_public_id: homeBanners.images?.[1]?.public_id ?? null,
    home_banner_2_link: homeBanners.images?.[1]?.link ?? "",
  };
}

/**
 * Split a flat HeroData object back into 5 JSONB rows for site_settings upsert.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatToDbRows(flat: Record<string, any>) {
  return [
    {
      key: "hero",
      value: {
        hero_title: flat.hero_title,
        hero_subtitle: flat.hero_subtitle,
        hero_tagline: flat.hero_tagline,
        overline: flat.hero_tagline,
        cta_primary_text: flat.cta_primary_text,
        cta_primary_href: flat.cta_primary_href,
        product_image_url: flat.product_image_url,
        product_image_public_id: flat.product_image_public_id,
        background_image_url: flat.background_image_url,
        background_image_public_id: flat.background_image_public_id,
        mobile_image_url: flat.mobile_image_url,
        mobile_image_public_id: flat.mobile_image_public_id,
      },
    },
    {
      key: "family_banner",
      value: {
        title: flat.family_title,
        subtitle: flat.family_subtitle,
        image_url: flat.family_image_url,
        image_public_id: flat.family_image_public_id,
      },
    },
    {
      key: "promo_banners",
      value: {
        left: {
          tagline: flat.promo_left_tagline,
          title: flat.promo_left_title,
          discount: flat.promo_left_discount,
          btn_text: flat.promo_left_btn_text,
          btn_link: flat.promo_left_btn_link,
          image_url: flat.promo_left_image_url,
          image_public_id: flat.promo_left_image_public_id,
        },
        right: {
          tagline: flat.promo_right_tagline,
          title: flat.promo_right_title,
          discount: flat.promo_right_discount,
          btn_text: flat.promo_right_btn_text,
          btn_link: flat.promo_right_btn_link,
          image_url: flat.promo_right_image_url,
          image_public_id: flat.promo_right_image_public_id,
        },
      },
    },
    {
      key: "announcement",
      value: {
        text: flat.top_announcement,
        currency_label: flat.currency_label,
        link: "/shop",
      },
    },
    {
      key: "trust_badges",
      value: {
        badges: [
          { title: flat.badge_1_title, subtitle: flat.badge_1_sub },
          { title: flat.badge_2_title, subtitle: flat.badge_2_sub },
          { title: flat.badge_3_title, subtitle: flat.badge_3_sub },
          { title: flat.badge_4_title, subtitle: flat.badge_4_sub },
          { title: flat.badge_5_title, subtitle: flat.badge_5_sub },
        ],
      },
    },
    {
      key: "showcase_section",
      value: {
        heading: flat.showcase_heading ?? "",
        description: flat.showcase_description ?? "",
        images: [
          { url: flat.showcase_image_1_url || null, public_id: flat.showcase_image_1_public_id || null },
          { url: flat.showcase_image_2_url || null, public_id: flat.showcase_image_2_public_id || null },
          { url: flat.showcase_image_3_url || null, public_id: flat.showcase_image_3_public_id || null },
          { url: flat.showcase_image_4_url || null, public_id: flat.showcase_image_4_public_id || null },
          { url: flat.showcase_image_5_url || null, public_id: flat.showcase_image_5_public_id || null },
          { url: flat.showcase_image_6_url || null, public_id: flat.showcase_image_6_public_id || null },
        ],
      },
    },
    {
      key: "home_banners",
      value: {
        images: [
          { url: flat.home_banner_1_url || null, public_id: flat.home_banner_1_public_id || null, link: flat.home_banner_1_link || "" },
          { url: flat.home_banner_2_url || null, public_id: flat.home_banner_2_public_id || null, link: flat.home_banner_2_link || "" },
        ],
      },
    },
  ];
}

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data: rows, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS);

    if (error) throw error;

    const flat = dbRowsToFlat(rows || []);
    return NextResponse.json({ success: true, hero: flat });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API hero GET error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to read hero data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const body = await req.json();

    // First, read existing data to merge with incoming updates
    const { data: existingRows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS);

    const existing = dbRowsToFlat(existingRows || []);
    const merged = { ...existing, ...body };

    // Split into 5 JSONB rows and upsert each
    const rows = flatToDbRows(merged);
    for (const row of rows) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key: row.key, value: row.value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    }

    return NextResponse.json({ success: true, hero: merged });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API hero POST error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to save hero data" }, { status: 500 });
  }
}

