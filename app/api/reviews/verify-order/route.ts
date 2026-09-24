import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyReviewToken } from "@/lib/auth/reviewToken";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");
    const productId = searchParams.get("productId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required to verify review eligibility." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch order details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        customer_email,
        user_id,
        shipping_address,
        order_items (
          id,
          product_id,
          product_snapshot,
          quantity
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found. Please verify your review link." },
        { status: 404 }
      );
    }

    // 2. Reviews are only allowed once an order has been delivered
    if (order.status !== "delivered") {
      return NextResponse.json(
        {
          error:
            "Review invitation is only active once your order has been marked as Delivered.",
        },
        { status: 400 }
      );
    }

    // 3. Verify security token (ensures review popup is opened ONLY through email review link)
    const customerEmail = (order.customer_email || "").trim().toLowerCase();
    if (token) {
      const isValid = verifyReviewToken(order.id, customerEmail, token);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or expired review invitation link." },
          { status: 403 }
        );
      }
    } else {
      // Must be opened through the review link received by email
      return NextResponse.json(
        {
          error:
            "Reviews can only be opened through the review link received by email.",
        },
        { status: 403 }
      );
    }

    // 4. Check whether customer has a registered account
    let hasAccount = false;
    let accountUserId: string | null = order.user_id || null;

    if (accountUserId) {
      hasAccount = true;
    } else if (customerEmail) {
      // Check profiles table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (admin as any)
        .from("profiles")
        .select("id, email")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (profile) {
        hasAccount = true;
        accountUserId = profile.id;
      } else {
        // Fallback check in auth.users
        const { data: usersList } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        const found = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === customerEmail
        );
        if (found) {
          hasAccount = true;
          accountUserId = found.id;
        }
      }
    }

    // 5. Fetch existing reviews for this order to see which products are already reviewed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingReviews } = await (admin as any)
      .from("reviews")
      .select("product_id, rating, body")
      .eq("order_id", order.id);

    const reviewedMap = new Map<string, { rating: number; body: string }>();
    if (Array.isArray(existingReviews)) {
      for (const r of existingReviews) {
        if (r.product_id) {
          reviewedMap.set(r.product_id, {
            rating: Number(r.rating) || 5,
            body: r.body || "",
          });
        }
      }
    }

    // 6. Map all products from the order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (order.order_items || []).map((it: any) => {
      const snap = it.product_snapshot || {};
      const pId = it.product_id || snap.id || "";
      const existing = reviewedMap.get(pId);

      return {
        orderItemId: it.id,
        productId: pId,
        name: snap.name || "Aurelle Product",
        image: snap.primary_image_url || snap.image || null,
        quantity: it.quantity || 1,
        alreadyReviewed: Boolean(existing),
        existingRating: existing?.rating,
        existingBody: existing?.body,
      };
    });

    const shippingAddr = (order.shipping_address as Record<string, unknown>) || {};
    const customerName =
      (shippingAddr.fullName as string) ||
      (shippingAddr.full_name as string) ||
      "";

    // Target product ID logic: use query param if provided, otherwise first unreviewed item
    const requestedItem = items.find((i: { productId: string }) => i.productId === productId);
    const unreviewedItem = items.find((i: { alreadyReviewed: boolean }) => !i.alreadyReviewed);
    const defaultTargetId = requestedItem
      ? requestedItem.productId
      : unreviewedItem
      ? unreviewedItem.productId
      : items[0]?.productId || null;

    return NextResponse.json({
      valid: true,
      orderId: order.id,
      orderNumber: order.order_number,
      customerEmail: order.customer_email,
      customerName,
      hasAccount,
      accountUserId,
      targetProductId: defaultTargetId,
      items,
    });
  } catch (error) {
    console.error("[Verify Order Review Error]:", error);
    return NextResponse.json(
      { error: "Failed to verify review invitation link." },
      { status: 500 }
    );
  }
}
