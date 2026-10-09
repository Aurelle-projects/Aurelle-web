import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderDeliveredReviewEmail } from "@/lib/email/brevo";
import { calculateOrderStatusTransition } from "@/lib/orders/status";
import { verifyAdminSession } from "@/lib/auth/adminSession";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rawStatus = body.status;

    if (!id || !rawStatus) {
      return NextResponse.json(
        { error: "Order ID and status are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Fetch current order to check current status, payment_status, payment method, customer_type, notes, etc.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingOrder, error: fetchCurrentErr } = await (admin as any)
      .from("orders")
      .select("id, order_number, customer_type, status, payment_status, shipping_address, notes, stripe_checkout_session_id, stripe_payment_intent_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchCurrentErr || !existingOrder) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // 2. Authoritative server-side status & payment transition calculation
    const transition = calculateOrderStatusTransition(existingOrder, rawStatus);
    const updatePayload: Record<string, unknown> = {
      status: transition.newFulfillmentStatus,
      updated_at: new Date().toISOString(),
    };

    if (transition.paymentStatusUpdated) {
      updatePayload.payment_status = transition.newPaymentStatus;
    }

    // 3. Update order status and payment status atomically in a single server-side operation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("orders")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("[Admin Order Status update error]:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update order status." },
        { status: 500 }
      );
    }

    const status = transition.newFulfillmentStatus;
    const payment_status = transition.paymentStatusUpdated
      ? transition.newPaymentStatus
      : existingOrder.payment_status;

    // Sync wholesale application status if this is a linked wholesale order
    try {
      if (existingOrder.notes) {
        const match = existingOrder.notes.match(/\[Wholesale Application ID:\s*([a-f0-9\-]+)\]/i);
        if (match && match[1]) {
          const appId = match[1];
          const appStatus = status === "delivered" ? "approved" : status === "cancelled" ? "rejected" : "pending";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (admin as any)
            .from("wholesale_applications")
            .update({ status: appStatus, updated_at: new Date().toISOString() })
            .eq("id", appId);
        }
      }
    } catch (appSyncErr) {
      console.warn("[Admin Order Status] Wholesale app sync error:", appSyncErr);
    }

    // 2. Fetch updated order with items separately (avoids PostgREST join limitation on update)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedOrder, error: fetchError } = await (admin as any)
      .from("orders")
      .select(`
        id,
        order_number,
        customer_email,
        shipping_address,
        order_items (
          id,
          product_id,
          product_snapshot,
          quantity
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("[Admin Order Status fetch error]:", fetchError);
      return NextResponse.json({
        success: true,
        message: `Order status updated to ${status}.`,
        status,
        payment_status,
        paymentStatusUpdated: transition.paymentStatusUpdated,
      });
    }

    // 3. If delivered, send review invitation email
    const normalizedStatus = String(status || "").trim().toLowerCase();
    let emailSent = false;
    let emailError: string | null = null;

    if (normalizedStatus === "delivered" && updatedOrder) {
      const customerEmail =
        (updatedOrder.customer_email as string | undefined)?.trim() ||
        ((updatedOrder.shipping_address as Record<string, unknown>)?.email as string | undefined)?.trim();
      const shippingAddr = (updatedOrder.shipping_address as Record<string, unknown>) || {};
      const customerName =
        (shippingAddr.fullName as string) ||
        (shippingAddr.full_name as string) ||
        "";

      // If relation join returned no items, fallback query order_items directly
      let rawItems = updatedOrder.order_items;
      if (!rawItems || rawItems.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fallbackItems } = await (admin as any)
          .from("order_items")
          .select("id, product_id, product_snapshot, quantity")
          .eq("order_id", id);
        rawItems = fallbackItems || [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (rawItems || []).map((item: any) => {
        const snap = item.product_snapshot || {};
        return {
          productId: item.product_id || snap.id || snap.productId || "",
          name: snap.name || "Aurelle Product",
          image: snap.primary_image_url || snap.image || null,
          quantity: item.quantity || 1,
        };
      });

      if (customerEmail) {
        try {
          const emailRes = await sendOrderDeliveredReviewEmail({
            orderNumber: updatedOrder.order_number,
            customerName,
            customerEmail,
            items,
            orderId: updatedOrder.id,
          });

          if (!emailRes.success) {
            emailError = emailRes.error || "Failed to send email via Brevo.";
            console.error(
              `[Brevo] Failed to send delivery review email to ${customerEmail}:`,
              emailRes.error
            );
          } else {
            emailSent = true;
            console.log(
              `[Brevo] Successfully sent delivery review email to ${customerEmail} for order ${updatedOrder.order_number}`
            );
          }
        } catch (emailErr) {
          emailError =
            emailErr instanceof Error
              ? emailErr.message
              : "Unexpected email error.";
          console.error(
            "[Brevo] Unexpected exception sending delivery review email:",
            emailErr
          );
        }
      } else {
        emailError = "No customer email found for order.";
        console.warn(
          `[Admin Order Status] No customer email found for order ${updatedOrder.order_number} (${id})`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}.`,
      status,
      payment_status,
      paymentStatusUpdated: transition.paymentStatusUpdated,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error("[Admin Order Status exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}