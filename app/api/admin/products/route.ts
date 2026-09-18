import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/admin/products — Create a new product (bypasses RLS via service role)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, slug, sku, category_slug,
      description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, wholesale_price, wholesale_moq,
      is_published, is_featured, is_best_seller, is_new_arrival, is_wholesale_available,
      stock_quantity, low_stock_threshold,
      images,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (!retail_price || isNaN(Number(retail_price))) {
      return NextResponse.json({ error: "Valid retail price is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Resolve category_id from slug
    let category_id: string | null = null;
    if (category_slug) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      category_id = catData?.id ?? null;
    }

    // Auto-generate SKU if empty (products.sku is NOT NULL in DB)
    const autoSku = sku?.trim() || `AUR-${name.trim().slice(0, 4).toUpperCase().replace(/\s/g, "")}-${Date.now().toString(36).toUpperCase()}`;
    const autoSlug = slug?.trim() || name.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");

    // Insert product
    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        slug: autoSlug,
        sku: autoSku,
        category_id,
        description: description || null,
        benefits: benefits || null,
        ingredients: ingredients || null,
        usage_instructions: usage_instructions || null,
        retail_price: parseFloat(retail_price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        wholesale_price: wholesale_price ? parseFloat(wholesale_price) : null,
        wholesale_moq: parseInt(wholesale_moq) || 1,
        is_published: !!is_published,
        is_featured: !!is_featured,
        is_best_seller: !!is_best_seller,
        is_new_arrival: !!is_new_arrival,
        is_wholesale_available: !!is_wholesale_available,
        status: is_published ? "published" : "draft",
      })
      .select("id")
      .single();

    if (prodErr) {
      console.error("[API] Product insert error:", prodErr);
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    const productId = prodData.id;

    // Insert images
    if (images?.length > 0) {
      const imageRows = images.map((img: { public_id: string; secure_url: string; is_primary: boolean }, idx: number) => ({
        product_id: productId,
        cloudinary_public_id: img.public_id,
        secure_url: img.secure_url,
        is_primary: img.is_primary,
        sort_order: idx,
      }));
      const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
      if (imgErr) console.error("[API] Image insert error:", imgErr);
    }

    // Insert inventory row
    const { error: invErr } = await supabase.from("inventory").insert({
      product_id: productId,
      stock_quantity: parseInt(stock_quantity) || 0,
      low_stock_threshold: parseInt(low_stock_threshold) || 5,
      stock_status: (parseInt(stock_quantity) || 0) > 0 ? "in_stock" : "out_of_stock",
    });
    if (invErr) console.error("[API] Inventory insert error:", invErr);

    return NextResponse.json({ success: true, id: productId });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error. Check SUPABASE_SECRET_KEY in .env.local" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products — Update an existing product (bypasses RLS via service role)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name, slug, sku, category_slug,
      description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, wholesale_price, wholesale_moq,
      is_published, is_featured, is_best_seller, is_new_arrival, is_wholesale_available,
      stock_quantity, low_stock_threshold,
      images,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Resolve category_id
    let category_id: string | null = null;
    if (category_slug) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      category_id = catData?.id ?? null;
    }

    const { error: prodErr } = await supabase
      .from("products")
      .update({
        name: name?.trim(),
        slug,
        sku,
        category_id,
        description: description || null,
        benefits: benefits || null,
        ingredients: ingredients || null,
        usage_instructions: usage_instructions || null,
        retail_price: parseFloat(retail_price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        wholesale_price: wholesale_price ? parseFloat(wholesale_price) : null,
        wholesale_moq: parseInt(wholesale_moq) || 1,
        is_published: !!is_published,
        is_featured: !!is_featured,
        is_best_seller: !!is_best_seller,
        is_new_arrival: !!is_new_arrival,
        is_wholesale_available: !!is_wholesale_available,
        status: is_published ? "published" : "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (prodErr) {
      console.error("[API] Product update error:", prodErr);
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // Update inventory if values provided
    if (stock_quantity !== undefined) {
      const qty = parseInt(stock_quantity) || 0;
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("id")
        .eq("product_id", id)
        .single();

      if (existingInv?.id) {
        await supabase.from("inventory").update({
          stock_quantity: qty,
          low_stock_threshold: parseInt(low_stock_threshold) || 5,
          stock_status: qty > 0 ? "in_stock" : "out_of_stock",
        }).eq("product_id", id);
      } else {
        await supabase.from("inventory").insert({
          product_id: id,
          stock_quantity: qty,
          low_stock_threshold: parseInt(low_stock_threshold) || 5,
          stock_status: qty > 0 ? "in_stock" : "out_of_stock",
        });
      }
    }

    // Update images if provided
    if (images !== undefined && Array.isArray(images)) {
      await supabase.from("product_images").delete().eq("product_id", id);
      if (images.length > 0) {
        const imageRows = images.map((img: { public_id: string; secure_url: string; is_primary: boolean }, idx: number) => ({
          product_id: id,
          cloudinary_public_id: img.public_id,
          secure_url: img.secure_url,
          is_primary: img.is_primary,
          sort_order: idx,
        }));
        const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
        if (imgErr) console.error("[API] Image update error:", imgErr);
      }
    }

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error. Check SUPABASE_SECRET_KEY in .env.local" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products?id=<uuid> — Delete a product and its related data
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Delete related rows first (cascade may handle some, but be explicit)
    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase.from("inventory").delete().eq("product_id", id);

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("[API] Product delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}
