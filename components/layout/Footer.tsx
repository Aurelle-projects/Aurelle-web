import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";

interface FooterProps {
  settings?: Record<string, unknown>;
}

const FOOTER_SHOP = [
  { href: "/shop", label: "All Products" },
  { href: "/categories/skincare-body-care", label: "Skincare" },
  { href: "/categories/hair-care", label: "Hair Care" },
  { href: "/categories/cosmetics-makeup", label: "Cosmetics" },
  { href: "/categories/perfumes-fragrances", label: "Fragrances" },
  { href: "/categories/baby-care", label: "Baby Care" },
];

const FOOTER_INFO = [
  { href: "/about", label: "About Aurelle" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/contact", label: "Contact Us" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/return-policy", label: "Returns" },
];

const FOOTER_LEGAL = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
];

export default function Footer({ settings = {} }: FooterProps) {
  const contactEmail = settings["contact_email"] as string | null;
  const contactPhone = settings["contact_phone"] as string | null;
  const contactAddress = settings["contact_address"] as string | null;
  const instagram = settings["social_instagram"] as string | null;
  const facebook = settings["social_facebook"] as string | null;
  const tiktok = settings["social_tiktok"] as string | null;

  return (
    <footer className="bg-[#1D211F] text-white pt-12 md:pt-16 pb-8 border-t border-white/10" role="contentinfo">
      {/* ── Main Footer ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-10 pb-12 border-b border-white/10">
        {/* Brand Column */}
        <div className="flex flex-col">
          <Link href="/" className="inline-block mb-4 hover:scale-[1.02] transition-transform" aria-label="Aurelle Home">
            <Image
              src="/logo.png"
              alt="Aurelle Cosmetics Trading FZ-LLC"
              width={180}
              height={90}
              className="h-12 w-auto max-w-[180px] object-contain block drop-shadow-md"
            />
          </Link>
          <p className="text-sm text-white/65 leading-relaxed mb-5 max-w-[300px]">
            Everyday essentials, elevated. Beauty, personal care and lifestyle
            products for everyone.
          </p>

          <address className="flex flex-col gap-2.5 not-italic mb-6 text-sm text-white/70">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail size={15} strokeWidth={1.75} aria-hidden="true" />
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone size={15} strokeWidth={1.75} aria-hidden="true" />
                {contactPhone}
              </a>
            )}
            {contactAddress && (
              <span className="flex items-start gap-2">
                <MapPin size={15} strokeWidth={1.75} aria-hidden="true" className="shrink-0 mt-0.5" />
                <span>{contactAddress}</span>
              </span>
            )}
          </address>

          {/* Social buttons */}
          {(instagram || facebook || tiktok) && (
            <div className="flex gap-2" aria-label="Social media links">
              {instagram && (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-sm text-white/70 bg-white/[0.08] hover:bg-[#183D2B] hover:text-white transition-all"
                  aria-label="Aurelle on Instagram"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
              )}
              {facebook && (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-sm text-white/70 bg-white/[0.08] hover:bg-[#183D2B] hover:text-white transition-all"
                  aria-label="Aurelle on Facebook"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </a>
              )}
              {tiktok && (
                <a
                  href={tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-sm text-white/70 bg-white/[0.08] hover:bg-[#183D2B] hover:text-white transition-all"
                  aria-label="Aurelle on TikTok"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.33 6.33 0 00-6.33 6.33 6.33 6.33 0 006.33 6.33 6.33 6.33 0 006.33-6.33V8.79a8.18 8.18 0 004.78 1.52V6.86a4.85 4.85 0 01-1.01-.17z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Shop Column */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Shop</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            {FOOTER_SHOP.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Column */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Company</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
            {FOOTER_INFO.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/70 hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Wholesale CTA */}
        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-white/50 mb-4">Wholesale</h3>
          <p className="text-sm text-white/60 leading-relaxed mb-4">
            Are you a business? Apply for a wholesale account to access
            exclusive pricing and MOQ benefits.
          </p>
          <Link
            href="/wholesale"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#183D2B] bg-white hover:bg-[#FAF8F5] rounded-sm transition-colors"
          >
            Apply for Wholesale
            <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/45">
        <p>
          &copy; {new Date().getFullYear()} Aurelle Cosmetics Trading
          FZ-LLC. All rights reserved.
        </p>
        <nav aria-label="Legal links">
          <ul className="flex flex-wrap gap-4 list-none p-0 m-0">
            {FOOTER_LEGAL.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white/80 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
