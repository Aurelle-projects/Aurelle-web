import crypto from "crypto";

const SECRET =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.BREVO_API_KEY ||
  "aurelle-secure-delivery-review-token-key-2026";

/**
 * Generate a URL-safe signed HMAC token representing an email review invitation
 * for a specific order and customer.
 */
export function createReviewToken(orderId: string, email: string): string {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const hash = crypto
    .createHmac("sha256", SECRET)
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
    const normalizedEmail = (email || "").trim().toLowerCase();
    const raw = Buffer.from(token, "base64url").toString("utf-8");
    const payload = JSON.parse(raw);

    if (payload.orderId !== orderId) return false;
    if (payload.email !== normalizedEmail) return false;

    const expectedHash = crypto
      .createHmac("sha256", SECRET)
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
