// ============================================================
// AURELLE — STRIPE WEBHOOK ROUTE HANDLER
// POST /api/webhooks/stripe
// ⚠️  Raw body must NOT be parsed. This is configured in
//    next.config.ts via bodyParser: false alternative.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent, processWebhookEvent } from "@/lib/stripe/webhook";

// Disable Next.js body parsing — Stripe needs the raw body to verify signature
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.warn("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error("[Stripe Webhook] Failed to read request body:", err);
    return NextResponse.json(
      { error: "Failed to read request body" },
      { status: 400 }
    );
  }

  // ── Verify signature ────────────────────────────────────────────────────
  let event;
  try {
    event = await constructWebhookEvent(rawBody, signature);
  } catch (err) {
    console.warn("[Stripe Webhook] Signature verification failed:", err);
    // Return 400 to tell Stripe this was a bad delivery
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // ── Process event idempotently ──────────────────────────────────────────
  try {
    const result = await processWebhookEvent(event);
    console.log("[Stripe Webhook] Result:", result);
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (err) {
    console.error("[Stripe Webhook] Processing error:", err);
    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
