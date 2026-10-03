import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "aurelle_admin_session";

function getAdminSigningSecret(): string {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL SECURITY CONFIGURATION ERROR: No server secret configured for admin session signing."
      );
    }
    // In development only, if no env vars exist, use a local ephemeral process secret
    return "aurelle-dev-ephemeral-admin-signing-key";
  }
  return secret;
}

export interface AdminSessionPayload {
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token for admin authentication.
 * Default expiration: 7 days.
 */
export function createAdminSessionToken(
  email: string,
  role: string = "admin",
  expiresInMs: number = 7 * 24 * 60 * 60 * 1000
): string {
  const secret = getAdminSigningSecret();
  const now = Date.now();
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    role,
    iat: now,
    exp: now + expiresInMs,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a cryptographically signed admin session token.
 * Validates HMAC signature with constant-time comparison and verifies timestamp expiration.
 */
export function verifyAdminSessionToken(token?: string | null): {
  valid: boolean;
  payload?: AdminSessionPayload;
  error?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Missing or malformed session token." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token structure." };
  }

  const payloadB64 = parts[0];
  const signature = parts[1];
  if (!payloadB64 || !signature) {
    return { valid: false, error: "Invalid token structure." };
  }

  try {
    const secret = getAdminSigningSecret();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return { valid: false, error: "Invalid token signature." };
    }

    const payloadRaw = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload: AdminSessionPayload = JSON.parse(payloadRaw);

    if (!payload.email || !payload.exp || typeof payload.exp !== "number") {
      return { valid: false, error: "Corrupted token payload." };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: "Session token expired." };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: "Session verification exception." };
  }
}

/**
 * Cookie options for admin session persistence.
 */
export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: "/",
  };
}

/**
 * Convenience helper to verify admin session from Next.js cookie store.
 */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return false;
    }
    const result = verifyAdminSessionToken(sessionCookie.value);
    return result.valid;
  } catch {
    return false;
  }
}
