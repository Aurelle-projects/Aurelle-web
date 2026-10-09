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

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

import fs from "fs";
import path from "path";

const CREDENTIALS_FILE = path.join(process.cwd(), ".admin_credentials.json");

export function saveLocalAdminCredentials(salt: string, hash: string): void {
  try {
    fs.writeFileSync(
      CREDENTIALS_FILE,
      JSON.stringify({ salt, hash, updated_at: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.warn("[saveLocalAdminCredentials] Could not write credentials file:", err);
  }
}

export function getLocalAdminCredentials(): { salt: string; hash: string } | null {
  try {
    if (!fs.existsSync(CREDENTIALS_FILE)) return null;
    const raw = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (data?.salt && data?.hash) {
      return { salt: data.salt, hash: data.hash };
    }
  } catch (err) {
    console.warn("[getLocalAdminCredentials] Could not read credentials file:", err);
  }
  return null;
}

