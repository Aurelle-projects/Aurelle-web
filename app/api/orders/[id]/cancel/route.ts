import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/client";
import { sendOrderCancelledEmail } from "@/lib/email/brevo";
import { isCodOrDirectPaymentOrder } from "@/lib/orders/status";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" && body.reason.trim()
      ? body.reason.trim()
      : "Requested by customer";
    const details = typeof body.details === "string" ? body.details.trim() : "";
    const guestEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const admin = createAdminClient();

    // 1. Fetch the target order
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderQuery = (admin as any).from("orders").select(`
      id,
      order_number,
      user_id,
      customer_email,
      customer_type,
      status,
      payment_status,
      subtotal,
      shipping_amount,
      tax_amount,
      total,
      shipping_address,
      notes,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      created_at
    `);

    if (isUuid) {
      orderQuery = orderQuery.eq("id", id);
    } else {
      orderQuery = orderQuery.eq("order_number", id);
    }

    const { data: order, error: orderError } = await orderQuery.maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // 2. Authorize requester (either logged-in user or verified guest email)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const orderEmail = String(order.customer_email || "").trim().toLowerCase();
    let isAuthorized = false;

    if (user) {
      const userEmail = (user.email || "").trim().toLowerCase();
      if (order.user_id === user.id || (userEmail && userEmail === orderEmail)) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && guestEmail) {
      if (guestEmail === orderEmail) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: You do not have permission to cancel this order." },
        { status: 403 }
      );
    }

    // 3. Status Guard: Strictly reject if order has been shipped or delivered
    const currentStatus = String(order.status || "").trim().toLowerCase();

    if (currentStatus === "cancelled") {
      return NextResponse.json(
        { error: "This order has already been cancelled." },
        { status: 400 }
      );
    }

    if (currentStatus === "shipped") {
      return NextResponse.json(
        {
          error:
            "This order has already been dispatched with the courier and cannot be cancelled automatically. Please contact our 24/7 WhatsApp Concierge for assistance.",
        },
        { status: 400 }
      );
    }

    if (currentStatus === "delivered") {
      return NextResponse.json(
        {
          error:
            "This order has already been delivered. Please contact our concierge to initiate a return under our 14-day policy.",
        },
        { status: 400 }
      );
    }

    // 4. Determine Payment Method & Process Stripe Automated Refund if applicable
    const isCod = isCodOrDirectPaymentOrder(order);
    const isPaidOnline =
      !isCod &&
      (String(order.payment_status).toLowerCase() === "paid" ||
        Boolean(order.stripe_payment_intent_id) ||
        Boolean(order.stripe_checkout_session_id));

    let refundId: string | null = null;
    let paymentStatus = order.payment_status || "pending";

    if (isPaidOnline) {
      let paymentIntentId = order.stripe_payment_intent_id;

      // If payment_intent is not directly on order row, retrieve from checkout session
      if (!paymentIntentId && order.stripe_checkout_session_id) {
        try {
          const session = await stripe.checkout.sessions.retrieve(
            order.stripe_checkout_session_id
          );
          if (typeof session.payment_intent === "string") {
            paymentIntentId = session.payment_intent;
          } else if (session.payment_intent?.id) {
            paymentIntentId = session.payment_intent.id;
          }
        } catch (sessErr) {
          console.error(
            "[Order Cancellation] Failed to retrieve Stripe session:",
            sessErr
          );
        }
      }

      if (paymentIntentId) {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
          });
          refundId = refund.id;
          paymentStatus = "refunded";
          console.log(
            `[Order Cancellation] Automated Stripe refund created for order ${order.order_number}: ${refund.id}`
          );
        } catch (stripeErr: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errCode = (stripeErr as any)?.code;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errMsg = (stripeErr as any)?.message;

          if (errCode === "charge_already_refunded") {
            console.warn(
              `[Order Cancellation] Order ${order.order_number} was already refunded in Stripe.`
            );
            paymentStatus = "refunded";
            refundId = "already_refunded";
          } else {
            console.error(
              `[Order Cancellation] Stripe refund failed for order ${order.order_number}:`,
              stripeErr
            );
            return NextResponse.json(
              {
                error: `Automated payment refund could not be completed: ${
                  errMsg || "Stripe gateway rejected refund"
                }. Please contact support.`,
              },
              { status: 502 }
            );
          }
        }
      } else {
        // Online order without established intent
        paymentStatus = "cancelled";
      }
    } else {
      // Normal Payment (Cash on Delivery)
      paymentStatus = "cancelled";
    }

    // 5. Update Database Record
    const timestamp = new Date().toISOString();
    const cancellationAudit = `[Cancelled by Customer: "${reason}" | ${
      details ? `Note: ${details} | ` : ""
    }Refund: ${refundId ? `Stripe Refund ID ${refundId}` : (isPaidOnline ? "Stripe Pending" : "COD (No charge)")} | Date: ${timestamp}]`;

    const updatedNotes = order.notes
      ? `${order.notes}\n${cancellationAudit}`
      : cancellationAudit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("orders")
      .update({
        status: "cancelled",
        payment_status: paymentStatus,
        notes: updatedNotes,
        updated_at: timestamp,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("[Order Cancellation] Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status." },
        { status: 500 }
      );
    }

    // 6. Send Transactional Confirmation Email via Brevo
    try {
      const shippingAddr = (order.shipping_address as Record<string, unknown>) || {};
      const customerName =
        (shippingAddr.fullName as string) ||
        (shippingAddr.full_name as string) ||
        "Valued Customer";

      await sendOrderCancelledEmail({
        orderNumber: order.order_number,
        customerName,
        customerEmail: order.customer_email,
        reason,
        total: Number(order.total),
        isOnlinePayment: isPaidOnline,
        refundTimeline: "5 to 7 UAE banking days",
      });
    } catch (emailErr) {
      console.warn("[Order Cancellation] Email notification warning:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: isPaidOnline
        ? "Your order has been cancelled and a full refund has been initiated to your original payment card."
        : "Your order has been cancelled successfully.",
      orderNumber: order.order_number,
      status: "cancelled",
      paymentStatus,
      isOnlinePayment: isPaidOnline,
      refundIssued: Boolean(refundId),
    });
  } catch (err: unknown) {
    console.error("[Order Cancellation API exception]:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected server error occurred while processing cancellation.",
      },
      { status: 500 }
    );
  }
}
