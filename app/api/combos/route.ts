import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET: List active combo offers for retail storefront ───────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featuredOnly = searchParams.get("featured") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (admin as any)
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
        is_active,
        is_featured,
        primary_image_url,
        images,
        created_at,
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
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }

    const { data: combos, error } = await query;

    if (error) {
      console.error("[Storefront Combos API GET error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format combos with calculated savings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = (combos || []).map((combo: any) => {
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

    return NextResponse.json({ success: true, combos: formatted });
  } catch (err) {
    console.error("[Storefront Combos API exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch combo offers." },
      { status: 500 }
    );
  }
}
