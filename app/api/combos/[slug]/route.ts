import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// ── GET: Get single active combo offer by slug for retail storefront ──────────
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: combo, error } = await (supabase as any)
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
          product_id,
          quantity,
          sort_order,
          products (
            id,
            name,
            slug,
            sku,
            description,
            benefits,
            ingredients,
            usage_instructions,
            retail_price,
            compare_at_price,
            tax_enabled,
            is_published,
            is_retail_available,
            status,
            brands ( name ),
            categories ( name, slug ),
            product_images ( secure_url, is_primary, alt_text )
          )
        )
      `)
      .eq("slug", slug.toLowerCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !combo) {
      return NextResponse.json({ error: "Combo offer not found." }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (combo.combo_offer_items || []).map((item: any) => ({
      id: item.id,
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
    console.error("[Storefront Single Combo GET exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch combo offer." },
      { status: 500 }
    );
  }
}
