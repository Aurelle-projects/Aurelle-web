import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateWholesaleItemPrice, calculateWholesaleOrderSubtotal, PurchaseMode } from "@/lib/wholesale/pricing";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in with your approved B2B wholesale account." },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    // 1. Verify user profile role
    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, full_name, phone, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "wholesale_customer") {
      return NextResponse.json(
        {
          error:
            "Access denied. Wholesale ordering requires an approved B2B wholesale account (wholesale_customer). Pending or retail accounts cannot place wholesale orders.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      shippingAddress,
      notes,
      companyName,
      contactPerson,
      phone,
      items: incomingItems,
    } = body;

    if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city) {
      return NextResponse.json(
        { error: "Complete delivery address is required." },
        { status: 400 }
      );
    }

    // 2. Load Wholesale Cart items from DB or incoming payload
    let rawItems: Array<{
      productId: string;
      purchaseMode: PurchaseMode;
      quantity: number;
    }> = [];

    const { data: cart } = await admin
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .eq("cart_type", "wholesale")
      .maybeSingle();

    if (cart?.id) {
      const { data: dbCartItems } = await admin
        .from("cart_items")
        .select("product_id, quantity, purchase_mode")
        .eq("cart_id", cart.id);

      if (dbCartItems && dbCartItems.length > 0) {
        rawItems = dbCartItems.map((ci: any) => ({
          productId: ci.product_id,
          purchaseMode: (ci.purchase_mode || "unit") as PurchaseMode,
          quantity: ci.quantity,
        }));
      }
    }

    // Fallback to validated incoming payload if DB cart was transient
    if (rawItems.length === 0 && Array.isArray(incomingItems) && incomingItems.length > 0) {
      rawItems = incomingItems.map((i: any) => ({
        productId: i.productId,
        purchaseMode: (i.purchaseMode || "unit") as PurchaseMode,
        quantity: parseInt(i.quantity, 10) || 1,
      }));
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "Your wholesale cart is empty. Please add items before placing an order." },
        { status: 400 }
      );
    }

    // 3. SERVER-SIDE AUTHORITATIVE RECALCULATION
    const calculatedOrderItems: Array<{
      productId: string;
      productName: string;
      sku: string;
      image: string | null;
      purchaseMode: PurchaseMode;
      quantity: number;
      unitsPerBox: number | null;
      totalUnits: number;
      priceSnapshot: number;
      lineTotal: number;
    }> = [];

    for (const item of rawItems) {
      // Load current product data from DB
      const { data: dbProd, error: prodErr } = await admin
        .from("products")
        .select(`
          id, name, slug, sku, is_wholesale_available, wholesale_price,
          wholesale_unit_enabled, wholesale_unit_price, wholesale_box_enabled,
          wholesale_units_per_box, wholesale_box_price, wholesale_custom_quantity_enabled,
          product_images(secure_url, is_primary)
        `)
        .eq("id", item.productId)
        .single();

      if (prodErr || !dbProd) {
        return NextResponse.json(
          { error: `Product ${item.productId} was not found in catalog.` },
          { status: 400 }
        );
      }

      if (!dbProd.is_wholesale_available) {
        return NextResponse.json(
          { error: `Product ${dbProd.name} is no longer available for wholesale purchase.` },
          { status: 400 }
        );
      }

      // Load active tiers
      const { data: dbTiers } = await admin
        .from("wholesale_price_tiers")
        .select("*")
        .eq("product_id", item.productId)
        .eq("is_active", true);

      // Server recalculation
      const calculation = calculateWholesaleItemPrice(
        dbProd,
        dbTiers || [],
        item.purchaseMode,
        item.quantity
      );

      const primaryImg = dbProd.product_images?.find((img: any) => img.is_primary)?.secure_url ||
        dbProd.product_images?.[0]?.secure_url || null;

      calculatedOrderItems.push({
        productId: dbProd.id,
        productName: dbProd.name,
        sku: dbProd.sku,
        image: primaryImg,
        purchaseMode: calculation.purchaseMode,
        quantity: calculation.quantity,
        unitsPerBox: calculation.unitsPerBox,
        totalUnits: calculation.totalUnits,
        priceSnapshot: calculation.effectiveUnitPrice,
        lineTotal: calculation.subtotal,
      });
    }

    // Recalculate subtotal server-side
    const { subtotal } = calculateWholesaleOrderSubtotal(
      calculatedOrderItems.map((i) => ({
        purchaseMode: i.purchaseMode,
        quantity: i.quantity,
        totalUnits: i.totalUnits,
        unitsPerBox: i.unitsPerBox,
        unitPrice: i.priceSnapshot,
        boxPrice: i.purchaseMode === "box" ? i.priceSnapshot : null,
        tierPriceApplied: null,
        effectiveUnitPrice: i.priceSnapshot,
        subtotal: i.lineTotal,
      }))
    );

    // 4. Create unique Wholesale Order Number (AUR-WS-2026-XXXXX)
    const orderNumber = `AUR-WS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

    const fullShippingAddress = {
      company_name: companyName || profile.company_name || "",
      contact_person: contactPerson || profile.full_name || "",
      phone: phone || profile.phone || "",
      address_line1: shippingAddress.addressLine1,
      address_line2: shippingAddress.addressLine2 || null,
      city: shippingAddress.city,
      state: shippingAddress.state || shippingAddress.city,
      country: shippingAddress.country || "AE",
      payment_terms: "Direct B2B Invoice (WhatsApp/Phone Payment Settlement)",
    };

    // 5. Insert order
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        customer_email: user.email,
        customer_type: "wholesale",
        status: "pending",
        payment_status: "pending",
        subtotal,
        discount_amount: 0,
        tax_amount: 0, // Tax is future phase
        shipping_amount: 0,
        total: subtotal,
        shipping_address: fullShippingAddress,
        notes: notes
          ? `${notes}\n[B2B Wholesale Order - Payment to be settled directly with Aurelle team]`
          : `[B2B Wholesale Order - Payment to be settled directly with Aurelle team]`,
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error("[Wholesale Order insert error]:", orderErr);
      return NextResponse.json(
        { error: orderErr?.message || "Failed to create wholesale order." },
        { status: 500 }
      );
    }

    // 6. Insert order items with snapshot
    const orderItemsToInsert = calculatedOrderItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_snapshot: {
        name: item.productName,
        image: item.image,
        sku: item.sku,
        purchase_mode: item.purchaseMode,
        units_per_box: item.unitsPerBox,
        total_units: item.totalUnits,
      },
      sku_snapshot: item.sku,
      price_snapshot: item.priceSnapshot,
      quantity: item.quantity,
      line_total: item.lineTotal,
    }));

    const { error: itemsErr } = await admin.from("order_items").insert(orderItemsToInsert);

    if (itemsErr) {
      console.error("[Wholesale Order items insert error]:", itemsErr);
    }

    // 7. Clear Wholesale Cart in DB
    if (cart?.id) {
      await admin.from("cart_items").delete().eq("cart_id", cart.id);
    }

    // 8. Dispatch notification emails asynchronously
    const emailData = {
      orderNumber: order.order_number,
      customerName: contactPerson || profile.full_name || "Wholesale Customer",
      customerEmail: user.email,
      items: calculatedOrderItems.map((i) => ({
        name: `${i.productName} (${i.purchaseMode.toUpperCase()} mode - ${i.totalUnits} pcs total)`,
        price: i.priceSnapshot,
        quantity: i.quantity,
        sku: i.sku,
        image: i.image,
      })),
      subtotal,
      shippingAmount: 0,
      total: subtotal,
      shippingAddress: fullShippingAddress,
      paymentMethod: "B2B Invoice (WhatsApp/Phone Direct Settlement)",
    };

    Promise.all([
      sendOrderConfirmationEmail(emailData as any),
      sendAdminOrderNotificationEmail(emailData as any),
    ]).catch((err) => console.error("[Wholesale Orders] Email notification warning:", err));

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
      message: "Wholesale order placed successfully! Aurelle team will contact you directly regarding confirmation and payment settlement.",
    });
  } catch (err: any) {
    console.error("[Wholesale Orders POST exception]:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process wholesale order." },
      { status: 500 }
    );
  }
}
