/**
 * WhatsApp formatting helper for Aurelle storefront & wholesale sections.
 * Automatically handles raw phone numbers, international formats, and full URLs.
 */

export function formatWhatsAppUrl(raw: string | null | undefined, text?: string): string {
  if (!raw || !raw.trim()) {
    const defaultNum = "971501234567";
    return `https://wa.me/${defaultNum}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      if (text && !url.searchParams.has("text")) {
        url.searchParams.set("text", text);
      }
      return url.toString();
    } catch {
      return trimmed;
    }
  }

  // Strip all non-digit characters
  const digits = trimmed.replace(/[^0-9]/g, "");
  const base = digits || "971501234567";
  return `https://wa.me/${base}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatWhatsAppDisplay(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) {
    return "+971 50 123 4567";
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const match = trimmed.match(/wa\.me\/([0-9]+)/);
    if (match && match[1]) {
      const d = match[1];
      if (d.startsWith("971") && d.length >= 9) {
        return `+971 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
      }
      return `+${d}`;
    }
    return trimmed;
  }

  return trimmed;
}
