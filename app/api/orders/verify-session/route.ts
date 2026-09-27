import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";
import {
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
} from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const orderIdParam = searchParams.get("order_id");

    if (!sessionId) {
      return NextResponse.json(
        { verified: false, error: "Missing session_id parameter." },
        { status: 400 }
      );
    }

    // 1. Retrieve session directly from Stripe server-side
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (!session) {
      return NextResponse.json(
        { verified: false, error: "Stripe checkout session not found." },
        { status: 404 }
      );
    }

    const orderId = orderIdParam || session.metadata?.["order_id"] || session.client_reference_id;

    if (!orderId) {
      return NextResponse.json(
        { verified: false, error: "Order ID could not be identified from session." },
        { status: 400 }
      );
    }

    // 2. Query database for this order
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderFetchError } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
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
          line_total
        )
      `)
      .eq("id", orderId)
      .single();

    if (orderFetchError || !order) {
      return NextResponse.json(
        { verified: false, error: "Order record not found in database." },
        { status: 404 }
      );
    }

    // 3. Check Stripe payment status
    const isPaid = session.payment_status === "paid";

    if (!isPaid) {
      return NextResponse.json({
        verified: false,
        paymentStatus: session.payment_status,
        orderNumber: order.order_number,
        message: "Payment has not been completed.",
      });
    }

    // 4. If Stripe confirmed payment but DB is still 'pending', update database now (guarantees DB sync)
    if (order.payment_status !== "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any)
        .from("orders")
        .update({
          status: "processing",
          payment_status: "paid",
          stripe_payment_intent_id: paymentIntentId,
          stripe_checkout_session_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // Record in payments table idempotently
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingPayment } = await (admin as any)
          .from("payments")
          .select("id")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();

        if (!existingPayment) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any).from("payments").insert({
            order_id: order.id,
            stripe_payment_intent_id: paymentIntentId,
            stripe_checkout_session_id: session.id,
            amount: session.amount_total ?? Math.round(Number(order.total) * 100),
            currency: session.currency ?? "aed",
            status: "paid",
            payment_method: session.payment_method_types?.[0] ?? "card",
          });
        }
      } catch (payErr) {
        console.warn("[Verify Session] payments table insert warning:", payErr);
      }

      // Send confirmation emails now that payment is confirmed in DB
      try {
        const shippingAddr = (order.shipping_address as Record<string, unknown>) || {};
        const customerName =
          (shippingAddr.fullName as string) ||
          (shippingAddr.full_name as string) ||
          "";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (order.order_items || []).map((item: any) => ({
          name: item.product_snapshot?.name || "Product",
          price: item.price_snapshot || 0,
          quantity: item.quantity || 1,
          sku: item.sku_snapshot,
          image: item.product_snapshot?.image,
        }));

        const emailData = {
          orderNumber: order.order_number,
          customerName,
          customerEmail: order.customer_email,
          items,
          subtotal: Number(order.subtotal) || 0,
          shippingAmount: Number(order.shipping_amount) || 0,
          total: Number(order.total) || 0,
          shippingAddress: shippingAddr as any,
          paymentMethod: "stripe",
        };

        Promise.all([
          sendOrderConfirmationEmail(emailData),
          sendAdminOrderNotificationEmail(emailData),
        ]).catch((err) => console.error("[Verify Session] Email send error:", err));
      } catch (emailErr) {
        console.warn("[Verify Session] Email dispatch warning:", emailErr);
      }
    }

    return NextResponse.json({
      verified: true,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        subtotal: order.subtotal,
        shippingAmount: order.shipping_amount,
        total: order.total,
        shippingAddress: order.shipping_address,
        paymentStatus: "paid",
        status: "processing",
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
