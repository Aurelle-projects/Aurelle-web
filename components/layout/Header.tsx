"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  userRole?: UserRole | null;
  cartCount?: number;
  wishlistCount?: number;
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/shop?sort=newest", label: "New Arrivals" },
  { href: "/shop?sort=bestseller", label: "Best Sellers" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/shop?filter=brands", label: "Brands" },
  { href: "/shop?filter=offers", label: "Offers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header({
  userRole,
  cartCount = 0,
  wishlistCount = 0,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read live count from CartContext
  let liveCartCount = cartCount;
  try {
    const cart = useCart();
    if (cart) {
      liveCartCount = cart.itemCount;
    }
  } catch {
    // context not present in preview
  }

  const [announcement, setAnnouncement] = useState({
    text: "Free Shipping Across UAE on AED 199+ | 100% Authentic Products | Skincare, Fragrance, Wellness",
    link: "/shop",
    country: "UAE | AED",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("aurelle_admin_settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.announcement_text) {
            setAnnouncement((prev) => ({
              ...prev,
              text: parsed.announcement_text,
              link: parsed.announcement_link || prev.link,
            }));
          }
        }
      } catch {
        // Ignore
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isAuthenticated = !!userRole;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    }
  }

  return (
    <>
      {/* ─── Top Announcement Bar (Tailwind) ─────────────────────────── */}
      <div className="bg-[#183D2B] text-white text-[11px] tracking-wide border-b border-white/10 relative z-50" role="region" aria-label="Announcement">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[34px]">
          <div className="flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
            <Link href={announcement.link} className="text-white/90 hover:text-white hover:underline transition-colors font-medium">
              <span>{announcement.text}</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <div className="text-white/85 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer">
              <span className="text-[13px]" aria-hidden="true">🇦🇪</span>
              <span>{announcement.country}</span>
              <ChevronDown size={13} strokeWidth={2} />
            </div>

            <span className="text-white/25 text-[10px]" aria-hidden="true">|</span>

            <Link href="/contact" className="text-white/85 hover:text-white transition-colors font-medium">
              Help
            </Link>

            <span className="text-white/25 text-[10px]" aria-hidden="true">|</span>

            <Link href="/account/orders" className="text-white/85 hover:text-white transition-colors font-medium">
              Track Order
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Main Header (Tailwind) ──────────────────────────────────── */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-[#DCCFB9]/40 shadow-xs" role="banner">
        <div className="max-w-7xl mx-auto px-4">
          {/* Row 1: Logo | Search | Actions */}
          <div className="flex items-center justify-between py-3 gap-4 md:gap-6">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 hover:scale-[1.02] transition-transform" aria-label="Aurelle Home">
              <Image
                src="/logo.png"
                alt="Aurelle Cosmetics Trading FZ-LLC"
                width={170}
                height={80}
                priority
                className="h-12 w-auto max-w-[170px] object-contain block"
              />
            </Link>

            {/* Desktop Search */}
            <form
              className="hidden md:flex flex-1 max-w-[580px] mx-auto relative items-center"
              onSubmit={handleSearchSubmit}
              role="search"
            >
              <input
                ref={searchInputRef}
                type="text"
                className="w-full h-11 pl-4 pr-12 bg-[#F7F5EF] border border-[#DCCFB9]/80 rounded-full text-[13.5px] text-[#1D211F] outline-none transition-all placeholder:text-[#8C938F] focus:bg-white focus:border-[#183D2B] focus:ring-3 focus:ring-[#183D2B]/10"
                placeholder="Search for products, brands or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search for products, brands or categories"
              />
              <button
                type="submit"
                className="absolute right-1.5 w-8 h-8 rounded-full text-[#183D2B] flex items-center justify-center hover:bg-[#183D2B]/10 transition-colors"
                aria-label="Submit search"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3.5 shrink-0">
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="hidden md:flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                aria-label={isAuthenticated ? "My account" : "Sign in"}
              >
                <User size={20} strokeWidth={1.75} />
                <span className="text-[11px] font-semibold tracking-tight">Account</span>
              </Link>

              <Link
                href="/account/wishlist"
                className="hidden md:flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
              >
                <div className="relative flex items-center justify-center">
                  <Heart size={20} strokeWidth={1.75} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-tight">Wishlist</span>
              </Link>

              <Link
                href="/cart"
                className="flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                aria-label={`Shopping cart${liveCartCount > 0 ? `, ${liveCartCount} items` : ""}`}
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingBag size={20} strokeWidth={1.75} />
                  <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
                    {liveCartCount > 99 ? "99+" : liveCartCount}
                  </span>
                </div>
                <span className="hidden md:block text-[11px] font-semibold tracking-tight">Cart</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex text-[11px] font-bold tracking-wider uppercase bg-[#183D2B]/10 text-[#183D2B] px-3 py-1.5 rounded-full border border-[#183D2B]/20 hover:bg-[#183D2B] hover:text-white transition-all shadow-xs"
                  title="Open Admin Management Console"
                >
                  Admin
                </Link>
              )}

              <button
                className="md:hidden p-1.5 text-[#1D211F] hover:text-[#183D2B] transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={22} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form
            className="md:hidden relative pb-3"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full h-10 pl-3 pr-10 bg-[#F7F5EF] border border-[#DCCFB9]/80 rounded-lg text-sm text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:bg-white focus:border-[#183D2B]"
                placeholder="Search products, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search products"
              />
              <button
                type="submit"
                className="absolute right-2.5 text-[#183D2B] p-1"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </div>
          </form>

          {/* Row 2: Desktop Nav */}
          <nav className="hidden md:flex justify-center border-t border-[#DCCFB9]/35 py-2" aria-label="Main navigation">
            <ul className="flex items-center gap-5 list-none m-0 p-0">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href) && !link.href.includes("?"));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`text-[13.5px] font-medium py-1 px-1.5 relative transition-colors ${
                        isActive
                          ? "text-[#183D2B] font-semibold after:content-[''] after:absolute after:-bottom-2 after:left-1.5 after:right-1.5 after:h-0.5 after:bg-[#183D2B] after:rounded-full"
                          : "text-[#1D211F] hover:text-[#183D2B]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      {/* ─── Mobile Menu Drawer ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed top-0 right-0 bottom-0 w-[min(320px,85vw)] bg-white z-50 flex flex-col shadow-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#DCCFB9]/40">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center"
                aria-label="Aurelle Home"
              >
                <Image
                  src="/logo.png"
                  alt="Aurelle Cosmetics Trading FZ-LLC"
                  width={130}
                  height={65}
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <button
                className="p-1 text-[#1D211F] hover:text-[#183D2B]"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} strokeWidth={1.75} />
              </button>
            </div>

            <nav className="flex-1 p-4" aria-label="Mobile navigation">
              <ul className="flex flex-col gap-1 list-none p-0 m-0">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2.5 text-base font-medium text-[#1D211F] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      className="block px-3 py-2.5 text-base font-bold text-[#183D2B] rounded-lg hover:bg-[#F7F5EF] transition-colors"
                    >
                      Admin Console
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <div className="p-4 border-t border-[#DCCFB9]/40">
              <Link
                href={isAuthenticated ? "/account" : "/login"}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#183D2B] text-white font-semibold text-sm hover:bg-[#102D20] transition-colors"
              >
                <User size={18} strokeWidth={1.75} aria-hidden="true" />
                {isAuthenticated ? "My Account" : "Sign In"}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
