import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!await verifyAdminSession()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch Orders with Order Items
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ordersData, error: ordersError } = await (admin as any)
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
        shipping_amount,
        total,
        shipping_address,
        created_at,
        order_items (
          id,
          product_id,
          combo_id,
          product_snapshot,
          sku_snapshot,
          price_snapshot,
          quantity,
          line_total
        )
      `)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[Dashboard API] orders fetch error:", ordersError);
    }

    const orders = Array.isArray(ordersData) ? ordersData : [];

    // 2. Fetch Wholesale Applications
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wholesaleAppsData, error: wholesaleError } = await (admin as any)
      .from("wholesale_applications")
      .select(`
        id,
        business_name,
        contact_person,
        email,
        phone,
        country,
        business_type,
        status,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (wholesaleError) {
      console.warn("[Dashboard API] wholesale_applications error:", wholesaleError);
    }

    const wholesaleApps = Array.isArray(wholesaleAppsData) ? wholesaleAppsData : [];

    // 3. Fetch Products count & Wholesale products count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: productsData, error: productsError } = await (admin as any)
      .from("products")
      .select("id, is_wholesale_available, status, wholesale_price, retail_price");

    if (productsError) {
      console.warn("[Dashboard API] products error:", productsError);
    }

    const products = Array.isArray(productsData) ? productsData : [];

    // 4. Fetch Categories count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: categoriesCount, error: catError } = await (admin as any)
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (catError) {
      console.warn("[Dashboard API] categories count error:", catError);
    }

    // 5. Fetch Brands count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count: brandsCount, error: brandError } = await (admin as any)
      .from("brands")
      .select("id", { count: "exact", head: true });

    if (brandError) {
      console.warn("[Dashboard API] brands count error:", brandError);
    }

    // 6. Compute Analytics Separating Retail and Wholesale
    let totalRevenue = 0;
    let retailRevenue = 0;
    let wholesaleRevenue = 0;

    let retailOrdersCount = 0;
    let wholesaleOrdersCount = 0;

    let pendingFulfillmentCount = 0;
    let processingCount = 0;
    let deliveredCount = 0;

    const mappedOrders = orders.map((o: any) => {
      const addr = (o.shipping_address as Record<string, unknown>) || {};
      const customer_name =
        (addr.fullName as string) ||
        (addr.full_name as string) ||
        (o.customer_email ? o.customer_email.split("@")[0] : "Customer");
      const city =
        (addr.city as string) ||
        (addr.emirate as string) ||
        (addr.state as string) ||
        "UAE";

      const orderTotal = Number(o.total) || 0;
      const subtotal = Number(o.subtotal) || 0;

      // Determine if order is wholesale or retail
      const isWholesale = o.customer_type === "wholesale";

      if (o.status !== "cancelled") {
        totalRevenue += orderTotal;
        if (isWholesale) {
          wholesaleRevenue += orderTotal;
        } else {
          retailRevenue += orderTotal;
        }
      }

      if (isWholesale) {
        wholesaleOrdersCount += 1;
      } else {
        retailOrdersCount += 1;
      }

      if (o.status === "pending") pendingFulfillmentCount += 1;
      if (o.status === "processing") processingCount += 1;
      if (o.status === "delivered") deliveredCount += 1;

      const items = Array.isArray(o.order_items)
        ? o.order_items.map((it: any) => {
            const snap = it.product_snapshot || {};
            const isCombo = Boolean(
              it.combo_id ||
              snap.is_combo ||
              snap.combo_id ||
              (snap.components && Array.isArray(snap.components) && snap.components.length > 0)
            );
            const components = Array.isArray(snap.components) ? snap.components : [];
            const unitPrice =
              Number(it.price_snapshot) ||
              (Number(it.line_total) / (it.quantity || 1)) ||
              0;

            let originalPrice = Number(snap.original_price) || Number(snap.compare_at_price) || 0;
            if (!originalPrice && isCombo && components.length > 0) {
              originalPrice = components.reduce(
                (sum: number, c: any) => sum + (Number(c.retail_price) || 0) * (c.quantity || 1),
                0
              );
            }

            let savingsAmount = Number(snap.savings_amount) || 0;
            if (!savingsAmount && isCombo && originalPrice > unitPrice) {
              savingsAmount = Math.max(0, originalPrice - unitPrice);
            }

            let savingsPct = Number(snap.savings_percentage) || 0;
            if (!savingsPct && isCombo && originalPrice > 0 && savingsAmount > 0) {
              savingsPct = Math.round((savingsAmount / originalPrice) * 100);
            }

            return {
              id: it.id,
              product_id: it.product_id || null,
              combo_id: it.combo_id || snap.combo_id || null,
              is_combo: isCombo,
              name: snap.name || (isCombo ? "Combo Offer" : "Product"),
              quantity: it.quantity || 1,
              price: unitPrice,
              line_total: Number(it.line_total) || 0,
              image: snap.image || snap.image_url || snap.imageUrl || snap.primary_image_url || null,
              sku: it.sku_snapshot || snap.sku || "",
              slug: snap.slug || "",
              original_price: originalPrice > 0 ? originalPrice : undefined,
              savings_amount: savingsAmount > 0 ? savingsAmount : undefined,
              savings_percentage: savingsPct > 0 ? savingsPct : undefined,
              components,
            };
          })
        : [];

      const hasCombo = items.some((it: any) => it.is_combo);
      const comboItemsCount = items
        .filter((it: any) => it.is_combo)
        .reduce((sum: number, it: any) => sum + it.quantity, 0);
      const regularItemsCount = items
        .filter((it: any) => !it.is_combo)
        .reduce((sum: number, it: any) => sum + it.quantity, 0);
      const isPureCombo = hasCombo && regularItemsCount === 0;
      const isMixed = hasCombo && regularItemsCount > 0;
      const totalSavings =
        items.reduce(
          (sum: number, it: any) => sum + (it.savings_amount ? it.savings_amount * it.quantity : 0),
          0
        ) + (Number(o.discount_amount) || 0);

      return {
        id: o.id,
        order_number: o.order_number || "",
        customer_name,
        customer_email: o.customer_email || "",
        customer_type: (isWholesale ? "wholesale" : "retail") as "retail" | "wholesale",
        items_count: items.reduce((sum: number, it: any) => sum + it.quantity, 0) || items.length || 1,
        total_amount: orderTotal,
        subtotal,
        payment_status: o.payment_status || "pending",
        order_status: o.status || "pending",
        created_at: o.created_at || new Date().toISOString(),
        city,
        items,
        has_combo: hasCombo,
        is_pure_combo: isPureCombo,
        is_mixed: isMixed,
        combo_items_count: comboItemsCount,
        regular_items_count: regularItemsCount,
        total_savings: totalSavings > 0 ? totalSavings : undefined,
      };
    });

    const pendingWholesaleApps = wholesaleApps.filter(
      (app: any) => app.status === "pending" || app.status === "under_review"
    ).length;

    const wholesaleProductsCount = products.filter(
      (p: any) => p.is_wholesale_available || (p.wholesale_price && p.wholesale_price > 0)
    ).length;

    return NextResponse.json({
      success: true,
      summary: {
        totalRevenue,
        retailRevenue,
        wholesaleRevenue,
        totalOrders: orders.length,
        retailOrdersCount,
        wholesaleOrdersCount,
        pendingFulfillmentCount,
        processingCount,
        deliveredCount,
        totalProducts: products.length,
        wholesaleProductsCount,
        totalCategories: categoriesCount || 0,
        totalBrands: brandsCount || 0,
        pendingWholesaleApplicationsCount: pendingWholesaleApps,
        totalWholesaleApplicationsCount: wholesaleApps.length,
      },
      recentOrders: mappedOrders.slice(0, 15),
      recentWholesaleApplications: wholesaleApps.slice(0, 5),
    });
  } catch (error) {
    console.error("[Dashboard API error]:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}
