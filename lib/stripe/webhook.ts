// ============================================================
// AURELLE — STRIPE WEBHOOK HANDLER
// ⚠️  SERVER ONLY
// Verifies Stripe webhook signatures and processes events.
// All order fulfillment is driven by verified webhooks only.
// ============================================================

import type Stripe from "stripe";
import { stripe } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus, OrderStatus } from "@/types/database";

/**
 * Verify and construct a Stripe webhook event from the raw request body.
 * Throws if the signature is invalid.
 */
export async function constructWebhookEvent(
  rawBody: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Process a verified Stripe webhook event idempotently.
 * Returns true if the event was processed, false if already handled.
 */
export async function processWebhookEvent(
  event: Stripe.Event
): Promise<{ handled: boolean; message: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // ─── Idempotency check ───────────────────────────────────────────────────
  // Check if this event has already been processed
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existingPayment) {
    return { handled: false, message: `Event ${event.id} already processed.` };
  }

  // ─── Event routing ───────────────────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(
        event.data.object as Stripe.Checkout.Session,
        event.id
      );
      break;

    case "checkout.session.expired":
      await handleCheckoutSessionExpired(
        event.data.object as Stripe.Checkout.Session
      );
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(
        event.data.object as Stripe.PaymentIntent,
        event.id
      );
      break;

    default:
      // Unhandled event type — acknowledge but don't process
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      return {
        handled: false,
        message: `Event type ${event.type} not handled.`,
      };
  }

  return { handled: true, message: `Event ${event.id} processed.` };
}

// ─── Handler: Checkout Completed ─────────────────────────────────────────────
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const orderId = session.metadata?.["order_id"];

  if (!orderId) {
    console.error("[Stripe Webhook] No order_id in session metadata:", session.id);
    throw new Error("No order_id in session metadata.");
  }

  console.log(
    `[Stripe Webhook] Processing checkout.session.completed for order ${orderId}`
  );

  // ── 1. Mark order as paid ────────────────────────────────────────────────
  const orderUpdate: {
    status: OrderStatus;
    payment_status: PaymentStatus;
    stripe_checkout_session_id: string;
    stripe_payment_intent_id: string | null;
    updated_at: string;
  } = {
    status: "paid",
    payment_status: "paid",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: orderError } = await supabase
    .from("orders")
    .update(orderUpdate)
    .eq("id", orderId)
    .eq("payment_status", "pending"); // Only update if still pending (idempotent)

  if (orderError) {
    console.error("[Stripe Webhook] Failed to update order:", orderError);
    throw orderError;
  }

  // ── 2. Record payment ────────────────────────────────────────────────────
  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    stripe_checkout_session_id: session.id,
    stripe_event_id: eventId,
    amount: session.amount_total ?? 0,
    currency: session.currency ?? "aed",
    status: "paid",
    payment_method: session.payment_method_types?.[0] ?? null,
  });

  if (paymentError) {
    console.error("[Stripe Webhook] Failed to record payment:", paymentError);
    throw paymentError;
  }

  // ── 3. Reduce stock (server-side, transactional) ─────────────────────────
  await reduceStockForOrder(orderId, supabase);

  console.log(
    `[Stripe Webhook] Order ${orderId} marked paid. Stock updated.`
  );
}

// ─── Handler: Checkout Expired ────────────────────────────────────────────────
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const orderId = session.metadata?.["order_id"];
  if (!orderId) return;

  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending");

  console.log(`[Stripe Webhook] Order ${orderId} expired/cancelled.`);
}

// ─── Handler: Payment Failed ──────────────────────────────────────────────────
async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const orderId = paymentIntent.metadata?.["order_id"];
  if (!orderId) return;

  await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  await supabase.from("payments").insert({
    order_id: orderId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_event_id: eventId,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: "failed",
  });

  console.log(`[Stripe Webhook] Payment failed for order ${orderId}.`);
}

// ─── Stock Reduction (server-side, safe) ─────────────────────────────────────
async function reduceStockForOrder(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<void> {
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("product_id, quantity, sku_snapshot")
    .eq("order_id", orderId);

  if (error || !orderItems?.length) return;

  for (const item of orderItems) {
    if (!item.product_id) continue;

    // Use RPC for atomic stock decrement to prevent negative stock
    await supabase.rpc("decrement_stock", {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });
  }
}
