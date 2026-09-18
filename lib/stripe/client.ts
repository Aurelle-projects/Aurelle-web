// ============================================================
// AURELLE — STRIPE SERVER CLIENT
// ⚠️  SERVER ONLY — NEVER import in client components.
// ============================================================

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. This must be a server-only environment variable."
    );
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, {
      apiVersion: "2026-08-26.dahlia",
      typescript: true,
      appInfo: {
        name: "Aurelle Cosmetics",
        version: "1.0.0",
      },
    });
  }

  return stripeInstance;
}

// Lazy proxy so stripe can be imported safely during build time
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (instance as any)[prop];
    return typeof val === "function" ? val.bind(instance) : val;
  },
});
