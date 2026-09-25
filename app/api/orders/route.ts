import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

// ── Ensure a profile row exists for the auth user (FK guard) ──────
async function ensureProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  fullName?: string | null,
  phone?: string | null
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any)
    .from("profiles")
    .upsert(
      { id: userId, email, full_name: fullName ?? null, phone: phone ?? null, role: "customer" },
      { onConflict: "id" }
    );
}

// ── GET: List user's orders ───────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: orders, error } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
        user_id,
        customer_email,
        status,
        payment_status,
        subtotal,
        shipping_amount,
        total,
        shipping_address,
        notes,
        created_at,
        order_items (
          id,
          product_id,
          product_snapshot,
          sku_snapshot,
          price_snapshot,
          quantity,
          line_total,
          products (
            id,
            product_images (
              secure_url,
              is_primary
            )
          )
        )
      `)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Orders GET error]:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = (orders || []).map((ord: any) => ({
      ...ord,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      order_items: (ord.order_items || []).map((item: any) => {
        const snap = item.product_snapshot || {};
        const fallbackImg =
          item.products?.product_images?.find((img: any) => img.is_primary)?.secure_url ||
          item.products?.product_images?.[0]?.secure_url ||
          null;

        return {
          ...item,
          product_snapshot: {
            ...snap,
            image: snap.image || fallbackImg,
          },
        };
      }),
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (err) {
    console.error("[Orders GET exception]:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// ── POST: Place new order ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      items,
      subtotal,
      shippingAmount,
      total,
      taxAmount = 0,
      customerType = "retail",
      paymentMethod = "stripe",
      notes,
      saveAddress = false,
      isDefaultAddress = false,
    } = body;

    if (!customerEmail || !shippingAddress || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Incomplete order details. Please review your cart and shipping info." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Ensure profile exists before writing orders (FK guard)
    if (userId) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await ensureProfile(
          admin,
          user.id,
          user.email ?? customerEmail,
          user.user_metadata?.full_name ?? customerName,
          user.user_metadata?.phone ?? customerPhone
        );
      }
    }

    // Generate unique order number (e.g. AUR-2026-84920)
    const orderNumber = `AUR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // 1. Insert order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (admin as any)
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        customer_email: customerEmail.trim().toLowerCase(),
        customer_type: customerType || "retail",
        status: "processing",
        payment_status: paymentMethod === "stripe" ? "paid" : "pending",
        subtotal: subtotal || 0,
        discount_amount: 0,
        tax_amount: taxAmount || 0,
        shipping_amount: shippingAmount || 0,
        total: total || 0,
        shipping_address: shippingAddress,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Order insert error]:", orderError);
      return NextResponse.json(
        { error: orderError?.message || "Failed to create order record." },
        { status: 500 }
      );
    }

    // 2. Insert order items
    if (items && items.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderItemsToInsert = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_snapshot: {
          name: item.name || "Product",
          image: item.image || null,
          slug: item.slug || "",
        },
        sku_snapshot: item.sku || "AUR-PROD",
        price_snapshot: item.price || 0,
        quantity: item.quantity || 1,
        line_total: (item.price || 0) * (item.quantity || 1),
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (admin as any)
        .from("order_items")
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error("[Order items insert error]:", itemsError);
      }
    }

    // 3. If user requested saving this address to their account
    if (saveAddress && userId) {
      try {
        if (isDefaultAddress) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from("addresses")
            .update({ is_default: false })
            .eq("user_id", userId);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("addresses").insert({
          user_id: userId,
          label: shippingAddress.label || "Home",
          full_name: customerName || shippingAddress.fullName,
          phone: customerPhone || shippingAddress.phone,
          address_line1: shippingAddress.streetAddress || shippingAddress.addressLine1,
          address_line2: shippingAddress.area || shippingAddress.addressLine2 || null,
          city: shippingAddress.emirate || shippingAddress.city || "Dubai",
          state: shippingAddress.emirate || shippingAddress.city || "Dubai",
          country: shippingAddress.country || "AE",
          is_default: Boolean(isDefaultAddress),
        });
      } catch (saveAddrErr) {
        console.warn("[Save address during checkout warning]:", saveAddrErr);
      }
    }

    // 4. Send transactional emails (fire-and-forget — never block the order response)
    const emailData = {
      orderNumber: order.order_number,
      customerName: customerName || "",
      customerEmail: customerEmail.trim().toLowerCase(),
      items: (items ?? []).map((item: { name?: string; price?: number; quantity?: number; sku?: string; image?: string }) => ({
        name: item.name || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        sku: item.sku,
        image: item.image,
      })),
      subtotal: subtotal || 0,
      shippingAmount: shippingAmount || 0,
      total: total || 0,
      shippingAddress: shippingAddress || {},
      paymentMethod,
    };

    Promise.all([
      sendOrderConfirmationEmail(emailData),
      sendAdminOrderNotificationEmail(emailData),
    ]).catch((err) => console.error("[Orders] Email send error:", err));

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
      orderId: order.id,
      message: "Order placed successfully!",
    });
  } catch (err) {
    console.error("[Orders POST exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to place order." },
      { status: 500 }
    );
  }
}
