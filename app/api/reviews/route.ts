import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// ── Shared helper: get all delivered orders for user containing product ────
async function getUserDeliveredOrdersForProduct(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  userEmail: string,
  productId: string
): Promise<{ id: string; order_number: string }[]> {
  try {
    const { data: orders, error: ordersError } = await admin
      .from("orders")
      .select("id, order_number")
      .eq("status", "delivered")
      .or(`user_id.eq.${userId},customer_email.eq.${userEmail}`);

    if (ordersError || !Array.isArray(orders) || orders.length === 0) {
      return [];
    }

    const orderIds = orders.map((o: { id: string }) => o.id);

    const { data: items, error: itemsError } = await admin
      .from("order_items")
      .select("order_id")
      .eq("product_id", productId)
      .in("order_id", orderIds);

    if (itemsError || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    const matchingOrderIds = new Set(
      items.map((it: { order_id: string }) => it.order_id)
    );
    return orders.filter((o: { id: string }) => matchingOrderIds.has(o.id));
  } catch (err) {
    console.error("[getUserDeliveredOrdersForProduct] exception:", err);
    return [];
  }
}

// ── Shared helper: get all order IDs already reviewed by user for product ──
async function getReviewedOrderIdsForProduct(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  productId: string
): Promise<string[]> {
  try {
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("order_id")
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error || !Array.isArray(reviews)) {
      return [];
    }

    return reviews
      .map((r: { order_id: string | null }) => r.order_id)
      .filter((id): id is string => Boolean(id));
  } catch (err) {
    console.error("[getReviewedOrderIdsForProduct] exception:", err);
    return [];
  }
}

// ── GET: reviews for a product | user reviews | eligibility check ─────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const userOnly = searchParams.get("userOnly") === "true";
    const checkEligibility = searchParams.get("checkEligibility") === "true";

    const admin = createAdminClient();

    // ── Eligibility check: can the current user review this product? ──
    if (checkEligibility && productId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ eligible: false, reason: "not_logged_in" });
      }

      const deliveredOrders = await getUserDeliveredOrdersForProduct(
        admin,
        user.id,
        user.email ?? "",
        productId
      );

      if (deliveredOrders.length === 0) {
        return NextResponse.json({
          eligible: false,
          reason: "no_delivered_purchase",
          message:
            "Purchase required. You can only review products you have bought and received. Reviews are available once your order status is marked as Delivered.",
        });
      }

      const reviewedOrderIds = await getReviewedOrderIdsForProduct(
        admin,
        user.id,
        productId
      );

      // Filter out orders that have already been reviewed
      const unreviewedOrders = deliveredOrders.filter(
        (o) => !reviewedOrderIds.includes(o.id)
      );

      if (unreviewedOrders.length === 0) {
        return NextResponse.json({
          eligible: false,
          reason: "already_reviewed",
          message:
            "You have already submitted a review for this product from your purchase. If you purchase this product again in a new order, you can submit another review.",
        });
      }

      const targetOrder = unreviewedOrders[0];
      return NextResponse.json({
        eligible: true,
        orderId: targetOrder?.id ?? null,
        orderNumber: targetOrder?.order_number ?? null,
      });
    }

    // ── User's own reviews ────────────────────────────────────────────
    if (userOnly) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ reviews: [] });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .from("reviews")
        .select(`
          id,
          product_id,
          order_id,
          rating,
          title,
          body,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("[Reviews GET userOnly error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ reviews: data || [] });
    }

    // ── Published reviews for a product ──────────────────────────────
    if (productId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (admin as any)
        .from("reviews")
        .select(`
          id,
          product_id,
          rating,
          title,
          body,
          created_at,
          profiles (
            full_name
          )
        `)
        .eq("product_id", productId)
        .eq("is_published", true)
        .order("rating", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Reviews GET productId error]:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const rawReviews = data || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviews = rawReviews.map((r: any) => {
        const profile = r.profiles;
        const author_name = profile?.full_name?.trim() || "Verified Customer";
        return {
          id: r.id,
          rating: Number(r.rating) || 5,
          body: r.body || "",
          author_name,
          created_at: r.created_at,
        };
      });

      const totalReviews = reviews.length;
      const averageRating =
        totalReviews > 0
          ? Number(
              (
                reviews.reduce(
                  (acc: number, r: { rating: number }) => acc + r.rating,
                  0
                ) / totalReviews
              ).toFixed(1)
            )
          : 0;

      const ratingCounts: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
      reviews.forEach((r: { rating: number }) => {
        const current = ratingCounts[r.rating];
        if (typeof current === "number") {
          ratingCounts[r.rating] = current + 1;
        }
      });

      return NextResponse.json({
        reviews,
        summary: { averageRating, totalReviews, ratingCounts },
      });
    }

    return NextResponse.json(
      { error: "Please specify productId or userOnly=true" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[Reviews GET exception]:", err);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }
}

// ── POST: Submit a product review ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Must be logged in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "You must have a registered Aurelle account to submit a review.",
        },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 2. Profile must exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (admin as any)
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "User profile not found. Please complete registration before reviewing.",
        },
        { status: 403 }
      );
    }

    const bodyJson = await request.json();
    const { product_id, order_id, rating, body, title } = bodyJson;

    if (!product_id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "Rating must be an integer between 1 and 5 stars." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Please enter your review message." },
        { status: 400 }
      );
    }

    let targetOrderId: string | null = null;

    // 3. If order_id supplied (e.g. from account page order list)
    if (order_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: order } = await (admin as any)
        .from("orders")
        .select("id, status, user_id, customer_email")
        .eq("id", order_id)
        .single();

      if (!order) {
        return NextResponse.json(
          { error: "Order not found." },
          { status: 404 }
        );
      }

      if (order.status !== "delivered") {
        return NextResponse.json(
          {
            error:
              "Reviews can only be submitted after the order is delivered.",
          },
          { status: 400 }
        );
      }

      if (
        order.user_id &&
        order.user_id !== user.id &&
        order.customer_email !== user.email
      ) {
        return NextResponse.json(
          { error: "You can only review products from your own orders." },
          { status: 403 }
        );
      }

      // Verify this order actually contains the product
      const { data: orderItem } = await admin
        .from("order_items")
        .select("id")
        .eq("order_id", order_id)
        .eq("product_id", product_id)
        .limit(1);

      if (!orderItem || orderItem.length === 0) {
        return NextResponse.json(
          { error: "This order does not contain the specified product." },
          { status: 400 }
        );
      }

      // Check if a review already exists for this product in this purchase/order
      const { data: existingReviewForOrder } = await admin
        .from("reviews")
        .select("id")
        .eq("product_id", product_id)
        .eq("order_id", order_id)
        .limit(1);

      if (existingReviewForOrder && existingReviewForOrder.length > 0) {
        return NextResponse.json(
          {
            error:
              "You have already submitted a review for this product from this purchase. If you purchase this product again in a new order, you can submit another review.",
          },
          { status: 409 }
        );
      }

      targetOrderId = order_id;
    } else {
      // 4. If order_id NOT supplied (e.g. from product details page)
      const deliveredOrders = await getUserDeliveredOrdersForProduct(
        admin,
        user.id,
        user.email ?? "",
        product_id
      );

      if (deliveredOrders.length === 0) {
        return NextResponse.json(
          {
            error:
              "You can only review products you have purchased and received. Reviews are available after your order status is marked as Delivered.",
          },
          { status: 403 }
        );
      }

      const reviewedOrderIds = await getReviewedOrderIdsForProduct(
        admin,
        user.id,
        product_id
      );

      const unreviewedOrders = deliveredOrders.filter(
        (o) => !reviewedOrderIds.includes(o.id)
      );

      const firstUnreviewed = unreviewedOrders[0];
      if (!firstUnreviewed) {
        return NextResponse.json(
          {
            error:
              "You have already submitted a review for this product from your purchase. If you purchase this product again in a new order, you can submit another review.",
          },
          { status: 409 }
        );
      }

      targetOrderId = firstUnreviewed.id;
    }

    // 5. Insert new review for this purchase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: savedReview, error: reviewError } = await (admin as any)
      .from("reviews")
      .insert({
        product_id,
        user_id: user.id,
        order_id: targetOrderId,
        rating: Math.round(numericRating),
        title: title ? String(title).trim() : null,
        body: body.trim(),
        is_verified_purchase: true,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reviewError) {
      console.error("[Reviews POST error]:", reviewError);
      if (
        reviewError.code === "23505" &&
        reviewError.message?.includes("reviews_product_id_user_id_key")
      ) {
        return NextResponse.json(
          {
            error:
              "A review from an earlier purchase already exists. Please run the database migration (20260922_010_reviews_per_order.sql) to enable multi-purchase reviews.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: reviewError.message || "Failed to submit review." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: savedReview,
      message: "Thank you! Your review has been submitted.",
    });
  } catch (err) {
    console.error("[Reviews POST exception]:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to submit review",
      },
      { status: 500 }
    );
  }
}