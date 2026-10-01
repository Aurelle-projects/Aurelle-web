import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { finalizeStripeOrder } from "@/lib/orders/stripe-fulfillment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { verified: false, error: "Missing session_id parameter." },
        { status: 400 }
      );
    }

    // 1. Retrieve session directly from Stripe server-side
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });

    if (!session) {
      return NextResponse.json(
        { verified: false, error: "Stripe checkout session not found." },
        { status: 404 }
      );
    }

    // 2. Check Stripe payment status
    if (session.payment_status !== "paid") {
      return NextResponse.json({
        verified: false,
        paymentStatus: session.payment_status,
        message: "Payment has not been completed.",
      });
    }

    // 3. Finalize order creation/confirmation idempotently
    const result = await finalizeStripeOrder(session);

    if (!result.success || !result.order) {
      return NextResponse.json(
        {
          verified: false,
          error: result.error || "Failed to confirm order records in database.",
        },
        { status: 500 }
      );
    }

    const order = result.order;

    return NextResponse.json({
      verified: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        subtotal: Number(order.subtotal || 0),
        taxAmount: Number(order.tax_amount || 0),
        shippingAmount: Number(order.shipping_amount || 0),
        total: Number(order.total || 0),
        shippingAddress: order.shipping_address,
        paymentStatus: "paid",
        status: order.status || "processing",
      },
    });
  } catch (err) {
    console.error("[Verify Session Exception]:", err);
    return NextResponse.json(
      {
        verified: false,
        error: err instanceof Error ? err.message : "Failed to verify session.",
      },
      { status: 500 }
    );
  }
}
