import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary } from "@/lib/cloudinary/server";
import {
  getWholesaleCatalogSettings,
  setWholesaleCategoryAvailability,
} from "@/lib/wholesale/catalog";

export const dynamic = "force-dynamic";

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /api/admin/categories — Fetch all categories and subcategories from DB
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const [
      { data: categories, error: catErr },
      { data: subcategories, error: subErr },
      catalogSettings,
    ] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name, slug, description, image_url, image_public_id, sort_order, is_active")
        .is("parent_id", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("subcategories")
        .select("id, name, slug, category_id, sort_order, is_active")
        .order("sort_order", { ascending: true }),
      getWholesaleCatalogSettings(supabase),
    ]);

    if (catErr) throw catErr;
    if (subErr) throw subErr;

    // Normalise: frontend expects `parent_id` field on subcategories
    const normalisedSubs = (subcategories ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: any) => ({ ...s, parent_id: s.category_id })
    );

    const enabledCatIds = catalogSettings.enabled_category_ids;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalisedCats = (categories ?? []).map((c: any) => ({
      ...c,
      is_wholesale:
        c.is_wholesale !== undefined
          ? Boolean(c.is_wholesale)
          : enabledCatIds.length === 0
          ? true
          : enabledCatIds.includes(c.id),
    }));

    return NextResponse.json({
      success: true,
      categories: normalisedCats,
      subcategories: normalisedSubs,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API categories GET error]:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch categories" }, { status: 500 });
  }
}

// POST /api/admin/categories — Create a category or subcategory
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // ── Single Subcategory (has parent_id) ──────────────────────────────────
    if (body.parent_id) {
      const { name, slug, parent_id, sort_order, is_active } = body;

      if (!name?.trim()) {
        return NextResponse.json({ error: "Subcategory name is required." }, { status: 400 });
      }
      if (!slug?.trim()) {
        return NextResponse.json({ error: "Slug is required." }, { status: 400 });
      }

      const payload = {
        name: name.trim(),
        slug: slugify(slug),
        category_id: parent_id,
        sort_order: typeof sort_order === "number" ? sort_order : 0,
        is_active: is_active !== false,
      };

      const { data, error } = await supabase.from("subcategories").insert(payload).select().single();

      if (error) {
        console.error("[API subcategories POST error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { ...data, parent_id: data.category_id } });
    }

    // ── Single Category (no parent_id) ─────────────────────────────────────
    const { name, slug, description, image_url, image_public_id, sort_order, is_active, is_wholesale } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }

    const catPayload = {
      name: name.trim(),
      slug: slugify(slug),
      description: description?.trim() || null,
      image_url: image_url || null,
      image_public_id: image_public_id || null,
      parent_id: null,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      is_active: is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: catData, error: catError } = await supabase
      .from("categories")
      .insert(catPayload)
      .select()
      .single();

    if (catError) {
      console.error("[API categories POST error]:", catError);
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    if (catData?.id && is_wholesale !== undefined) {
      await setWholesaleCategoryAvailability(supabase, catData.id, !!is_wholesale);
    }

    return NextResponse.json({ success: true, data: { ...catData, is_wholesale: is_wholesale !== false } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API categories POST unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/admin/categories — Update a category or subcategory
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, description, image_url, image_public_id, parent_id, sort_order, is_active, is_wholesale } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Check if this ID belongs to the subcategories table
    const { data: existingSub } = await supabase
      .from("subcategories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingSub) {
      // ── Update subcategory ──────────────────────────────────────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) payload.name = name.trim();
      if (slug !== undefined) payload.slug = slugify(slug);
      if (parent_id !== undefined) payload.category_id = parent_id;
      if (sort_order !== undefined) payload.sort_order = Number(sort_order);
      if (is_active !== undefined) payload.is_active = !!is_active;

      const { data, error } = await supabase
        .from("subcategories")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[API subcategories PATCH error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { ...data, parent_id: data.category_id } });
    }

    // ── Update category ──────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { updated_at: new Date().toISOString() };
    if (name !== undefined) payload.name = name.trim();
    if (slug !== undefined) payload.slug = slugify(slug);
    if (description !== undefined) payload.description = description ? description.trim() : null;
    if (image_url !== undefined) payload.image_url = image_url || null;
    if (image_public_id !== undefined) payload.image_public_id = image_public_id || null;
    if (parent_id !== undefined) payload.parent_id = parent_id || null;
    if (sort_order !== undefined) payload.sort_order = Number(sort_order);
    if (is_active !== undefined) payload.is_active = !!is_active;

    // Check if category existing image is being replaced
    if (image_public_id !== undefined) {
      const { data: oldCat } = await supabase
        .from("categories")
        .select("image_public_id")
        .eq("id", id)
        .maybeSingle();

      if (oldCat?.image_public_id && oldCat.image_public_id !== image_public_id) {
        try {
          await deleteFromCloudinary(oldCat.image_public_id);
        } catch (cldErr) {
          console.error("[API categories] Cloudinary old image cleanup error:", cldErr);
        }
      }
    }

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[API categories PATCH error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (is_wholesale !== undefined) {
      await setWholesaleCategoryAvailability(supabase, id, !!is_wholesale);
    }

    return NextResponse.json({ success: true, data: { ...data, is_wholesale: is_wholesale !== undefined ? !!is_wholesale : true } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API categories PATCH unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/categories?id=<uuid> — Delete a category or subcategory
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Check if this ID is a subcategory
    const { data: existingSub } = await supabase
      .from("subcategories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existingSub) {
      // ── Delete subcategory ──────────────────────────────────────────────
      await supabase.from("products").update({ subcategory_id: null }).eq("subcategory_id", id);

      const { error } = await supabase.from("subcategories").delete().eq("id", id);

      if (error) {
        console.error("[API subcategories DELETE error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ── Delete category ────────────────────────────────────────────────────
    // 1. Fetch category image_public_id before deleting
    const { data: oldCat } = await supabase
      .from("categories")
      .select("image_public_id")
      .eq("id", id)
      .maybeSingle();

    // 2. Unlink products pointing to this category
    await supabase.from("products").update({ category_id: null }).eq("category_id", id);

    // 3. Delete all subcategories belonging to this category
    await supabase.from("subcategories").delete().eq("category_id", id);

    // 4. Delete the category itself
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("[API categories DELETE error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 5. Clean up Cloudinary image
    if (oldCat?.image_public_id) {
      try {
        await deleteFromCloudinary(oldCat.image_public_id);
      } catch (cldErr) {
        console.error("[API categories] Cloudinary image deletion error:", cldErr);
      }
    }

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API categories DELETE unexpected]:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

