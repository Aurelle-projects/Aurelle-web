// ============================================================
// AURELLE — CLOUDINARY TRANSFORMATION UTILITIES
//
// CONTROLLED TRANSFORMATION STRATEGY:
// Only these predefined sizes are used.
// Never generate arbitrary dimensions from user input.
// This prevents transformation cost explosions on Cloudinary.
//
// Predefined sizes:
//   thumbnail  — 150×150  (grid thumbnails, wishlist)
//   small      — 400×400  (product cards in listings)
//   medium     — 800×800  (product detail gallery)
//   large      — 1200×1200 (product zoom, full-width)
//   zoom       — 2000×2000 (lightbox zoom)
//   hero       — 1920×800  (homepage hero, banners)
//   category   — 600×400  (category cards)
// ============================================================

import type { ImageSize } from "@/types/product";

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  "korjax8u";

// ─── Dimension map ────────────────────────────────────────────────────────────
const SIZE_MAP: Record<ImageSize, { w: number; h: number }> = {
  thumbnail: { w: 150, h: 150 },
  small: { w: 400, h: 400 },
  medium: { w: 800, h: 800 },
  large: { w: 1200, h: 1200 },
  zoom: { w: 2000, h: 2000 },
};

/**
 * Build a Cloudinary delivery URL for a product image.
 *
 * Uses f_auto (AVIF → WebP → JPEG) and q_auto for quality.
 * Crop mode: fill with gravity auto for smart cropping.
 */
export function getProductImageUrl(
  publicId: string,
  size: ImageSize,
  options?: {
    crop?: "fill" | "fit" | "pad" | "scale";
    gravity?: "auto" | "face" | "center";
  }
): string {
  if (!publicId || !CLOUD_NAME) return "";

  const { w, h } = SIZE_MAP[size];
  const crop = options?.crop ?? "fill";
  const gravity = options?.gravity ?? "auto";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${w},h_${h},c_${crop},g_${gravity}/${publicId}`;
}

/**
 * Build a Cloudinary delivery URL for a hero/banner image.
 * Desktop: 1920×800, Mobile: 768×500
 */
export function getHeroImageUrl(
  publicId: string,
  variant: "desktop" | "mobile" = "desktop"
): string {
  if (!publicId || !CLOUD_NAME) return "";

  const dims =
    variant === "desktop"
      ? "w_1920,h_800,c_fill,g_auto"
      : "w_768,h_500,c_fill,g_auto";

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,${dims}/${publicId}`;
}

/**
 * Build a Cloudinary delivery URL for a category card image.
 */
export function getCategoryImageUrl(publicId: string): string {
  if (!publicId) return "";
  if (publicId.startsWith("http://") || publicId.startsWith("https://")) {
    return publicId;
  }
  const cloudName = CLOUD_NAME || "korjax8u";
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_600,h_400,c_fill,g_auto/${publicId}`;
}

/**
 * Build a Cloudinary delivery URL for a brand logo.
 */
export function getBrandLogoUrl(publicId: string): string {
  if (!publicId || !CLOUD_NAME) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_300,h_100,c_fit/${publicId}`;
}

/**
 * Build a srcSet string for a product image across responsive sizes.
 * Use in <img srcSet> or Next.js Image loader.
 */
export function getProductImageSrcSet(publicId: string): string {
  if (!publicId || !CLOUD_NAME) return "";

  const sizes: Array<[ImageSize, number]> = [
    ["thumbnail", 150],
    ["small", 400],
    ["medium", 800],
    ["large", 1200],
  ];

  return sizes
    .map(([size, w]) => `${getProductImageUrl(publicId, size)} ${w}w`)
    .join(", ");
}

/**
 * Generate a Cloudinary signed upload signature.
 * Call this SERVER-SIDE only to create signed upload params.
 * Returns parameters to pass to Cloudinary upload widget or direct upload.
 */
export function buildUploadFolder(category: string): string {
  // Organize uploads by category in Cloudinary
  const folderMap: Record<string, string> = {
    products: "aurelle/products",
    categories: "aurelle/categories",
    brands: "aurelle/brands",
    banners: "aurelle/banners",
    wholesale: "aurelle/wholesale",
  };

  return folderMap[category] ?? "aurelle/misc";
}
