import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ── GET: Get single combo offer for Admin ─────────────────────────────────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: combo, error } = await (admin as any)
      .from("combo_offers")
      .select(`
        id,
        name,
        slug,
        sku,
        description,
        features,
        price,
        compare_at_price,
        tax_enabled,
        is_out_of_stock,
        is_active,
        is_featured,
        primary_image_url,
        primary_image_public_id,
        images,
        created_at,
        updated_at,
        combo_offer_items (
          id,
          combo_id,
          product_id,
          quantity,
          sort_order,
          products (
            id,
            name,
            slug,
            sku,
            retail_price,
            compare_at_price,
            tax_enabled,
            is_published,
            is_retail_available,
            status,
            brands ( name ),
            categories ( name, slug ),
            product_images ( secure_url, is_primary )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !combo) {
      return NextResponse.json({ error: "Combo offer not found." }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (combo.combo_offer_items || []).map((item: any) => ({
      id: item.id,
      combo_id: item.combo_id,
      product_id: item.product_id,
      quantity: item.quantity,
      sort_order: item.sort_order,
      product: item.products
        ? {
            ...item.products,
            brand: item.products.brands,
            category: item.products.categories,
          }
        : null,
    }));

    let individualTotal = 0;
    for (const item of items) {
      const prodPrice = item.product?.retail_price ? Number(item.product.retail_price) : 0;
      individualTotal += prodPrice * item.quantity;
    }
    individualTotal = Math.round(individualTotal * 100) / 100;

    const comboPrice = Number(combo.price) || 0;
    const savings = Math.max(0, Math.round((individualTotal - comboPrice) * 100) / 100);
    const savingsPercent =
      individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

    return NextResponse.json({
      success: true,
      combo: {
        ...combo,
        price: comboPrice,
        compare_at_price: combo.compare_at_price ? Number(combo.compare_at_price) : null,
        items,
        total_individual_price: individualTotal,
        savings_amount: savings,
        savings_percentage: savingsPercent,
      },
    });
  } catch (err) {
    console.error("[Admin Combo GET exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch combo offer." },
      { status: 500 }
    );
  }
}

// ── PATCH / PUT: Update combo offer & sync components ─────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const admin = createAdminClient();

    // Check if combo exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findErr } = await (admin as any)
      .from("combo_offers")
      .select("id, sku, slug")
      .eq("id", id)
      .maybeSingle();

    if (findErr || !existing) {
      return NextResponse.json({ error: "Combo offer not found." }, { status: 404 });
    }

    // Prepare update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.trim().toLowerCase();
    if (body.sku !== undefined) updateData.sku = body.sku.trim().toUpperCase();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.price !== undefined) {
      const p = Number(body.price);
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
      }
      updateData.price = p;
    }
    if (body.compare_at_price !== undefined) {
      updateData.compare_at_price =
        body.compare_at_price && Number(body.compare_at_price) > 0
          ? Number(body.compare_at_price)
          : null;
    }
    if (body.tax_enabled !== undefined) updateData.tax_enabled = Boolean(body.tax_enabled);
    if (body.is_out_of_stock !== undefined) updateData.is_out_of_stock = Boolean(body.is_out_of_stock);
    if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
    if (body.is_featured !== undefined) updateData.is_featured = Boolean(body.is_featured);
    if (body.primary_image_url !== undefined) updateData.primary_image_url = body.primary_image_url || null;
    if (body.primary_image_public_id !== undefined) updateData.primary_image_public_id = body.primary_image_public_id || null;
    if (body.images !== undefined) updateData.images = Array.isArray(body.images) ? body.images : [];

    if (body.features !== undefined) {
      if (Array.isArray(body.features)) {
        updateData.features = body.features.map((f: unknown) => String(f).trim()).filter(Boolean);
      } else if (typeof body.features === "string") {
        updateData.features = body.features
          .split("\n")
          .map((f: string) => f.trim())
          .filter(Boolean);
      }
    }

    // Check SKU / Slug conflicts
    if (updateData.sku || updateData.slug) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: conflict } = await (admin as any)
        .from("combo_offers")
        .select("id")
        .neq("id", id)
        .or(`sku.eq.${updateData.sku || existing.sku},slug.eq.${updateData.slug || existing.slug}`)
        .maybeSingle();

      if (conflict) {
        return NextResponse.json(
          { error: "Another combo offer with this SKU or slug already exists." },
          { status: 400 }
        );
      }
    }

    // 1. Update combo record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedCombo, error: updateErr } = await (admin as any)
      .from("combo_offers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      console.error("[Admin Update Combo error]:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 2. Sync items if provided
    if (Array.isArray(body.items)) {
      if (body.items.length === 0) {
        return NextResponse.json(
          { error: "A combo offer must contain at least one product." },
          { status: 400 }
        );
      }

      // Group duplicates
      const groupedItemsMap = new Map<string, number>();
      for (const it of body.items) {
        if (!it.product_id) continue;
        const currentQty = groupedItemsMap.get(it.product_id) || 0;
        const addQty = Math.max(1, parseInt(it.quantity, 10) || 1);
        groupedItemsMap.set(it.product_id, currentQty + addQty);
      }

      // Remove existing items and re-insert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("combo_offer_items").delete().eq("combo_id", id);

      const itemsToInsert = Array.from(groupedItemsMap.entries()).map(
        ([productId, quantity], index) => ({
          combo_id: id,
          product_id: productId,
          quantity,
          sort_order: index,
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsInsertErr } = await (admin as any)
        .from("combo_offer_items")
        .insert(itemsToInsert);

      if (itemsInsertErr) {
        console.error("[Admin Update Combo Items error]:", itemsInsertErr);
        return NextResponse.json(
          { error: itemsInsertErr.message || "Failed to sync combo components." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      combo: updatedCombo,
      message: "Combo offer updated successfully!",
    });
  } catch (err) {
    console.error("[Admin Update Combo exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update combo offer." },
      { status: 500 }
    );
  }
}

// ── DELETE: Delete combo offer safely ─────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Delete combo offer (CASCADE deletes combo_offer_items)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: delErr } = await (admin as any)
      .from("combo_offers")
      .delete()
      .eq("id", id);

    if (delErr) {
      console.error("[Admin Delete Combo error]:", delErr);
      return NextResponse.json(
        { error: delErr.message || "Failed to delete combo offer." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Combo offer deleted successfully.",
    });
  } catch (err) {
    console.error("[Admin Delete Combo exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete combo offer." },
      { status: 500 }
    );
  }
}
