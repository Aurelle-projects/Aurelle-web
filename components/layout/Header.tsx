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

const CATEGORY_NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/categories/skincare-body-care", label: "Skincare" },
  { href: "/categories/hair-care", label: "Hair Care" },
  { href: "/categories/personal-care-hygiene", label: "Personal Care" },
  { href: "/categories/cosmetics-makeup", label: "Makeup" },
  { href: "/categories/perfumes-fragrances", label: "Fragrance" },
  { href: "/categories/baby-care", label: "Baby Care" },
  { href: "/categories/health-wellness", label: "Wellness" },
  { href: "/categories/household-lifestyle", label: "Household" },
  { href: "/shop?filter=brands", label: "Brands" },
];

const SCROLLED_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?filter=brands", label: "Brand" },
  { href: "/about", label: "About" },
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrolledSearchInputRef = useRef<HTMLInputElement>(null);

  // Scroll listener with hysteresis deadband and requestAnimationFrame to eliminate any jitter/shaking
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY > 100) {
            setIsScrolled(true);
          } else if (scrollY < 30) {
            setIsScrolled(false);
            setSearchOpen(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    if (window.scrollY > 100) {
      setIsScrolled(true);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Close mobile menu and search dropdown on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    if (searchOpen && scrolledSearchInputRef.current) {
      scrolledSearchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const isAuthenticated = !!userRole;
  const isAdmin = userRole === "admin" || userRole === "super_admin";

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      if (query.toLowerCase() === "/admin" || query.toLowerCase() === "admin") {
        router.push("/admin");
      } else {
        router.push(`/shop?search=${encodeURIComponent(query)}`);
      }
      setSearchQuery("");
      setSearchOpen(false);
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      if (scrolledSearchInputRef.current) {
        scrolledSearchInputRef.current.blur();
      }
    }
  }

  function renderCategoryNav() {
    return (
      <nav className="w-full flex items-center justify-center pt-0.5" aria-label="Category navigation">
        <ul className="flex items-center justify-center gap-3.5 lg:gap-5 xl:gap-5.5 list-none m-0 p-0 whitespace-nowrap uppercase">
          {CATEGORY_NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/shop" && pathname.startsWith(link.href) && !link.href.includes("?"));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide py-0.5 relative transition-colors ${isActive
                      ? "text-[#183D2B] font-semibold"
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
    );
  }

  function renderScrolledNav() {
    return (
      <nav className="w-full flex items-center justify-center" aria-label="Main navigation">
        <ul className="flex items-center justify-center gap-6 md:gap-4 list-none m-0 p-0 whitespace-nowrap uppercase">
          {SCROLLED_NAV_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href.includes("?")
                  ? pathname === link.href.split("?")[0]
                  : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide py-1 px-1 relative transition-colors ${isActive
                      ? "text-[#183D2B] font-semibold"
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
    );
  }

  return (
    <>
      {/* ─── Sticky Header Wrapper (Shows top header and main header at all times) ─── */}
      <div id="sticky-header-wrapper" className="sticky top-0 left-0 right-0 z-40 bg-white">
        {/* ─── Top Announcement Bar ──────────────────────────────────── */}
        <div className="bg-[#183D2B] text-white text-[11px] tracking-wide border-b border-white/10" role="region" aria-label="Announcement">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[34px]">
            <div className="flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
              <Link href={announcement.link} className="text-white/90 hover:text-white hover:underline transition-colors font-medium">
                <span>{announcement.text}</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3 shrink-0">
              <div className="text-white/85 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer">
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

        {/* ─── Main Header ───────────────────────────────────────────── */}
        <header className={`bg-white border-b border-[#DCCFB9]/40 ${isScrolled ? "shadow-md" : "shadow-xs"}`} role="banner">
          <div className="max-w-7xl mx-auto px-4">
            <div className={`flex items-center gap-5 lg:gap-7 ${isScrolled ? "py-2" : "py-2.5"}`}>
              {/* Logo — Stable container width avoids horizontal layout shift */}
              <Link
                href="/"
                className="flex items-center shrink-0 w-[150px] sm:w-[180px] md:w-[210px] hover:scale-[1.02] transition-transform"
                aria-label="Aurelle Home"
              >
                <Image
                  src="/logo.png"
                  alt="Aurelle Cosmetics Trading FZ-LLC"
                  width={260}
                  height={110}
                  priority
                  className={`w-auto object-contain block ${isScrolled
                      ? "h-11 md:h-[46px]"
                      : "h-12 sm:h-14 md:h-[80px]"
                    }`}
                />
              </Link>

              {/* Desktop Right Column: Search & Actions on Top, Category Nav on Bottom */}
              <div className={`hidden md:flex flex-1 flex-col justify-center min-w-0 ${isScrolled ? "gap-0" : "gap-2"}`}>
                {/* Row 1: Search (Decreased Width & Centered) or Scrolled Nav (when scrolled) & Actions */}
                <div className="flex items-center justify-between gap-4 lg:gap-6">
                  {/* Search / Scrolled Navigation in stable h-10 container */}
                  <div className="flex-1 flex justify-center items-center min-w-0 h-10">
                    {!isScrolled ? (
                      <form
                        className="w-full max-w-[480px] h-10 relative flex items-center"
                        onSubmit={handleSearchSubmit}
                        role="search"
                      >
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="w-full h-10 pl-4 pr-11 bg-transparent border border-[#D8CDBB] rounded-sm text-[13.5px] text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 transition-colors"
                          placeholder="Search for products, brands or categories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          aria-label="Search for products, brands or categories"
                        />
                        <button
                          type="submit"
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1.5 flex items-center justify-center hover:opacity-75 transition-opacity"
                          aria-label="Submit search"
                        >
                          <Search size={18} strokeWidth={2} />
                        </button>
                      </form>
                    ) : (
                      <div className="w-full h-10 flex items-center justify-center min-w-0">
                        {renderScrolledNav()}
                      </div>
                    )}
                  </div>

                  {/* Actions - Reduced icon size */}
                  <div className="flex items-center gap-5 lg:gap-6 shrink-0">
                    {isScrolled && (
                      <button
                        type="button"
                        onClick={() => setSearchOpen((prev) => !prev)}
                        className={`flex flex-col items-center gap-0.5 transition-colors p-1 ${searchOpen ? "text-[#183D2B]" : "text-[#1D211F] hover:text-[#183D2B]"
                          }`}
                        aria-label="Search"
                        title="Search"
                      >
                        <Search size={19} strokeWidth={1.6} />
                        <span className="text-[11px] font-semibold tracking-tight">Search</span>
                      </button>
                    )}

                    <Link
                      href={isAuthenticated ? "/account" : "/login"}
                      className="flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                      aria-label={isAuthenticated ? "My account" : "Sign in"}
                    >
                      <User size={19} strokeWidth={1.6} />
                      <span className="text-[11px] font-semibold tracking-tight">Account</span>
                    </Link>

                    <Link
                      href="/account/wishlist"
                      className="flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                      aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <Heart size={19} strokeWidth={1.6} />
                        {wishlistCount > 0 && (
                          <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
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
                        <ShoppingBag size={19} strokeWidth={1.6} />
                        <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
                          {liveCartCount > 99 ? "99+" : liveCartCount}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight">Cart</span>
                    </Link>
                  </div>
                </div>

                {/* Row 2: Category Navigation (Only shown when not scrolled) */}
                {!isScrolled && (
                  <div className="flex items-center justify-between gap-4 lg:gap-6">
                    <div className="flex-1 flex justify-center min-w-0">
                      {renderCategoryNav()}
                    </div>

                    {/* Symmetrical spacer matching the exact Actions width to guarantee dead-center alignment */}
                    <div className="invisible flex items-center gap-5 lg:gap-6 shrink-0 pointer-events-none" aria-hidden="true">
                      <div className="flex flex-col items-center p-1">
                        <div className="w-[19px] h-[19px]" />
                        <span className="text-[11px]">Account</span>
                      </div>
                      <div className="flex flex-col items-center p-1">
                        <div className="w-[19px] h-[19px]" />
                        <span className="text-[11px]">Wishlist</span>
                      </div>
                      <div className="flex flex-col items-center p-1">
                        <div className="w-[19px] h-[19px]" />
                        <span className="text-[11px]">Cart</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="flex md:hidden items-center gap-3 ml-auto">
                {/* Mobile Search Icon Toggle */}
                <button
                  type="button"
                  className="p-1.5 text-[#1D211F] hover:text-[#183D2B]"
                  onClick={() => setMobileSearchOpen((prev) => !prev)}
                  aria-label="Search"
                >
                  {mobileSearchOpen ? <X size={20} strokeWidth={1.75} /> : <Search size={20} strokeWidth={1.75} />}
                </button>
                <Link
                  href="/cart"
                  className="flex items-center p-1 text-[#1D211F] hover:text-[#183D2B]"
                  aria-label="Cart"
                >
                  <div className="relative">
                    <ShoppingBag size={20} strokeWidth={1.6} />
                    <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white">
                      {liveCartCount > 99 ? "99+" : liveCartCount}
                    </span>
                  </div>
                </Link>
                <button
                  className="p-1.5 text-[#1D211F] hover:text-[#183D2B]"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <Menu size={22} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Mobile Search — toggles on search icon tap */}
            {mobileSearchOpen && (
              <form
                className="md:hidden relative pb-3"
                onSubmit={handleSearchSubmit}
                role="search"
              >
                <div className="relative flex items-center">
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    className="w-full h-10 pl-3.5 pr-10 bg-transparent border border-[#D8CDBB] rounded-md text-sm text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:border-[#183D2B] transition-colors"
                    placeholder="Search products, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1"
                    aria-label="Search"
                  >
                    <Search size={18} strokeWidth={2} />
                  </button>
                </div>
              </form>
            )}

            {/* Desktop Search Dropdown (when scrolled and user clicks search icon) */}
            {isScrolled && searchOpen && (
              <div className="hidden md:block border-t border-[#DCCFB9]/40 py-2.5">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                  <form
                    className="flex-1 relative flex items-center"
                    onSubmit={handleSearchSubmit}
                    role="search"
                  >
                    <input
                      ref={scrolledSearchInputRef}
                      type="text"
                      className="w-full h-10 pl-4 pr-11 bg-transparent border border-[#D8CDBB] rounded-md text-[13.5px] text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 transition-colors"
                      placeholder="Search for products, brands or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search for products, brands or categories"
                    />
                    <button
                      type="submit"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1.5 flex items-center justify-center hover:opacity-75 transition-opacity"
                      aria-label="Submit search"
                    >
                      <Search size={18} strokeWidth={2} />
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="p-2 text-[#1D211F]/70 hover:text-[#183D2B] rounded-md transition-colors"
                    aria-label="Close search"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* ─── Mobile Menu Drawer ────────────────────────────────────── */}
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
                  width={160}
                  height={75}
                  className="h-11 w-auto object-contain"
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
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#8C938F] mb-1.5">
                Categories
              </p>
              <ul className="flex flex-col gap-0.5 list-none p-0 m-0 mb-4">
                {CATEGORY_NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 text-sm font-medium text-[#1D211F] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#8C938F] mb-1.5">
                Explore
              </p>
              <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
                <li>
                  <Link
                    href="/categories"
                    className="block px-3 py-2 text-sm font-medium text-[#5C6460] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                  >
                    All Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="block px-3 py-2 text-sm font-medium text-[#5C6460] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                  >
                    About Aurelle
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="block px-3 py-2 text-sm font-medium text-[#5C6460] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-sm font-bold text-[#183D2B] rounded-lg hover:bg-[#F7F5EF] transition-colors"
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
