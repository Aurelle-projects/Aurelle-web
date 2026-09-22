import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderDeliveredReviewEmail } from "@/lib/email/brevo";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Order ID and status are required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Update order status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (admin as any)
      .from("orders")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Admin Order Status update error]:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to update order status." },
        { status: 500 }
      );
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
      });
    }

    // 3. If delivered, send review invitation email
    if (status === "delivered" && updatedOrder) {
      const customerEmail = updatedOrder.customer_email as string | undefined;
      const shippingAddr = (updatedOrder.shipping_address as Record<string, unknown>) || {};
      const customerName =
        (shippingAddr.fullName as string) ||
        (shippingAddr.full_name as string) ||
        "";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = (updatedOrder.order_items || []).map((item: any) => {
        const snap = item.product_snapshot || {};
        return {
          name: snap.name || "Aurelle Product",
          image: snap.image || null,
          quantity: item.quantity || 1,
        };
      });

      if (customerEmail) {
        sendOrderDeliveredReviewEmail({
          orderNumber: updatedOrder.order_number,
          customerName,
          customerEmail,
          items,
          orderId: updatedOrder.id,
        }).catch((err) => {
          console.error("[Brevo] Error sending delivery review email:", err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order status updated to ${status}.`,
    });
  } catch (err) {
    console.error("[Admin Order Status exception]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}