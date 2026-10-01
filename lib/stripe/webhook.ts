// ============================================================
// AURELLE — STRIPE WEBHOOK HANDLER
// ⚠️  SERVER ONLY
// Verifies Stripe webhook signatures and processes events.
// All order fulfillment is driven by verified webhooks only.
// ============================================================

import type Stripe from "stripe";
import { stripe } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeStripeOrder } from "@/lib/orders/stripe-fulfillment";

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
  console.log(
    `[Stripe Webhook] Processing checkout.session.completed for session ${session.id}`
  );

  const result = await finalizeStripeOrder(session, eventId);
  if (!result.success) {
    console.error("[Stripe Webhook] finalizeStripeOrder error:", result.error);
    throw new Error(result.error || "Failed to finalize order from webhook.");
  }
}

// ─── Handler: Checkout Expired ────────────────────────────────────────────────
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (!order) return;

  await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .eq("payment_status", "pending");

  console.log(`[Stripe Webhook] Order ${order.id} expired/cancelled.`);
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
