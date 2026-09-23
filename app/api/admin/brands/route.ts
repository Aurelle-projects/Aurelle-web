import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary } from "@/lib/cloudinary/server";

export const dynamic = "force-dynamic";

// GET /api/admin/brands — Fetch all brands from DB
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Try with sort_order first; if column doesn't exist yet fall back to name order
    let result = await supabase
      .from("brands")
      .select("id, name, slug, description, logo_url, logo_public_id, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    // If sort_order column is missing (migration not yet applied) retry without it
    if (result.error && result.error.message?.includes("sort_order")) {
      result = await supabase
        .from("brands")
        .select("id, name, slug, description, logo_url, logo_public_id, is_active, created_at")
        .order("name", { ascending: true });
    }

    if (result.error) throw result.error;

    // Normalise: add sort_order: 0 if column is absent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brands = (result.data ?? []).map((b: any) => ({
      sort_order: 0,
      ...b,
    }));

    return NextResponse.json({ success: true, brands });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API brands GET error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch brands" }, { status: 500 });
  }
}

// POST /api/admin/brands — Create a brand
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, logo_url, logo_public_id, is_active, sort_order } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Brand name is required." }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const basePayload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description?.trim() || null,
      logo_url: logo_url || null,
      logo_public_id: logo_public_id || null,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let result = await supabase
      .from("brands")
      .insert({ ...basePayload, sort_order: typeof sort_order === "number" ? sort_order : 0 })
      .select()
      .single();

    // If sort_order column missing, retry without it
    if (result.error && result.error.message?.includes("sort_order")) {
      result = await supabase.from("brands").insert(basePayload).select().single();
    }

    if (result.error) {
      console.error("[API brands POST error]:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API brands POST unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/admin/brands — Update a brand
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, description, logo_url, logo_public_id, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { updated_at: new Date().toISOString() };

    if (name !== undefined) payload.name = name.trim();
    if (slug !== undefined) payload.slug = slug.trim().toLowerCase();
    if (description !== undefined) payload.description = description ? description.trim() : null;
    if (logo_url !== undefined) payload.logo_url = logo_url || null;
    if (logo_public_id !== undefined) payload.logo_public_id = logo_public_id || null;
    if (is_active !== undefined) payload.is_active = !!is_active;
    if (sort_order !== undefined) payload.sort_order = typeof sort_order === "number" ? sort_order : 0;

    // Check if brand existing logo is being replaced
    if (logo_public_id !== undefined) {
      const { data: oldBrand } = await supabase
        .from("brands")
        .select("logo_public_id")
        .eq("id", id)
        .maybeSingle();

      if (oldBrand?.logo_public_id && oldBrand.logo_public_id !== logo_public_id) {
        try {
          await deleteFromCloudinary(oldBrand.logo_public_id);
        } catch (cldErr) {
          console.error("[API brands] Cloudinary old logo cleanup error:", cldErr);
        }
      }
    }

    let result = await supabase.from("brands").update(payload).eq("id", id).select().single();

    // If sort_order column missing, retry without it
    if (result.error && result.error.message?.includes("sort_order")) {
      const { sort_order: _omit, ...payloadWithoutOrder } = payload;
      result = await supabase.from("brands").update(payloadWithoutOrder).eq("id", id).select().single();
    }

    if (result.error) {
      console.error("[API brands PATCH error]:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API brands PATCH unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/brands?id=<uuid> — Delete a brand
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Brand ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Fetch brand logo_public_id before deleting
    const { data: oldBrand } = await supabase
      .from("brands")
      .select("logo_public_id")
      .eq("id", id)
      .maybeSingle();

    // Unlink any products pointing to this brand
    const { error: prodErr } = await supabase
      .from("products")
      .update({ brand_id: null })
      .eq("brand_id", id);
    if (prodErr) console.warn("[API brands DELETE] products unlink warning:", prodErr);

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      console.error("[API brands DELETE error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up Cloudinary logo
    if (oldBrand?.logo_public_id) {
      try {
        await deleteFromCloudinary(oldBrand.logo_public_id);
      } catch (cldErr) {
        console.error("[API brands] Cloudinary logo deletion error:", cldErr);
      }
    }

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API brands DELETE unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
