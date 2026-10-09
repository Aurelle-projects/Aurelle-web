import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

// Keys we store in site_settings
const SETTINGS_KEYS = [
  "hero",
  "family_banner",
  "promo_banners",
  "announcement",
  "trust_badges",
  "showcase_section",
  "home_banners",
];

function dbRowsToFlat(rows: { key: string; value: any }[]): Record<string, unknown> {
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
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient() as any;

    // 1. Fetch site_settings
    const { data: rows, error: settingsError } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS);

    if (settingsError) throw settingsError;

    const flat = dbRowsToFlat(rows || []);

    // 2. Fetch banners for hero position
    let bannersList: any[] = [];
    try {
      const { data: bannerRows, error: bannersError } = await supabase
        .from("banners")
        .select("*")
        .eq("position", "hero")
        .order("sort_order", { ascending: true });

      if (!bannersError && Array.isArray(bannerRows)) {
        bannersList = bannerRows;
      }
    } catch {
      // Table might not have custom columns yet or empty
    }

    const defaultBannerTemplates = [
      {
        title: (flat.hero_title as string) || "EVERYDAY ESSENTIALS. ELEVATED",
        subtitle: (flat.hero_subtitle as string) || "Beauty, personal care and lifestyle products for every member of the family.",
        overline: (flat.hero_tagline as string) || "NATURAL CARE FOR A BRIGHTER YOU",
        link_text: (flat.cta_primary_text as string) || "SHOP COLLECTION",
        link_url: (flat.cta_primary_href as string) || "/shop",
        image_url: (flat.background_image_url as string) || (flat.product_image_url as string) || null,
        image_public_id: (flat.background_image_public_id as string) || (flat.product_image_public_id as string) || null,
        mobile_image_url: (flat.mobile_image_url as string) || null,
        mobile_image_public_id: (flat.mobile_image_public_id as string) || null,
      },
      {
        title: "SUMMER GLOW COLLECTION",
        subtitle: "Discover hydrating formulas and glowing skincare essentials.",
        overline: "NEW ARRIVALS",
        link_text: "EXPLORE NOW",
        link_url: "/shop",
        image_url: null,
        image_public_id: null,
        mobile_image_url: null,
        mobile_image_public_id: null,
      },
      {
        title: "EXCLUSIVE LUXURY SCENTS",
        subtitle: "Curated designer fragrances and premium perfumes for every occasion.",
        overline: "SIGNATURE ESSENTIALS",
        link_text: "EXPLORE NOW",
        link_url: "/shop",
        image_url: null,
        image_public_id: null,
        mobile_image_url: null,
        mobile_image_public_id: null,
      },
    ];

    // Ensure we always provide at least 3 banner slots
    while (bannersList.length < 3) {
      const idx = bannersList.length;
      const tpl = defaultBannerTemplates[idx] ?? defaultBannerTemplates[0]!;
      bannersList.push({
        id: `hero-slot-${idx + 1}`,
        title: tpl.title,
        subtitle: tpl.subtitle,
        overline: tpl.overline,
        link_text: tpl.link_text,
        link_url: tpl.link_url,
        image_url: tpl.image_url,
        image_public_id: tpl.image_public_id,
        mobile_image_url: tpl.mobile_image_url,
        mobile_image_public_id: tpl.mobile_image_public_id,
        product_image_url: tpl.image_url,
        product_image_public_id: tpl.image_public_id,
        position: "hero",
        sort_order: idx,
        is_active: true,
        starts_at: null,
        ends_at: null,
      });
    }

    return NextResponse.json({ success: true, hero: flat, banners: bannersList });
  } catch (err: any) {
    console.error("[API hero GET error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to read hero data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient() as any;
    const body = await req.json();

    const { banners: incomingBanners, ...formFields } = body;

    // 1. If banners list is provided, update banners table
    let savedBanners: any[] = [];
    if (Array.isArray(incomingBanners)) {
      try {
        // Fetch existing hero banner IDs to identify deletions
        const { data: existingBanners } = await supabase
          .from("banners")
          .select("id")
          .eq("position", "hero");

        const existingIds = new Set((existingBanners || []).map((b: any) => b.id));
        const incomingIds = new Set(
          incomingBanners
            .map((b: any) => b.id)
            .filter((id: any) => id && !String(id).startsWith("initial-") && !String(id).startsWith("temp-") && !String(id).startsWith("hero-slot-"))
        );

        // Delete removed banners
        const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));
        if (toDelete.length > 0) {
          await supabase.from("banners").delete().in("id", toDelete);
        }

        // Upsert or insert all incoming banners with updated sort_orders
        for (let i = 0; i < incomingBanners.length; i++) {
          const banner = incomingBanners[i];
          const isTempId = !banner.id || String(banner.id).startsWith("initial-") || String(banner.id).startsWith("temp-") || String(banner.id).startsWith("hero-slot-");

          const bannerRecord: Record<string, any> = {
            title: banner.title || "EVERYDAY ESSENTIALS. ELEVATED",
            subtitle: banner.subtitle || null,
            overline: banner.overline || banner.hero_tagline || null,
            link_text: banner.link_text || banner.cta_primary_text || "SHOP COLLECTION",
            link_url: banner.link_url || banner.cta_primary_href || "/shop",
            image_url: banner.image_url || banner.background_image_url || banner.product_image_url || null,
            image_public_id: banner.image_public_id || banner.background_image_public_id || banner.product_image_public_id || null,
            mobile_image_url: banner.mobile_image_url || null,
            mobile_image_public_id: banner.mobile_image_public_id || null,
            product_image_url: banner.product_image_url || banner.image_url || null,
            product_image_public_id: banner.product_image_public_id || banner.image_public_id || null,
            position: "hero",
            sort_order: typeof banner.sort_order === "number" ? banner.sort_order : i,
            is_active: banner.is_active !== false,
            starts_at: banner.starts_at || null,
            ends_at: banner.ends_at || null,
            updated_at: new Date().toISOString(),
          };

          let upserted = null;
          let upsertErr = null;

          if (isTempId) {
            const res = await supabase.from("banners").insert(bannerRecord).select().single();
            upserted = res.data;
            upsertErr = res.error;
          } else {
            bannerRecord.id = banner.id;
            const res = await supabase.from("banners").upsert(bannerRecord).select().single();
            upserted = res.data;
            upsertErr = res.error;
          }

          if (!upsertErr && upserted) {
            savedBanners.push(upserted);
          } else if (upsertErr) {
            console.error("[API hero banners upsert warning]:", upsertErr);
          }
        }

        // Also sync Slide #1 to formFields / site_settings.hero for fallback compatibility
        if (incomingBanners.length > 0) {
          const first = incomingBanners[0];
          formFields.hero_title = first.title || formFields.hero_title;
          formFields.hero_subtitle = first.subtitle || formFields.hero_subtitle;
          formFields.hero_tagline = first.overline || formFields.hero_tagline;
          formFields.cta_primary_text = first.link_text || formFields.cta_primary_text;
          formFields.cta_primary_href = first.link_url || formFields.cta_primary_href;
          formFields.background_image_url = first.image_url || formFields.background_image_url;
          formFields.background_image_public_id = first.image_public_id || formFields.background_image_public_id;
          formFields.mobile_image_url = first.mobile_image_url || formFields.mobile_image_url;
          formFields.mobile_image_public_id = first.mobile_image_public_id || formFields.mobile_image_public_id;
          formFields.product_image_url = first.product_image_url || first.image_url || formFields.product_image_url;
          formFields.product_image_public_id = first.product_image_public_id || first.image_public_id || formFields.product_image_public_id;
        }
      } catch (bErr) {
        console.error("[API hero banners batch processing warning]:", bErr);
      }
    }

    // 2. Read existing site_settings to merge
    const { data: existingRows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS);

    const existing = dbRowsToFlat(existingRows || []);
    const merged = { ...existing, ...formFields };

    // 3. Split into JSONB rows and upsert each to site_settings
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

    // 4. Invalidate storefront cache
    try {
      revalidatePath("/");
      revalidatePath("/(storefront)");
    } catch {}

    return NextResponse.json({
      success: true,
      hero: merged,
      banners: savedBanners.length > 0 ? savedBanners : incomingBanners,
    });
  } catch (err: any) {
    console.error("[API hero POST error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to save hero data" }, { status: 500 });
  }
}
