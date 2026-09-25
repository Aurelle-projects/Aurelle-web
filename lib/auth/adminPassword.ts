import crypto from "crypto";

/**
 * Securely hashes an admin password using Node crypto scrypt
 */
export function hashAdminPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

/**
 * Verifies a plaintext password against a stored scrypt hash and salt
 */
export function verifyAdminPassword(password: string, salt: string, expectedHash: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
  } catch {
    return false;
  }
}
