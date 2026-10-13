import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();
    const phone = searchParams.get("phone")?.trim();

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Please enter your Order Number." },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "Please enter the Email address or Phone number used during checkout." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    // Query order by order_number (case-insensitive)
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        user_id,
        customer_email,
        customer_type,
        status,
        payment_status,
        subtotal,
        discount_amount,
        tax_amount,
        shipping_amount,
        total,
        shipping_address,
        notes,
        tracking_url,
        created_at,
        updated_at,
        order_items (
          id,
          quantity,
          line_total,
          price_snapshot,
          sku_snapshot,
          product_snapshot
        )
      `)
      .ilike("order_number", orderNumber)
      .maybeSingle();

    if (error) {
      console.error("[Track Order API error]:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Unable to retrieve order details. Please try again." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: "No order found with this order number. Please verify your details." },
        { status: 404 }
      );
    }

    // Security check: Must match email OR phone
    const orderEmail = (order.customer_email || order.shipping_address?.email || "").toLowerCase().trim();
    const orderPhone = (order.customer_phone || order.shipping_address?.phone || "").replace(/[^0-9]/g, "");
    const inputPhone = (phone || "").replace(/[^0-9]/g, "");

    const emailMatches = email && orderEmail && orderEmail === email;
    const phoneMatches = inputPhone && orderPhone && (orderPhone.endsWith(inputPhone) || inputPhone.endsWith(orderPhone));

    if (!emailMatches && !phoneMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "The email or phone number does not match this order. Please verify your information.",
        },
        { status: 403 }
      );
    }

    // Format items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.order_items || []).map((it: any) => {
      const snap = it.product_snapshot || {};
      return {
        id: it.id,
        name: snap.name || "Product",
        image: snap.image || null,
        slug: snap.slug || "",
        sku: it.sku_snapshot || snap.sku || "",
        quantity: it.quantity || 1,
        price: Number(it.price_snapshot || 0),
        lineTotal: Number(it.line_total || 0),
      };
    });

    // Detect payment method label
    let paymentMethodLabel = "Cash on Delivery";
    const notesLower = (order.notes || "").toLowerCase();
    const addrMethod = order.shipping_address?.payment_method?.toLowerCase() || "";
    if (notesLower.includes("stripe") || addrMethod.includes("online") || notesLower.includes("online")) {
      paymentMethodLabel = "Online Payment (Card / Apple Pay)";
    } else if (notesLower.includes("cod") || addrMethod.includes("cod") || addrMethod.includes("cash")) {
      paymentMethodLabel = "Normal Payment (Cash on Delivery)";
    }

    const isPaidOnline =
      paymentMethodLabel.includes("Online") ||
      String(order.payment_status).toLowerCase() === "paid" ||
      Boolean(order.stripe_payment_intent_id) ||
      Boolean(order.stripe_checkout_session_id);

    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status || "processing",
      paymentStatus: order.payment_status || "pending",
      paymentMethodLabel,
      isPaidOnline,
      subtotal: Number(order.subtotal || 0),
      discountAmount: Number(order.discount_amount || 0),
      taxAmount: Number(order.tax_amount || 0),
      shippingAmount: Number(order.shipping_amount || 0),
      total: Number(order.total || 0),
      shippingAddress: order.shipping_address || {},
      trackingUrl: order.tracking_url || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items,
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder,
    });
  } catch (err: any) {
    console.error("[Track Order unexpected error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
