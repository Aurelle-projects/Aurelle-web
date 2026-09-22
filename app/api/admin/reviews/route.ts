import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ── GET: List all reviews (admin) ────────────────────────────────────
export async function GET() {
  try {
    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("reviews")
      .select(`
        id,
        product_id,
        rating,
        title,
        body,
        is_published,
        is_verified_purchase,
        created_at,
        profiles (
          full_name,
          email
        ),
        products (
          name,
          slug
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Reviews GET error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.products?.name || "Unknown Product",
      product_slug: r.products?.slug || "",
      author_name: r.profiles?.full_name?.trim() || "Anonymous",
      author_email: r.profiles?.email || "",
      rating: Number(r.rating) || 0,
      title: r.title || null,
      body: r.body || "",
      is_published: r.is_published ?? true,
      is_verified_purchase: r.is_verified_purchase ?? false,
      created_at: r.created_at,
    }));

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("[Admin Reviews GET exception]:", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

// ── DELETE: Remove a review by id ─────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any).from("reviews").delete().eq("id", id);

    if (error) {
      console.error("[Admin Reviews DELETE error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    console.error("[Admin Reviews DELETE exception]:", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
