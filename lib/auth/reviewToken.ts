import crypto from "crypto";

export function getReviewSecret(): string {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.BREVO_API_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL SECURITY CONFIGURATION ERROR: SUPABASE_SECRET_KEY or BREVO_API_KEY must be configured for review tokens in production."
      );
    }
    return "aurelle-dev-ephemeral-review-token-key";
  }
  return secret;
}

/**
 * Generate a URL-safe signed HMAC token representing an email review invitation
 * for a specific order and customer.
 */
export function createReviewToken(orderId: string, email: string): string {
  const secret = getReviewSecret();
  const normalizedEmail = (email || "").trim().toLowerCase();
  const hash = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}:${normalizedEmail}`)
    .digest("hex");

  return Buffer.from(
    JSON.stringify({
      orderId,
      email: normalizedEmail,
      hash,
    })
  ).toString("base64url");
}

/**
 * Verify that a review token was generated for the given orderId and email.
 */
export function verifyReviewToken(
  orderId: string,
  email: string,
  token: string
): boolean {
  try {
    if (!token) return false;
    const secret = getReviewSecret();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(raw);

    if (payload.orderId !== orderId) return false;
    if (payload.email !== normalizedEmail) return false;

    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}:${normalizedEmail}`)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(payload.hash)
    );
  } catch {
    return false;
  }
}
