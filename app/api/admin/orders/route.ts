import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get("aurelle_admin_session");

    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
        customer_email,
        customer_type,
        total,
        subtotal,
        discount_amount,
        shipping_amount,
        status,
        payment_status,
        created_at,
        shipping_address,
        notes,
        order_items ( id, product_id, product_snapshot, sku_snapshot, price_snapshot, quantity, line_total )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Orders API] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allOrders = data || [];

    // Sync any wholesale_applications that haven't been created in orders yet
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: apps } = await (admin as any)
        .from("wholesale_applications")
        .select("*");

      if (Array.isArray(apps) && apps.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingNotes = allOrders.map((o: any) => o.notes || "");

        for (const app of apps) {
          const appMarker = `[Wholesale Application ID: ${app.id}]`;
          const alreadySynced = existingNotes.some((n: string) => n.includes(appMarker));

          if (!alreadySynced) {
            const notesText = app.notes || "";
            const prodMatch = notesText.match(/Selected Product:\s*([^\n\r]+)/i);
            const catMatch = notesText.match(/Selected Category:\s*([^\n\r]+)/i);
            const qtyMatch = notesText.match(/Estimated Quantity[^\:]*:\s*([^\n\r]+)/i);

            const extractedProdName = prodMatch ? prodMatch[1].trim() : (app.business_name || "Wholesale B2B Consignment");
            const rawQtyStr = qtyMatch ? qtyMatch[1] : (app.expected_order_volume || "1");
            const extractedQty = parseInt(String(rawQtyStr).replace(/\D/g, ""), 10) || 1;

            const orderNum = `B2B-${new Date(app.created_at || Date.now()).getFullYear()}-${app.id.replace(/\D/g, "").slice(0, 5) || Math.floor(10000 + Math.random() * 90000)}`;
            const orderStatus = app.status === "approved" ? "delivered" : app.status === "rejected" ? "cancelled" : "pending";

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: insertedOrder } = await (admin as any)
              .from("orders")
              .insert({
                order_number: orderNum,
                customer_email: app.email,
                customer_type: "wholesale",
                status: orderStatus,
                payment_status: "pending",
                subtotal: 0,
                total: 0,
                discount_amount: 0,
                shipping_amount: 0,
                tax_amount: 0,
                shipping_address: {
                  fullName: app.contact_person,
                  companyName: app.business_name,
                  phone: app.phone,
                  city: "Dubai",
                  country: app.country || "United Arab Emirates",
                },
                notes: `${appMarker}\n${notesText}`,
                created_at: app.created_at || new Date().toISOString(),
              })
              .select(`
                id,
                order_number,
                customer_email,
                customer_type,
                total,
                subtotal,
                discount_amount,
                shipping_amount,
                status,
                payment_status,
                created_at,
                shipping_address,
                notes
              `)
              .single();

            if (insertedOrder) {
              // Try to find matching product in products table to get thumbnail and price
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let foundProduct: any = null;
              if (prodMatch) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: pMatch } = await (admin as any)
                  .from("products")
                  .select("id, name, slug, primary_image_url, wholesale_price, price, sku")
                  .ilike("name", `%${prodMatch[1].trim()}%`)
                  .limit(1)
                  .single();
                foundProduct = pMatch;
              }

              const itemPrice = foundProduct?.wholesale_price || foundProduct?.price || 0;
              const lineTotal = itemPrice * extractedQty;

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: insertedItem } = await (admin as any)
                .from("order_items")
                .insert({
                  order_id: insertedOrder.id,
                  product_id: foundProduct?.id || null,
                  product_snapshot: {
                    name: foundProduct?.name || extractedProdName,
                    image: foundProduct?.primary_image_url || null,
                    slug: foundProduct?.slug || "",
                    category: catMatch ? catMatch[1].trim() : "",
                  },
                  sku_snapshot: foundProduct?.sku || "B2B-WHOLESALE",
                  price_snapshot: itemPrice,
                  quantity: extractedQty,
                  line_total: lineTotal,
                })
                .select("id, product_id, product_snapshot, sku_snapshot, price_snapshot, quantity, line_total")
                .single();

              if (lineTotal > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (admin as any)
                  .from("orders")
                  .update({ subtotal: lineTotal, total: lineTotal })
                  .eq("id", insertedOrder.id);
                insertedOrder.subtotal = lineTotal;
                insertedOrder.total = lineTotal;
              }

              insertedOrder.order_items = insertedItem ? [insertedItem] : [];
              allOrders.unshift(insertedOrder);
            }
          }
        }
      }
    } catch (syncErr) {
      console.warn("[Admin Orders API] wholesale sync error (non-fatal):", syncErr);
    }

    return NextResponse.json({
      success: true,
      orders: allOrders,
    });
  } catch (err) {
    console.error("[Admin Orders API] exception:", err);
    return NextResponse.json({ error: "Failed to load orders." }, { status: 500 });
  }
}
