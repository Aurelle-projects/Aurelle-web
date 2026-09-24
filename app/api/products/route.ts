import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const offset = Math.max(0, Number(searchParams.get("offset") || 0));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 10)));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const search = searchParams.get("search") || searchParams.get("q");

    let query = supabase
      .from("products")
      .select(`
        id, name, slug, sku, retail_price, compare_at_price,
        is_new_arrival, is_featured, is_best_seller,
        brand:brands(name),
        category:categories(name, slug),
        product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order),
        inventory(stock_status)
      `)
      .eq("is_published", true)
      .eq("status", "published");

    if (search && search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ products: data ?? [], hasMore: (data ?? []).length === limit });
  } catch (error) {
    console.error("[Products API error]:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
