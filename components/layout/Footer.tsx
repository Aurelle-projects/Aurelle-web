"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FooterProps {
  settings?: Record<string, unknown>;
}

interface AccordionSectionProps {
  title: string;
  links: { href: string; label: string }[];
}

function AccordionSection({ title, links }: AccordionSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 md:border-none">
      {/* Mobile: clickable toggle */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="md:hidden w-full flex items-center justify-between py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold tracking-widest uppercase text-[#DCCFB9]">
          {title}
        </span>
        <ChevronDown
          size={15}
          className={`text-[#DCCFB9] transition-transform duration-300 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Desktop: always-visible heading */}
      <h3 className="hidden md:block text-[11px] font-bold tracking-widest uppercase text-[#DCCFB9] mb-3">
        {title}
      </h3>

      {/* Links: collapsible on mobile, always visible on desktop */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:overflow-visible md:max-h-none md:pb-0 ${
          open ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-xs text-white/80 hover:text-white hover:underline underline-offset-2 transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const FOOTER_SHOP = [
  { href: "/shop", label: "All Products" },
  { href: "/shop?filter=new-arrivals", label: "New Arrivals" },
  { href: "/shop?category=cosmetics-makeup", label: "Cosmetics & Makeup" },
  { href: "/shop?category=skincare-body-care", label: "Skincare & Body Care" },
  { href: "/shop?category=hair-care", label: "Hair Care" },
  { href: "/shop?category=perfumes-fragrances", label: "Perfumes & Fragrances" },
];

const FOOTER_CUSTOMER_CARE = [
  { href: "/about", label: "About Aurelle" },
  { href: "/contact", label: "Contact Us" },
  { href: "/shop?filter=brands", label: "Shop by Brand" },
  { href: "/account", label: "My Account" },
];

const FOOTER_POLICIES = [
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-policy", label: "Return Policy" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export default function Footer({ settings = {} }: FooterProps) {
  const contactEmail = (settings["contact_email"] as string) || "info@aurelle.ae";
  const contactPhone = (settings["contact_phone"] as string) || "+971 50 123 4567";
  const contactAddress = (settings["contact_address"] as string) || "Dubai, United Arab Emirates";

  const instagram = (settings["social_instagram"] as string) || "https://instagram.com/aurelle.ae";
  const facebook = (settings["social_facebook"] as string) || "https://facebook.com/aurelle.ae";
  const tiktok = (settings["social_tiktok"] as string) || "https://tiktok.com/@aurelle.ae";
  const whatsapp = (settings["social_whatsapp"] as string) || "https://wa.me/971501234567";

  return (
    <footer className="bg-[#183D2B] text-white pt-8 md:pt-10 pb-5 border-t border-[#DCCFB9]/20" role="contentinfo">
      {/* ── Main Footer ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-0 md:gap-6 lg:gap-8 pb-6 md:pb-8">
        {/* Brand Column (full width of 2 cols on mobile) */}
          <div className="flex flex-col pb-5 md:pb-0 border-b border-white/10 md:border-none mb-1 md:mb-0">
          <Link href="/" className="inline-block mb-3 hover:opacity-90 transition-opacity" aria-label="Aurelle Home">
            <Image
              src="/logo.png"
              alt="Aurelle Cosmetics Trading FZ-LLC"
              width={180}
              height={75}
              className="h-10 sm:h-11 w-auto object-contain block filter brightness-110 drop-shadow-sm"
            />
          </Link>
          <p className="text-xs text-white/75 leading-relaxed mb-3 max-w-[320px]">
            Everyday essentials, elevated. Authentic beauty, personal care and lifestyle products across the UAE.
          </p>

          <address className="flex flex-col gap-1.5 not-italic text-xs text-white/80 mb-3">
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-[#DCCFB9] transition-colors">
              <Mail size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[#DCCFB9]" />
              <span className="truncate">{contactEmail}</span>
            </a>
            <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-[#DCCFB9] transition-colors">
              <Phone size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[#DCCFB9]" />
              <span>{contactPhone}</span>
            </a>
            <span className="flex items-center gap-2 text-white/70">
              <MapPin size={13} strokeWidth={1.75} aria-hidden="true" className="shrink-0 text-[#DCCFB9]" />
              <span>{contactAddress}</span>
            </span>
          </address>

          {/* Social media icons */}
          <div className="flex items-center gap-2 pt-1" aria-label="Social media links">
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#DCCFB9] hover:text-[#183D2B] text-white/90 flex items-center justify-center transition-all duration-200 border border-white/5"
              aria-label="Aurelle on Instagram"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#DCCFB9] hover:text-[#183D2B] text-white/90 flex items-center justify-center transition-all duration-200 border border-white/5"
              aria-label="Aurelle on Facebook"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </a>
            <a
              href={tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#DCCFB9] hover:text-[#183D2B] text-white/90 flex items-center justify-center transition-all duration-200 border border-white/5"
              aria-label="Aurelle on TikTok"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.33 6.33 0 00-6.33 6.33 6.33 6.33 0 006.33 6.33 6.33 6.33 0 006.33-6.33V8.79a8.18 8.18 0 004.78 1.52V6.86a4.85 4.85 0 01-1.01-.17z" />
              </svg>
            </a>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#DCCFB9] hover:text-[#183D2B] text-white/90 flex items-center justify-center transition-all duration-200 border border-white/5"
              aria-label="Aurelle on WhatsApp"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.214 8.214 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.19-.31a8.232 8.232 0 01-1.26-4.44c0-4.54 3.7-8.24 8.24-8.24v.02zm-3.53 4.67c-.2 0-.41.02-.6.1-.21.09-.64.38-.64 1.15 0 .76.56 1.73.64 1.84.08.11 1.1 1.68 2.67 2.36 1.57.67 1.57.45 1.85.42.29-.02.92-.38 1.05-.74.13-.37.13-.68.09-.75-.04-.07-.15-.11-.32-.19-.17-.08-1.03-.51-1.19-.57-.16-.06-.28-.09-.39.09-.12.17-.45.57-.55.69-.1.11-.2.13-.37.04-.17-.08-.73-.27-1.39-.86-.51-.46-.86-1.03-.96-1.2-.1-.17-.01-.27.07-.35.08-.08.17-.2.26-.3.09-.1.12-.17.18-.28.06-.11.03-.21-.01-.3-.05-.08-.39-.95-.54-1.3-.14-.34-.29-.29-.39-.3z" />
              </svg>
            </a>
          </div>
        </div>

          <AccordionSection title="Shop" links={FOOTER_SHOP} />
          <AccordionSection title="Customer Care" links={FOOTER_CUSTOMER_CARE} />
          <AccordionSection title="Policies" links={FOOTER_POLICIES} />
        </div>

        {/* ── Bottom Bar ───────────────────────────────────────────────── */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-white/65">
          <p>
            &copy; {new Date().getFullYear()} Aurelle Cosmetics Trading FZ-LLC. All rights reserved.
          </p>
          <p className="text-white/45 text-[10px] tracking-wide">
            100% Authentic Products • UAE Delivery • Secure Checkout
          </p>
        </div>
      </div>
    </footer>
  );
}
