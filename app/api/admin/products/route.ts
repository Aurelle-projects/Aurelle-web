import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromCloudinary } from "@/lib/cloudinary/server";

// GET /api/admin/products — Lightweight list for dropdowns (id, name, slug)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, category_id, subcategory_id")
      .eq("is_published", true)
      .order("name", { ascending: true })
      .limit(300);
    if (error) throw error;
    return NextResponse.json({ success: true, products: data ?? [] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products — Create a new product (bypasses RLS via service role)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, slug, sku, category_slug, category_id: incomingCatId, brand_id, subcategory_id,
      description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, tax_enabled, is_out_of_stock, wholesale_price, wholesale_moq,
      wholesale_unit_enabled, wholesale_unit_price,
      wholesale_box_enabled, wholesale_units_per_box, wholesale_box_price,
      wholesale_custom_quantity_enabled,
      is_published, is_featured, is_best_seller, is_new_arrival, is_wholesale_available,
      images, specifications: incomingSpecs,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (!retail_price || isNaN(Number(retail_price)) || Number(retail_price) < 0) {
      return NextResponse.json({ error: "Valid retail price is required." }, { status: 400 });
    }

    const isWs = !!is_wholesale_available;
    const wsUnitEnabled = isWs ? (wholesale_unit_enabled !== undefined ? !!wholesale_unit_enabled : true) : true;
    const wsBoxEnabled = isWs ? !!wholesale_box_enabled : false;
    const wsCustomEnabled = isWs ? (wholesale_custom_quantity_enabled !== undefined ? !!wholesale_custom_quantity_enabled : true) : true;

    const wsUnitPriceVal = wholesale_unit_price !== undefined && wholesale_unit_price !== "" && wholesale_unit_price !== null
      ? parseFloat(wholesale_unit_price)
      : (wholesale_price !== undefined && wholesale_price !== "" && wholesale_price !== null ? parseFloat(wholesale_price) : null);

    const wsBoxPriceVal = wholesale_box_price !== undefined && wholesale_box_price !== "" && wholesale_box_price !== null ? parseFloat(wholesale_box_price) : null;
    const wsUnitsPerBoxVal = wholesale_units_per_box !== undefined && wholesale_units_per_box !== "" && wholesale_units_per_box !== null ? parseInt(wholesale_units_per_box, 10) : null;

    if (isWs) {
      if (!wsUnitEnabled && !wsBoxEnabled && !wsCustomEnabled) {
        return NextResponse.json({ error: "At least one wholesale purchasing method (Single Unit, Full Box, or Custom Quantity) must be enabled." }, { status: 400 });
      }
      if (wsUnitEnabled && (wsUnitPriceVal === null || isNaN(wsUnitPriceVal) || wsUnitPriceVal < 0)) {
        return NextResponse.json({ error: "A valid non-negative wholesale unit price is required when Single Unit selling is enabled." }, { status: 400 });
      }
      if (wsBoxEnabled) {
        if (!wsUnitsPerBoxVal || isNaN(wsUnitsPerBoxVal) || wsUnitsPerBoxVal <= 0) {
          return NextResponse.json({ error: "Units per box must be a positive integer when Full Box selling is enabled." }, { status: 400 });
        }
        if (wsBoxPriceVal === null || isNaN(wsBoxPriceVal) || wsBoxPriceVal < 0) {
          return NextResponse.json({ error: "A valid non-negative wholesale box price is required when Full Box selling is enabled." }, { status: 400 });
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Resolve category_id (use direct category_id or lookup by slug)
    let category_id: string | null = incomingCatId || null;
    if (!category_id && category_slug) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      category_id = catData?.id ?? null;
    }

    // Specifications for subcategory metadata
    const specifications = subcategory_id
      ? { ...(incomingSpecs || {}), subcategory_id }
      : (incomingSpecs || null);

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
        brand_id: brand_id || null,
        category_id,
        specifications,
        description: description || null,
        benefits: benefits || null,
        ingredients: ingredients || null,
        usage_instructions: usage_instructions || null,
        retail_price: parseFloat(retail_price),
        compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
        tax_enabled: tax_enabled !== undefined ? !!tax_enabled : true,
        is_out_of_stock: !!is_out_of_stock,
        wholesale_price: wsUnitPriceVal ?? (wsBoxPriceVal && wsUnitsPerBoxVal ? wsBoxPriceVal / wsUnitsPerBoxVal : null),
        wholesale_moq: parseInt(wholesale_moq) || 1,
        wholesale_unit_enabled: wsUnitEnabled,
        wholesale_unit_price: wsUnitPriceVal,
        wholesale_box_enabled: wsBoxEnabled,
        wholesale_units_per_box: wsUnitsPerBoxVal,
        wholesale_box_price: wsBoxPriceVal,
        wholesale_custom_quantity_enabled: wsCustomEnabled,
        is_published: !!is_published,
        is_featured: !!is_featured,
        is_best_seller: !!is_best_seller,
        is_new_arrival: !!is_new_arrival,
        is_wholesale_available: isWs,
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
      if (imgErr) {
        return NextResponse.json({ error: `Failed to save product images: ${imgErr.message}` }, { status: 500 });
      }
    }

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
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name, slug, sku, category_slug, category_id: incomingCatId, brand_id, subcategory_id,
      description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, tax_enabled, is_out_of_stock, wholesale_price, wholesale_moq,
      wholesale_unit_enabled, wholesale_unit_price,
      wholesale_box_enabled, wholesale_units_per_box, wholesale_box_price,
      wholesale_custom_quantity_enabled,
      is_published, is_featured, is_best_seller, is_new_arrival, is_wholesale_available,
      images, specifications: incomingSpecs,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const isWs = is_wholesale_available !== undefined ? !!is_wholesale_available : true;
    const wsUnitEnabled = wholesale_unit_enabled !== undefined ? !!wholesale_unit_enabled : true;
    const wsBoxEnabled = wholesale_box_enabled !== undefined ? !!wholesale_box_enabled : false;
    const wsCustomEnabled = wholesale_custom_quantity_enabled !== undefined ? !!wholesale_custom_quantity_enabled : true;

    const wsUnitPriceVal = wholesale_unit_price !== undefined && wholesale_unit_price !== "" && wholesale_unit_price !== null
      ? parseFloat(wholesale_unit_price)
      : (wholesale_price !== undefined && wholesale_price !== "" && wholesale_price !== null ? parseFloat(wholesale_price) : null);

    const wsBoxPriceVal = wholesale_box_price !== undefined && wholesale_box_price !== "" && wholesale_box_price !== null ? parseFloat(wholesale_box_price) : null;
    const wsUnitsPerBoxVal = wholesale_units_per_box !== undefined && wholesale_units_per_box !== "" && wholesale_units_per_box !== null ? parseInt(wholesale_units_per_box, 10) : null;

    if (isWs) {
      if (!wsUnitEnabled && !wsBoxEnabled && !wsCustomEnabled) {
        return NextResponse.json({ error: "At least one wholesale purchasing method (Single Unit, Full Box, or Custom Quantity) must be enabled." }, { status: 400 });
      }
      if (wsUnitEnabled && (wsUnitPriceVal === null || isNaN(wsUnitPriceVal) || wsUnitPriceVal < 0)) {
        return NextResponse.json({ error: "A valid non-negative wholesale unit price is required when Single Unit selling is enabled." }, { status: 400 });
      }
      if (wsBoxEnabled) {
        if (!wsUnitsPerBoxVal || isNaN(wsUnitsPerBoxVal) || wsUnitsPerBoxVal <= 0) {
          return NextResponse.json({ error: "Units per box must be a positive integer when Full Box selling is enabled." }, { status: 400 });
        }
        if (wsBoxPriceVal === null || isNaN(wsBoxPriceVal) || wsBoxPriceVal < 0) {
          return NextResponse.json({ error: "A valid non-negative wholesale box price is required when Full Box selling is enabled." }, { status: 400 });
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Resolve category_id
    let category_id: string | null | undefined = undefined;
    if (incomingCatId !== undefined) {
      category_id = incomingCatId || null;
    } else if (category_slug) {
      const { data: catData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      category_id = catData?.id ?? null;
    }

    // Build update payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {
      name: name?.trim(),
      slug,
      sku,
      description: description || null,
      benefits: benefits || null,
      ingredients: ingredients || null,
      usage_instructions: usage_instructions || null,
      retail_price: parseFloat(retail_price),
      compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
      wholesale_price: wsUnitPriceVal ?? (wsBoxPriceVal && wsUnitsPerBoxVal ? wsBoxPriceVal / wsUnitsPerBoxVal : null),
      wholesale_moq: parseInt(wholesale_moq) || 1,
      wholesale_unit_enabled: wsUnitEnabled,
      wholesale_unit_price: wsUnitPriceVal,
      wholesale_box_enabled: wsBoxEnabled,
      wholesale_units_per_box: wsUnitsPerBoxVal,
      wholesale_box_price: wsBoxPriceVal,
      wholesale_custom_quantity_enabled: wsCustomEnabled,
      is_published: !!is_published,
      is_featured: !!is_featured,
      is_best_seller: !!is_best_seller,
      is_new_arrival: !!is_new_arrival,
      is_wholesale_available: isWs,
      status: is_published ? "published" : "draft",
      updated_at: new Date().toISOString(),
    };

    if (category_id !== undefined) {
      updatePayload.category_id = category_id;
    }
    if (brand_id !== undefined) {
      updatePayload.brand_id = brand_id || null;
    }
    if (tax_enabled !== undefined) {
      updatePayload.tax_enabled = !!tax_enabled;
    }
    if (is_out_of_stock !== undefined) {
      updatePayload.is_out_of_stock = !!is_out_of_stock;
    }
    if (subcategory_id !== undefined) {
      updatePayload.specifications = subcategory_id
        ? { ...(incomingSpecs || {}), subcategory_id }
        : null;
    }

    const { error: prodErr } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id);

    if (prodErr) {
      console.error("[API] Product update error:", prodErr);
      return NextResponse.json({ error: prodErr.message }, { status: 500 });
    }

    // Update images if provided
    if (images !== undefined && Array.isArray(images)) {
      // Find removed images to delete from Cloudinary
      const { data: currentImages } = await supabase
        .from("product_images")
        .select("cloudinary_public_id")
        .eq("product_id", id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newPublicIds = new Set(
        images.map((img: any) => img.public_id || img.cloudinary_public_id).filter(Boolean)
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const removedImages = (currentImages || []).filter(
        (img: any) => img.cloudinary_public_id && !newPublicIds.has(img.cloudinary_public_id)
      );

      await supabase.from("product_images").delete().eq("product_id", id);
      if (images.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageRows = images.map((img: any, idx: number) => ({
          product_id: id,
          cloudinary_public_id: img.public_id || img.cloudinary_public_id,
          secure_url: img.secure_url,
          is_primary: !!img.is_primary,
          sort_order: idx,
        }));
        const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
        if (imgErr) console.error("[API] Image update error:", imgErr);
      }

      // Cleanup removed images from Cloudinary
      for (const img of removedImages) {
        if (img.cloudinary_public_id) {
          try {
            await deleteFromCloudinary(img.cloudinary_public_id);
          } catch (cldErr) {
            console.error("[API] Cloudinary image cleanup error:", cldErr);
          }
        }
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
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Fetch existing product image public IDs before deleting rows
    const { data: existingImages } = await supabase
      .from("product_images")
      .select("cloudinary_public_id")
      .eq("product_id", id);

    // Delete related rows first (cascade may handle some, but be explicit)
    await supabase.from("product_images").delete().eq("product_id", id);

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      console.error("[API] Product delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clean up images from Cloudinary
    if (existingImages && Array.isArray(existingImages)) {
      for (const img of existingImages) {
        if (img.cloudinary_public_id) {
          try {
            await deleteFromCloudinary(img.cloudinary_public_id);
          } catch (cldErr) {
            console.error("[API] Cloudinary image deletion error:", cldErr);
          }
        }
      }
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
