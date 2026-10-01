import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";
import { calculateRetailOrderTotals, RETAIL_TAX_RATE } from "@/lib/pricing/retail";

export const dynamic = "force-dynamic";

const FREE_SHIPPING_THRESHOLD = 199; // AED
const STANDARD_SHIPPING_FEE = 20; // AED

// ── Ensure a profile row exists for the auth user (FK guard) ──────
async function ensureProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  fullName?: string | null,
  phone?: string | null
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from("profiles")
      .insert({
        id: userId,
        email,
        full_name: fullName ?? null,
        phone: phone ?? null,
        role: "customer",
      });
  }
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
    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile && profile.role !== "customer") {
      // Non-retail customer role (e.g. wholesale_customer) should not get retail orders
      return NextResponse.json({ orders: [] });
    }

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
        discount_amount,
        tax_amount,
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
      .eq("customer_type", "retail")
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

    // Verify user profile role if authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let verifiedUserId: string | null = null;
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin as any)
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.role === "wholesale_customer") {
        return NextResponse.json(
          { error: "Retail checkout is not available for this account." },
          { status: 403 }
        );
      }

      if (userId && user.id === userId) {
        verifiedUserId = user.id;
        await ensureProfile(
          admin,
          user.id,
          user.email ?? customerEmail,
          user.user_metadata?.full_name ?? customerName,
          user.user_metadata?.phone ?? customerPhone
        );
      }
    }

    // ── Server-Side Authoritative Pricing & Tax Verification ──────
    // 1. Fetch current product records from DB for verification
    const productIds = items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => item.productId)
      .filter((id: any) => typeof id === "string" && id.length > 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbProducts: any[] = [];
    if (productIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: prodErr } = await (admin as any)
        .from("products")
        .select("id, name, slug, sku, retail_price, tax_enabled, is_published, status")
        .in("id", productIds);

      if (!prodErr && data) {
        dbProducts = data;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productMap = new Map<string, any>(dbProducts.map((p) => [p.id, p]));

    interface VerifiedOrderItem {
      productId: string | null;
      name: string;
      sku: string;
      slug: string;
      image: string | null;
      price: number;
      quantity: number;
      taxEnabled: boolean;
      lineSubtotal: number;
      lineTax: number;
      lineTotal: number;
    }

    // 2. Build verified item details and authoritative pricing input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const verifiedItems: VerifiedOrderItem[] = items.map((rawItem: any) => {
      const dbProd = productMap.get(rawItem.productId);
      const verifiedPrice = dbProd ? Number(dbProd.retail_price) : (Number(rawItem.price) || 0);
      const isTaxable = dbProd ? dbProd.tax_enabled !== false : true;
      const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);
      const lineSubtotal = Math.round(verifiedPrice * qty * 100) / 100;
      const lineTax = isTaxable ? Math.round(lineSubtotal * RETAIL_TAX_RATE * 100) / 100 : 0;

      return {
        productId: rawItem.productId || null,
        name: dbProd?.name || rawItem.name || "Product",
        sku: dbProd?.sku || rawItem.sku || "AUR-PROD",
        slug: dbProd?.slug || rawItem.slug || "",
        image: rawItem.image || null,
        price: verifiedPrice,
        quantity: qty,
        taxEnabled: isTaxable,
        lineSubtotal,
        lineTax,
        lineTotal: lineSubtotal,
      };
    });

    // 3. Compute authoritative order totals
    const rawSubtotal = verifiedItems.reduce((sum: number, item: VerifiedOrderItem) => sum + item.lineSubtotal, 0);
    const authoritativeShipping = rawSubtotal >= FREE_SHIPPING_THRESHOLD || rawSubtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;

    const authoritativeTotals = calculateRetailOrderTotals(
      verifiedItems.map((it: VerifiedOrderItem) => ({
        price: it.price,
        quantity: it.quantity,
        tax_enabled: it.taxEnabled,
      })),
      authoritativeShipping,
      0 // No discount code applied by default
    );

    // Generate unique order number with timestamp + random entropy to eliminate collision
    const orderNumber = `AUR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Insert order with authoritative amounts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (admin as any)
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: verifiedUserId,
        customer_email: customerEmail.trim().toLowerCase(),
        customer_type: customerType || "retail",
        status: paymentMethod === "stripe" ? "pending" : "processing",
        payment_status: "pending", // Never hardcode as paid; verified only upon Stripe payment
        subtotal: authoritativeTotals.subtotal,
        discount_amount: authoritativeTotals.discountAmount,
        tax_amount: authoritativeTotals.taxAmount,
        shipping_amount: authoritativeTotals.shippingAmount,
        total: authoritativeTotals.total,
        shipping_address: {
          ...shippingAddress,
          payment_method: paymentMethod === "cod" ? "Normal Payment (COD)" : "Online Payment",
        },
        notes: notes
          ? `${notes}\n[Payment Method: ${paymentMethod === "cod" ? "Normal Payment (COD)" : "Online Payment"}]`
          : `[Payment Method: ${paymentMethod === "cod" ? "Normal Payment (COD)" : "Online Payment"}]`,
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

    // 5. Insert order items with authoritative snapshots
    if (verifiedItems.length > 0) {
      const orderItemsToInsert = verifiedItems.map((item: VerifiedOrderItem) => ({
        order_id: order.id,
        product_id: item.productId,
        product_snapshot: {
          name: item.name,
          image: item.image,
          slug: item.slug,
          tax_enabled: item.taxEnabled,
        },
        sku_snapshot: item.sku,
        price_snapshot: item.price,
        quantity: item.quantity,
        line_total: item.lineSubtotal,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (admin as any)
        .from("order_items")
        .insert(orderItemsToInsert);

      if (itemsError) {
        console.error("[Order items insert error]:", itemsError);
      }
    }

    // 6. If user requested saving this address to their account
    if (saveAddress && verifiedUserId) {
      try {
        if (isDefaultAddress) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from("addresses")
            .update({ is_default: false })
            .eq("user_id", verifiedUserId);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("addresses").insert({
          user_id: verifiedUserId,
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

    // 7. Handle Online Payment (Stripe Checkout Session)
    if (paymentMethod === "stripe") {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        return NextResponse.json(
          {
            error:
              "Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.",
          },
          { status: 500 }
        );
      }

      const { getStripe } = await import("@/lib/stripe/client");
      const stripe = getStripe();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      // Build Stripe line items from authoritative verified items
      const stripeLineItems = verifiedItems.map((item: VerifiedOrderItem) => ({
        price_data: {
          currency: "aed",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100),
        },
        quantity: item.quantity,
      }));

      // Add tax line item if applicable
      if (authoritativeTotals.taxAmount > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "aed",
            product_data: {
              name: "VAT (5%)",
              images: [],
            },
            unit_amount: Math.round(Number(authoritativeTotals.taxAmount) * 100),
          },
          quantity: 1,
        });
      }

      // Add shipping fee if applicable
      if (authoritativeTotals.shippingAmount > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "aed",
            product_data: {
              name: "UAE Delivery Fee",
              images: [],
            },
            unit_amount: Math.round(Number(authoritativeTotals.shippingAmount) * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: customerEmail.trim().toLowerCase(),
        client_reference_id: order.id,
        line_items: stripeLineItems,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
        cancel_url: `${siteUrl}/checkout?cancelled=true`,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("orders")
        .update({
          stripe_checkout_session_id: session.id,
        })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        orderNumber: order.order_number,
        orderId: order.id,
        checkoutUrl: session.url,
        paymentMethod: "stripe",
      });
    }

    // 8. For Normal Payment (Cash on Delivery): dispatch confirmation emails immediately
    const emailData = {
      orderNumber: order.order_number,
      customerName: customerName || "",
      customerEmail: customerEmail.trim().toLowerCase(),
      items: verifiedItems.map((item: VerifiedOrderItem) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        sku: item.sku,
        image: item.image,
      })),
      subtotal: authoritativeTotals.subtotal,
      taxAmount: authoritativeTotals.taxAmount,
      shippingAmount: authoritativeTotals.shippingAmount,
      total: authoritativeTotals.total,
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
      paymentMethod: "cod",
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
