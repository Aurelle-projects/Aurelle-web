// ============================================================
// AURELLE — CLOUDINARY CONFIGURATION
// ⚠️  CLOUDINARY_API_SECRET is server-only.
// This file is safe to import on server.
// For client-side: use only the cloud name (NEXT_PUBLIC_).
// ============================================================

export const cloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  apiKey: process.env.CLOUDINARY_API_KEY ?? "",
  // API Secret — server-only, never exposed to client
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET ?? "aurelle_products",
} as const;

/**
 * Validate that required Cloudinary environment variables are set.
 * Call this in server-side upload routes.
 */
export function validateCloudinaryConfig(): void {
  if (!cloudinaryConfig.cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not set.");
  }
  if (!cloudinaryConfig.apiKey) {
    throw new Error("CLOUDINARY_API_KEY is not set.");
  }
  if (!cloudinaryConfig.apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not set.");
  }
}
