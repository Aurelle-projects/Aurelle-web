import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";
import { calculateRetailOrderTotals, RETAIL_TAX_RATE } from "@/lib/pricing/retail";
import { getProductStockQuantity } from "@/lib/products/inventory";

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

// ── Atomic stock reduction ──────────────────────────────────────────
async function reduceStockForOrder(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("product_id, combo_id, quantity, sku_snapshot, product_snapshot")
    .eq("order_id", orderId);

  if (error || !orderItems?.length) return;

  for (const item of orderItems) {
    const snap = item.product_snapshot || {};
    // If item is a combo offer, atomically decrement each component's stock
    if ((snap.is_combo || item.combo_id) && Array.isArray(snap.components) && snap.components.length > 0) {
      for (const comp of snap.components) {
        if (!comp.product_id) continue;
        const totalUnits = Math.max(1, (comp.quantity || 1) * (item.quantity || 1));
        try {
          await supabase.rpc("decrement_stock", {
            p_product_id: comp.product_id,
            p_quantity: totalUnits,
          });
        } catch (stockErr) {
          console.warn(
            "[Orders API] decrement_stock warning for combo component",
            comp.product_id,
            stockErr
          );
        }
      }
    } else if (item.product_id) {
      try {
        await supabase.rpc("decrement_stock", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      } catch (stockErr) {
        console.warn("[Orders API] decrement_stock warning for product", item.product_id, stockErr);
      }
    }
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

    // ── Server-Side Authoritative Pricing, Stock & Tax Verification ──────
    // 1. Separate regular product IDs and combo IDs
    const comboIds = items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((it: any) => it.isCombo || it.comboId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((it: any) => it.comboId || it.productId)
      .filter((id: unknown) => typeof id === "string" && (id as string).length > 0);

    const regularProductIds = items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((it: any) => !it.isCombo && !it.comboId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((it: any) => it.productId)
      .filter((id: unknown) => typeof id === "string" && (id as string).length > 0);

    // Fetch matching products
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbProducts: any[] = [];
    if (regularProductIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: prodErr } = await (admin as any)
        .from("products")
        .select(`
          id, name, slug, sku, retail_price, tax_enabled, is_published, status,
          inventory ( stock_quantity, stock_status )
        `)
        .in("id", regularProductIds);

      if (!prodErr && data) {
        dbProducts = data;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productMap = new Map<string, any>(dbProducts.map((p) => [p.id, p]));

    // Fetch matching combos with components and inventory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbCombos: any[] = [];
    if (comboIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: comboData, error: comboErr } = await (admin as any)
        .from("combo_offers")
        .select(`
          id, name, slug, sku, price, compare_at_price, tax_enabled, is_active, primary_image_url,
          combo_offer_items (
            id, product_id, quantity, sort_order,
            products (
              id, name, slug, sku, retail_price, is_published, status,
              product_images ( secure_url, is_primary ),
              inventory ( stock_quantity, stock_status )
            )
          )
        `)
        .in("id", comboIds);

      if (!comboErr && comboData) {
        dbCombos = comboData;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comboMap = new Map<string, any>(dbCombos.map((c) => [c.id, c]));

    interface VerifiedOrderItem {
      productId: string | null;
      comboId: string | null;
      isCombo: boolean;
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
      components?: Array<{
        product_id: string;
        name: string;
        sku?: string;
        quantity: number;
        image?: string | null;
        retail_price?: number;
      }>;
    }

    // 2. Build verified item details and authoritative pricing input
    const verifiedItems: VerifiedOrderItem[] = [];

    for (const rawItem of items) {
      const isComboItem = Boolean(
        rawItem.isCombo || rawItem.comboId || comboMap.has(rawItem.productId)
      );
      const targetId = isComboItem ? rawItem.comboId || rawItem.productId : rawItem.productId;
      const qty = Math.max(1, parseInt(rawItem.quantity, 10) || 1);

      if (isComboItem) {
        const dbCombo = comboMap.get(targetId);
        if (!dbCombo || !dbCombo.is_active) {
          return NextResponse.json(
            {
              error: `The combo offer "${rawItem.name || "Selected Combo"}" is currently unavailable or inactive.`,
            },
            { status: 400 }
          );
        }

        const comboItems = dbCombo.combo_offer_items || [];
        if (comboItems.length === 0) {
          return NextResponse.json(
            { error: `The combo offer "${dbCombo.name}" has no available components.` },
            { status: 400 }
          );
        }

        // Verify stock availability for every component product
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const componentsSnapshot: any[] = [];
        for (const ci of comboItems) {
          const compProd = ci.products;
          const isListed =
            compProd &&
            (compProd.status === undefined || compProd.status === "published") &&
            (compProd.is_published === undefined || compProd.is_published === true);

          if (!isListed) {
            return NextResponse.json(
              {
                error: `The combo offer "${dbCombo.name}" is unavailable because component "${compProd?.name || "product"}" is currently unlisted.`,
              },
              { status: 400 }
            );
          }

          const compStock = getProductStockQuantity(compProd.inventory);
          const neededUnits = (ci.quantity || 1) * qty;
          if (compStock < neededUnits) {
            const maxCombosPossible = Math.floor(compStock / (ci.quantity || 1));
            return NextResponse.json(
              {
                error: `Insufficient stock for "${dbCombo.name}". Component "${compProd.name}" only has ${compStock} units available (${neededUnits} required for ${qty} combos). Maximum sets available: ${maxCombosPossible}.`,
              },
              { status: 400 }
            );
          }

          componentsSnapshot.push({
            product_id: ci.product_id,
            name: compProd.name,
            sku: compProd.sku,
            quantity: ci.quantity,
            image:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              compProd.product_images?.find((img: any) => img.is_primary)?.secure_url ||
              compProd.product_images?.[0]?.secure_url ||
              null,
            retail_price: Number(compProd.retail_price) || 0,
          });
        }

        const verifiedPrice = Number(dbCombo.price) || 0;
        const isTaxable = dbCombo.tax_enabled !== false;
        const lineSubtotal = Math.round(verifiedPrice * qty * 100) / 100;
        const lineTax = isTaxable ? Math.round(lineSubtotal * RETAIL_TAX_RATE * 100) / 100 : 0;

        verifiedItems.push({
          productId: null,
          comboId: dbCombo.id,
          isCombo: true,
          name: dbCombo.name,
          sku: dbCombo.sku,
          slug: dbCombo.slug,
          image: dbCombo.primary_image_url || rawItem.image || null,
          price: verifiedPrice,
          quantity: qty,
          taxEnabled: isTaxable,
          lineSubtotal,
          lineTax,
          lineTotal: lineSubtotal,
          components: componentsSnapshot,
        });
      } else {
        // Regular catalog product
        const dbProd = productMap.get(targetId);
        const isListed =
          dbProd &&
          (dbProd.status === undefined || dbProd.status === "published") &&
          (dbProd.is_published === undefined || dbProd.is_published === true);

        if (!isListed) {
          return NextResponse.json(
            { error: `Product "${rawItem.name || "Selected item"}" is no longer available.` },
            { status: 400 }
          );
        }

        const prodStock = getProductStockQuantity(dbProd.inventory);
        if (prodStock < qty) {
          return NextResponse.json(
            {
              error: `Insufficient stock for "${dbProd.name}". Only ${prodStock} units available (${qty} requested).`,
            },
            { status: 400 }
          );
        }

        const verifiedPrice = Number(dbProd.retail_price) || 0;
        const isTaxable = dbProd.tax_enabled !== false;
        const lineSubtotal = Math.round(verifiedPrice * qty * 100) / 100;
        const lineTax = isTaxable ? Math.round(lineSubtotal * RETAIL_TAX_RATE * 100) / 100 : 0;

        verifiedItems.push({
          productId: dbProd.id,
          comboId: null,
          isCombo: false,
          name: dbProd.name,
          sku: dbProd.sku,
          slug: dbProd.slug,
          image: rawItem.image || null,
          price: verifiedPrice,
          quantity: qty,
          taxEnabled: isTaxable,
          lineSubtotal,
          lineTax,
          lineTotal: lineSubtotal,
        });
      }
    }

    // 3. Compute authoritative order totals
    const rawSubtotal = verifiedItems.reduce(
      (sum: number, item: VerifiedOrderItem) => sum + item.lineSubtotal,
      0
    );
    const authoritativeShipping =
      rawSubtotal >= FREE_SHIPPING_THRESHOLD || rawSubtotal === 0 ? 0 : STANDARD_SHIPPING_FEE;

    const authoritativeTotals = calculateRetailOrderTotals(
      verifiedItems.map((it: VerifiedOrderItem) => ({
        price: it.price,
        quantity: it.quantity,
        tax_enabled: it.taxEnabled,
      })),
      authoritativeShipping,
      0 // No discount code applied by default
    );

    // 4. Handle Online Payment (Stripe Checkout Session)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stripeLineItems: any[] = verifiedItems.map((item: VerifiedOrderItem) => ({
        price_data: {
          currency: "aed",
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
            metadata: {
              product_id: item.productId || "",
              combo_id: item.comboId || "",
              is_combo: item.isCombo ? "true" : "false",
              sku: item.sku || "",
              slug: item.slug || "",
              tax_enabled: item.taxEnabled ? "true" : "false",
            },
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

      // Prepare verified items JSON for metadata
      const minifiedItems = verifiedItems.map((it) => ({
        id: it.productId || it.comboId,
        comboId: it.comboId,
        isCombo: it.isCombo,
        name: it.name,
        sku: it.sku,
        slug: it.slug,
        image: it.image,
        price: it.price,
        quantity: it.quantity,
        taxEnabled: it.taxEnabled,
        lineTotal: it.lineSubtotal,
        components: it.components || [],
      }));

      const itemsJson = JSON.stringify(minifiedItems);

      // Handle metadata chunking if items JSON exceeds Stripe's 500-char value limit
      const metadataPayload: Record<string, string> = {
        user_id: verifiedUserId || "",
        customer_email: customerEmail.trim().toLowerCase(),
        customer_name: customerName || "",
        customer_phone: customerPhone || "",
        customer_type: customerType || "retail",
        subtotal: authoritativeTotals.subtotal.toString(),
        tax_amount: authoritativeTotals.taxAmount.toString(),
        shipping_amount: authoritativeTotals.shippingAmount.toString(),
        total: authoritativeTotals.total.toString(),
        notes: notes || "",
        save_address: saveAddress && verifiedUserId ? "true" : "false",
        is_default_address: isDefaultAddress ? "true" : "false",
        shipping_address: JSON.stringify(shippingAddress).slice(0, 500),
      };

      if (itemsJson.length <= 500) {
        metadataPayload.items_data = itemsJson;
      } else {
        // Chunk into 450 char segments
        for (let i = 0; i < Math.ceil(itemsJson.length / 450); i++) {
          metadataPayload[`items_data_${i}`] = itemsJson.slice(i * 450, (i + 1) * 450);
        }
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: customerEmail.trim().toLowerCase(),
        client_reference_id: verifiedUserId || undefined,
        line_items: stripeLineItems,
        metadata: metadataPayload,
        success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/checkout?cancelled=true`,
      });

      return NextResponse.json({
        success: true,
        checkoutUrl: session.url,
        paymentMethod: "stripe",
      });
    }

    // 5. Handle Normal Payment (Cash on Delivery)
    // Generate unique order number with timestamp + random entropy to eliminate collision
    const orderNumber = `AUR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert order with authoritative amounts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (admin as any)
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: verifiedUserId,
        customer_email: customerEmail.trim().toLowerCase(),
        customer_type: customerType || "retail",
        status: "processing",
        payment_status: "pending",
        subtotal: authoritativeTotals.subtotal,
        discount_amount: authoritativeTotals.discountAmount,
        tax_amount: authoritativeTotals.taxAmount,
        shipping_amount: authoritativeTotals.shippingAmount,
        total: authoritativeTotals.total,
        shipping_address: {
          ...shippingAddress,
          payment_method: "Normal Payment (COD)",
        },
        notes: notes
          ? `${notes}\n[Payment Method: Normal Payment (COD)]`
          : `[Payment Method: Normal Payment (COD)]`,
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

    // Insert order items with authoritative snapshots
    if (verifiedItems.length > 0) {
      const orderItemsToInsert = verifiedItems.map((item: VerifiedOrderItem) => ({
        order_id: order.id,
        product_id: item.productId,
        combo_id: item.comboId,
        product_snapshot: {
          name: item.name,
          image: item.image,
          slug: item.slug,
          tax_enabled: item.taxEnabled,
          is_combo: item.isCombo,
          combo_id: item.comboId,
          components: item.components || [],
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

    // Atomic Stock Reduction for COD
    await reduceStockForOrder(order.id, admin);

    // Save address if requested
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

    // Dispatch COD confirmation emails
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
      paymentMethod: "cod",
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
