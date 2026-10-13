import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

export interface PillarItem {
  icon: string;
  title: string;
  description: string;
}

export interface AboutPageSettings {
  hero_badge: string;
  hero_title: string;
  hero_quote: string;
  story_tagline: string;
  story_title: string;
  story_paragraph_1: string;
  story_paragraph_2: string;
  story_image_url: string | null;
  story_image_public_id: string | null;
  pillars: PillarItem[];
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_link: string;
  meta_title?: string;
  meta_description?: string;
}

export const DEFAULT_ABOUT_SETTINGS: AboutPageSettings = {
  hero_badge: "Our Heritage & Purpose",
  hero_title: "Everyday Essentials. Elevated.",
  hero_quote:
    "“True luxury lies in the elevation of everyday moments — the morning wash, the spritz of oud, the soothing restorative oil.”",
  story_tagline: "Founded in Dubai, UAE",
  story_title: "Born From a Desire for Daily Perfection",
  story_paragraph_1:
    "Headquartered in the vibrant cosmetic trade hub of Dubai, Aurelle Cosmetics Trading FZ-LLC was established to bridge the gap between unattainable high-glamour cosmetics and basic utilitarian hygiene.",
  story_paragraph_2:
    "We believe that every product entering your home — whether a hydrating peptide serum, an artisanal linen mist, or a tear-free infant wash — should inspire calm, confidence, and sensorial pleasure.",
  story_image_url:
    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
  story_image_public_id: null,
  pillars: [
    {
      icon: "Sparkles",
      title: "Elevated Formulations",
      description:
        "Dermatologist-developed bio-actives, cold-pressed botanicals, and high-potency marine collagens.",
    },
    {
      icon: "ShieldCheck",
      title: "100% Authentic Sourcing",
      description:
        "Every single product is verified, batch-tested, and tracked with full chain-of-custody documentation.",
    },
    {
      icon: "Globe",
      title: "Built for the Gulf",
      description:
        "Formulated specifically to endure air-conditioning dryness, intense sun exposure, and regional humidity.",
    },
    {
      icon: "Heart",
      title: "Family-Centric",
      description:
        "Safe, gentle, and cruelty-free options crafted for infants, adolescents, and adults alike.",
    },
  ],
  cta_title: "Experience Aurelle Today",
  cta_description:
    "Discover our collection of 10 thoughtfully curated categories or connect with our commercial wholesale division.",
  cta_button_text: "Shop The Collection",
  cta_button_link: "/shop",
  meta_title: "About Aurelle Cosmetics UAE | Dubai Heritage & Philosophy | من نحن",
  meta_description:
    "Learn about Aurelle Cosmetics Trading FZ-LLC, our Dubai heritage, formulation ethos, and commitment to elevating everyday beauty and wellness in the UAE.",
};

export async function GET() {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "about_page")
      .maybeSingle();

    if (error) {
      console.error("[GET /api/admin/about] Supabase error:", error);
      return NextResponse.json({ success: true, settings: DEFAULT_ABOUT_SETTINGS });
    }

    const merged: AboutPageSettings = {
      ...DEFAULT_ABOUT_SETTINGS,
      ...(data?.value || {}),
      pillars:
        Array.isArray(data?.value?.pillars) && data.value.pillars.length > 0
          ? data.value.pillars
          : DEFAULT_ABOUT_SETTINGS.pillars,
    };

    return NextResponse.json({ success: true, settings: merged });
  } catch (err) {
    console.error("[GET /api/admin/about] Error:", err);
    return NextResponse.json({ success: true, settings: DEFAULT_ABOUT_SETTINGS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuthed = await verifyAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const settings: AboutPageSettings = {
      hero_badge: body.hero_badge || DEFAULT_ABOUT_SETTINGS.hero_badge,
      hero_title: body.hero_title || DEFAULT_ABOUT_SETTINGS.hero_title,
      hero_quote: body.hero_quote || DEFAULT_ABOUT_SETTINGS.hero_quote,
      story_tagline: body.story_tagline || DEFAULT_ABOUT_SETTINGS.story_tagline,
      story_title: body.story_title || DEFAULT_ABOUT_SETTINGS.story_title,
      story_paragraph_1: body.story_paragraph_1 || DEFAULT_ABOUT_SETTINGS.story_paragraph_1,
      story_paragraph_2: body.story_paragraph_2 || DEFAULT_ABOUT_SETTINGS.story_paragraph_2,
      story_image_url: body.story_image_url || null,
      story_image_public_id: body.story_image_public_id || null,
      pillars: Array.isArray(body.pillars) ? body.pillars : DEFAULT_ABOUT_SETTINGS.pillars,
      cta_title: body.cta_title || DEFAULT_ABOUT_SETTINGS.cta_title,
      cta_description: body.cta_description || DEFAULT_ABOUT_SETTINGS.cta_description,
      cta_button_text: body.cta_button_text || DEFAULT_ABOUT_SETTINGS.cta_button_text,
      cta_button_link: body.cta_button_link || DEFAULT_ABOUT_SETTINGS.cta_button_link,
      meta_title: body.meta_title || DEFAULT_ABOUT_SETTINGS.meta_title,
      meta_description: body.meta_description || DEFAULT_ABOUT_SETTINGS.meta_description,
    };

    const supabase = createAdminClient();
    const { error } = await (supabase as any).from("site_settings").upsert(
      {
        key: "about_page",
        value: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );


    if (error) {
      console.error("[POST /api/admin/about] Upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath("/about");
    revalidatePath("/(storefront)/about");

    return NextResponse.json({
      success: true,
      message: "About Us page content updated successfully.",
      settings,
    });
  } catch (err: any) {
    console.error("[POST /api/admin/about] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save about settings" },
      { status: 500 }
    );
  }
}
