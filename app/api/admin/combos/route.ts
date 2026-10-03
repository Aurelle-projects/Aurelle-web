import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

// ── GET: List all combos with component products for Admin ───────────────────
export async function GET() {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Fetch combos with items and product details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: combos, error } = await (admin as any)
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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Combos API GET error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedCombos = (combos || []).map((combo: any) => {
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

      // Calculate total original individual value
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

      return {
        ...combo,
        price: comboPrice,
        compare_at_price: combo.compare_at_price ? Number(combo.compare_at_price) : null,
        items,
        total_individual_price: individualTotal,
        savings_amount: savings,
        savings_percentage: savingsPercent,
      };
    });

    return NextResponse.json({ success: true, combos: formattedCombos });
  } catch (err) {
    console.error("[Admin Combos API exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch combo offers." },
      { status: 500 }
    );
  }
}

// ── POST: Create new combo offer with components ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      sku,
      description,
      features,
      price,
      compare_at_price,
      tax_enabled = true,
      is_out_of_stock = false,
      is_active = true,
      is_featured = false,
      primary_image_url,
      primary_image_public_id,
      images = [],
      items = [],
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Combo name is required." }, { status: 400 });
    }
    if (!sku || !sku.trim()) {
      return NextResponse.json({ error: "SKU is required." }, { status: 400 });
    }
    if (!slug || !slug.trim()) {
      return NextResponse.json({ error: "Slug is required." }, { status: 400 });
    }
    const cleanPrice = Number(price);
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      return NextResponse.json({ error: "A valid selling price is required." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "A combo offer must contain at least one product." },
        { status: 400 }
      );
    }

    // Deduplicate component products by summing quantities
    const groupedItemsMap = new Map<string, number>();
    for (const it of items) {
      if (!it.product_id) continue;
      const currentQty = groupedItemsMap.get(it.product_id) || 0;
      const addQty = Math.max(1, parseInt(it.quantity, 10) || 1);
      groupedItemsMap.set(it.product_id, currentQty + addQty);
    }

    if (groupedItemsMap.size === 0) {
      return NextResponse.json(
        { error: "Please select valid products for the combo offer." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Check SKU and Slug uniqueness
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSku } = await (admin as any)
      .from("combo_offers")
      .select("id")
      .or(`sku.eq.${sku.trim()},slug.eq.${slug.trim()}`)
      .maybeSingle();

    if (existingSku) {
      return NextResponse.json(
        { error: "A combo offer with this SKU or slug already exists." },
        { status: 400 }
      );
    }

    // Clean features list
    let parsedFeatures: string[] = [];
    if (Array.isArray(features)) {
      parsedFeatures = features.map((f: unknown) => String(f).trim()).filter(Boolean);
    } else if (typeof features === "string") {
      parsedFeatures = features
        .split("\n")
        .map((f: string) => f.trim())
        .filter(Boolean);
    }

    // 1. Insert combo_offer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newCombo, error: comboErr } = await (admin as any)
      .from("combo_offers")
      .insert({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        sku: sku.trim().toUpperCase(),
        description: description?.trim() || null,
        features: parsedFeatures,
        price: cleanPrice,
        compare_at_price:
          compare_at_price && Number(compare_at_price) > 0 ? Number(compare_at_price) : null,
        tax_enabled: Boolean(tax_enabled),
        is_out_of_stock: Boolean(is_out_of_stock),
        is_active: Boolean(is_active),
        is_featured: Boolean(is_featured),
        primary_image_url: primary_image_url || null,
        primary_image_public_id: primary_image_public_id || null,
        images: Array.isArray(images) ? images : [],
      })
      .select()
      .single();

    if (comboErr || !newCombo) {
      console.error("[Admin Create Combo error]:", comboErr);
      return NextResponse.json(
        { error: comboErr?.message || "Failed to create combo offer." },
        { status: 500 }
      );
    }

    // 2. Insert combo_offer_items
    const comboItemsToInsert = Array.from(groupedItemsMap.entries()).map(
      ([productId, quantity], index) => ({
        combo_id: newCombo.id,
        product_id: productId,
        quantity,
        sort_order: index,
      })
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsErr } = await (admin as any)
      .from("combo_offer_items")
      .insert(comboItemsToInsert);

    if (itemsErr) {
      console.error("[Admin Create Combo Items error]:", itemsErr);
      // Clean up combo on error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from("combo_offers").delete().eq("id", newCombo.id);
      return NextResponse.json(
        { error: itemsErr.message || "Failed to save combo components." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      combo: newCombo,
      message: "Combo offer created successfully!",
    });
  } catch (err) {
    console.error("[Admin Create Combo exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create combo offer." },
      { status: 500 }
    );
  }
}
