// ============================================================
// AURELLE — SLUG UTILITIES
// ============================================================

/**
 * Generate a URL-safe slug from a string.
 * - Converts to lowercase and trims whitespace
 * - Replaces '&' with '-and-'
 * - Removes accents / diacritics
 * - Removes non-alphanumeric characters (except spaces and hyphens)
 * - Converts all spaces and underscores to single hyphens
 * - Removes leading and trailing hyphens
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "-and-")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a unique order number.
 * Format: AUR-YYYYMMDD-XXXXX
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");

  return `AUR-${year}${month}${day}-${random}`;
}
