import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";

export interface FinalizeStripeOrderResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any;
  error?: string;
  alreadyProcessed?: boolean;
}

// ── Ensure profile exists for auth user ─────────────────────────────
async function ensureProfile(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  email: string,
  fullName?: string | null,
  phone?: string | null
) {
  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName ?? null,
      phone: phone ?? null,
      role: "customer",
    });
  }
}

/**
 * Server-side authoritative finalization of a Stripe Checkout Session.
 * Idempotently creates or confirms an order in the database upon verified payment.
 */
export async function finalizeStripeOrder(
  session: Stripe.Checkout.Session,
  stripeEventId?: string
): Promise<FinalizeStripeOrderResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  if (session.payment_status !== "paid") {
    return {
      success: false,
      error: "Payment has not been completed on Stripe.",
    };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

  // ── 1. Check if order already exists for this session ID ───────────
  const { data: existingOrder } = await admin
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
        line_total
      )
    `)
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingOrder) {
    // If order was pending, mark as paid / processing
    if (existingOrder.payment_status !== "paid") {
      await admin
        .from("orders")
        .update({
          status: "processing",
          payment_status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingOrder.id);
      existingOrder.payment_status = "paid";
      existingOrder.status = "processing";
    }

    // Ensure payment record exists
    try {
      const { data: existingPayment } = await admin
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();

      if (!existingPayment) {
        await admin.from("payments").insert({
          order_id: existingOrder.id,
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: session.id,
          stripe_event_id: stripeEventId || null,
          amount: session.amount_total ?? Math.round(Number(existingOrder.total) * 100),
          currency: session.currency ?? "aed",
          status: "paid",
          payment_method: session.payment_method_types?.[0] ?? "card",
        });
      }
    } catch (payErr) {
      console.warn("[Stripe Fulfillment] payments insert warning:", payErr);
    }

    return {
      success: true,
      order: existingOrder,
      alreadyProcessed: true,
    };
  }

  // ── 2. Create the new order from session metadata ───────────────────
  const meta = session.metadata || {};
  const userId = meta.user_id || session.client_reference_id || null;
  const customerEmail =
    (meta.customer_email || session.customer_details?.email || "").trim().toLowerCase();
  const customerName = meta.customer_name || session.customer_details?.name || "";
  const customerPhone = meta.customer_phone || session.customer_details?.phone || "";
  const notes = meta.notes || "";

  let shippingAddress: Record<string, unknown> = {};
  if (meta.shipping_address) {
    try {
      shippingAddress = JSON.parse(meta.shipping_address);
    } catch {
      shippingAddress = {
        fullName: customerName,
        phone: customerPhone,
        email: customerEmail,
        streetAddress: "Standard Address",
        city: "Dubai",
        country: "AE",
      };
    }
  }

  // Parse verified order items
  interface MinifiedItem {
    id?: string | null;
    name?: string;
    sku?: string;
    slug?: string;
    image?: string | null;
    price?: number;
    quantity?: number;
    taxEnabled?: boolean;
    lineTotal?: number;
    isCombo?: boolean;
    comboId?: string | null;
    components?: Array<{
      product_id: string;
      name: string;
      sku?: string;
      quantity: number;
      image?: string | null;
      retail_price?: number;
    }>;
  }

  let items: MinifiedItem[] = [];
  if (meta.items_data) {
    try {
      items = JSON.parse(meta.items_data);
    } catch {
      items = [];
    }
  }

  // Fallback if items were chunked across metadata keys
  if (items.length === 0) {
    let combined = "";
    for (let i = 0; i < 10; i++) {
      if (meta[`items_data_${i}`]) {
        combined += meta[`items_data_${i}`];
      }
    }
    if (combined) {
      try {
        items = JSON.parse(combined);
      } catch {
        items = [];
      }
    }
  }

  const subtotal = Number(meta.subtotal || 0);
  const taxAmount = Number(meta.tax_amount || 0);
  const shippingAmount = Number(meta.shipping_amount || 0);
  const total = Number(meta.total || (session.amount_total ? session.amount_total / 100 : 0));

  if (userId) {
    try {
      await ensureProfile(admin, userId, customerEmail, customerName, customerPhone);
    } catch (profileErr) {
      console.warn("[Stripe Fulfillment] ensureProfile warning:", profileErr);
    }
  }

  // Verify availability before creating order
  const productIds = items.filter((i) => !i.isCombo && !i.comboId && i.id).map((i) => i.id as string);
  const comboIds = items.filter((i) => (i.isCombo || i.comboId) && (i.comboId || i.id)).map((i) => (i.comboId || i.id) as string);

  if (productIds.length > 0) {
    const { data: prods } = await admin
      .from("products")
      .select("id, name, is_published, status, is_out_of_stock")
      .in("id", productIds);

    for (const p of prods || []) {
      const isListed = (p.status === undefined || p.status === "published") && (p.is_published === undefined || p.is_published === true);
      if (!isListed || p.is_out_of_stock) {
        console.error(`[Stripe Fulfillment] Product ${p.name} (${p.id}) is unavailable or out of stock.`);
        return {
          success: false,
          error: `Product "${p.name}" is currently out of stock or unavailable.`,
        };
      }
    }
  }

  if (comboIds.length > 0) {
    const { data: combos } = await admin
      .from("combo_offers")
      .select("id, name, is_active, is_out_of_stock")
      .in("id", comboIds);

    for (const c of combos || []) {
      if (!c.is_active || c.is_out_of_stock) {
        console.error(`[Stripe Fulfillment] Combo ${c.name} (${c.id}) is inactive or out of stock.`);
        return {
          success: false,
          error: `Combo "${c.name}" is currently out of stock or inactive.`,
        };
      }
    }
  }

  // Generate unique order reference
  const orderNumber = `AUR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

  // Insert Order
  const { data: newOrder, error: orderInsertError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_email: customerEmail,
      customer_type: "retail",
      status: "processing",
      payment_status: "paid",
      subtotal,
      discount_amount: 0,
      tax_amount: taxAmount,
      shipping_amount: shippingAmount,
      total,
      shipping_address: {
        ...shippingAddress,
        payment_method: "Online Payment",
      },
      notes: notes
        ? `${notes}\n[Payment Method: Online Payment (Stripe)]`
        : `[Payment Method: Online Payment (Stripe)]`,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    })
    .select()
    .single();

  if (orderInsertError || !newOrder) {
    console.error("[Stripe Fulfillment] Failed to insert order:", orderInsertError);
    return {
      success: false,
      error: orderInsertError?.message || "Failed to create order in database.",
    };
  }

  // Insert Order Items
  if (items.length > 0) {
    const orderItemsToInsert = items.map((item) => {
      const isCombo = Boolean(item.isCombo || item.comboId);
      return {
        order_id: newOrder.id,
        product_id: isCombo ? null : item.id || null,
        combo_id: item.comboId || (isCombo ? item.id : null),
        product_snapshot: {
          name: item.name || "Product",
          image: item.image || null,
          slug: item.slug || "",
          tax_enabled: item.taxEnabled !== false,
          is_combo: isCombo,
          combo_id: item.comboId || (isCombo ? item.id : null),
          original_price: (item as any).original_price ?? (item as any).originalPrice ?? undefined,
          compare_at_price: (item as any).compare_at_price ?? (item as any).compareAtPrice ?? undefined,
          savings_amount: (item as any).savings_amount ?? (item as any).savingsAmount ?? undefined,
          savings_percentage: (item as any).savings_percentage ?? (item as any).savingsPercentage ?? undefined,
          components: item.components || [],
        },
        sku_snapshot: item.sku || "AUR-ITEM",
        price_snapshot: item.price || 0,
        quantity: item.quantity || 1,
        line_total: item.lineTotal || (Number(item.price || 0) * Number(item.quantity || 1)),
      };
    });

    const { error: itemsError } = await admin.from("order_items").insert(orderItemsToInsert);
    if (itemsError) {
      console.error("[Stripe Fulfillment] Failed to insert order items:", itemsError);
    }
  }

  // Insert Payment Record
  try {
    await admin.from("payments").insert({
      order_id: newOrder.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      stripe_event_id: stripeEventId || null,
      amount: session.amount_total ?? Math.round(total * 100),
      currency: session.currency ?? "aed",
      status: "paid",
      payment_method: session.payment_method_types?.[0] ?? "card",
    });
  } catch (payInsertErr) {
    console.warn("[Stripe Fulfillment] payment insert error:", payInsertErr);
  }

  // If user requested saving this address to their account
  if (meta.save_address === "true" && userId) {
    try {
      const isDefault = meta.is_default_address === "true";
      if (isDefault) {
        await admin.from("addresses").update({ is_default: false }).eq("user_id", userId);
      }

      await admin.from("addresses").insert({
        user_id: userId,
        label: (shippingAddress.label as string) || "Home",
        full_name: customerName || (shippingAddress.fullName as string),
        phone: customerPhone || (shippingAddress.phone as string),
        address_line1: (shippingAddress.streetAddress as string) || (shippingAddress.addressLine1 as string) || "",
        address_line2: (shippingAddress.area as string) || (shippingAddress.addressLine2 as string) || null,
        city: (shippingAddress.emirate as string) || (shippingAddress.city as string) || "Dubai",
        state: (shippingAddress.emirate as string) || (shippingAddress.city as string) || "Dubai",
        country: (shippingAddress.country as string) || "AE",
        is_default: isDefault,
      });
    } catch (saveAddrErr) {
      console.warn("[Stripe Fulfillment] Save address warning:", saveAddrErr);
    }
  }

  // Dispatch Confirmation Emails
  try {
    const emailData = {
      orderNumber: newOrder.order_number,
      customerName: customerName || "",
      customerEmail,
      items: items.map((item) => ({
        name: item.name || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        sku: item.sku,
        image: item.image,
      })),
      subtotal,
      taxAmount,
      shippingAmount,
      total,
      shippingAddress: shippingAddress as any,
      paymentMethod: "stripe",
    };

    Promise.all([
      sendOrderConfirmationEmail(emailData),
      sendAdminOrderNotificationEmail(emailData),
    ]).catch((err) => console.error("[Stripe Fulfillment] Email send error:", err));
  } catch (emailErr) {
    console.warn("[Stripe Fulfillment] Email dispatch warning:", emailErr);
  }

  return {
    success: true,
    order: {
      ...newOrder,
      order_items: items,
    },
  };
}
