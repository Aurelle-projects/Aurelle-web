"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from "lucide-react";
import type { UserRole } from "@/types/database";
import { useCart } from "@/context/CartContext";
import dynamic from "next/dynamic";
import AnnouncementBar from "@/components/layout/AnnouncementBar";

const AccountAuthModal = dynamic(() => import("@/components/auth/AccountAuthModal"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/storefront/CartDrawer"), { ssr: false });
const WishlistDrawer = dynamic(() => import("@/components/storefront/WishlistDrawer"), { ssr: false });
import { getWishlist } from "@/components/storefront/WishlistDrawer";
import { createClient } from "@/utils/supabase/client";
import type { ProductItem } from "@/lib/products/mock-products";
import { getProductImageUrl } from "@/lib/cloudinary/transforms";
import { formatPrice } from "@/utils/price";

export interface NavDropdownItem {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  dropdown?: NavDropdownItem[];
}

export interface NavBrand {
  slug: string;
  name: string;
}

export interface NavCategory {
  slug: string;
  name: string;
}

interface HeaderProps {
  userRole?: UserRole | null;
  cartCount?: number;
  wishlistCount?: number;
  navBrands?: NavBrand[];
  navCategories?: NavCategory[];
}

/** Builds the shared nav link structure from DB data. */
function buildNavLinks(
  navBrands: NavBrand[],
  navCategories: NavCategory[]
): NavItem[] {
  const brandDropdown: NavDropdownItem[] = [
    ...navBrands.map((b) => ({
      href: `/shop?brand=${b.slug}`,
      label: b.name,
    })),
    { href: "/shop?filter=brands", label: "View All Brands" },
  ];

  const categoryDropdown: NavDropdownItem[] = [
    ...navCategories.map((c) => ({
      href: `/shop?category=${c.slug}`,
      label: c.name,
    })),
    { href: "/shop", label: "All Categories" },
  ];

  return [
    { href: "/", label: "Home" },
    { href: "/shop?filter=new-arrivals", label: "New Arrivals" },
    { href: "/shop", label: "Products" },
    { href: "/shop?filter=brands", label: "Shop by Brand", dropdown: brandDropdown },
    { href: "/shop?filter=categories", label: "Shop by Category", dropdown: categoryDropdown },
    { href: "/about", label: "About Us" },
  ];
}

/** Splits an array into chunks of a given size. */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default function Header({
  userRole,
  cartCount = 0,
  wishlistCount = 0,
  navBrands = [],
  navCategories = [],
}: HeaderProps) {
  const navLinks = buildNavLinks(navBrands, navCategories);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);
  const [wishlistedItems, setWishlistedItems] = useState<ProductItem[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrolledSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const scrolledSearchContainerRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          setSearchSuggestions(json.products || []);
        }
      } catch (err) {
        console.error("Search suggestions fetch error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        (!searchContainerRef.current || !searchContainerRef.current.contains(target)) &&
        (!mobileSearchContainerRef.current || !mobileSearchContainerRef.current.contains(target)) &&
        (!scrolledSearchContainerRef.current || !scrolledSearchContainerRef.current.contains(target))
      ) {
        setSearchSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function openDropdown(key: string) {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setActiveDropdown(key);
  }

  function closeDropdown() {
    hoverTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  }

  function openAccount() {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    setAccountOpen(true);
  }

  function closeAccount() {
    accountCloseTimer.current = setTimeout(() => setAccountOpen(false), 150);
  }

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

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

  // Close mobile menu and search dropdown on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setMobileDropdownOpen(null);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<{ full_name?: string | null; email?: string | null } | null>(null);

  // Sync wishlist from localStorage on open/close events
  const [wishlistCount2, setWishlistCount2] = useState(0);
  const syncWishlist = useCallback(() => {
    const ids = getWishlist();
    setWishlistCount2(ids.length);
    // We only have ids — show count in header badge (full items managed inside drawer)
    setWishlistedItems((prev) => {
      if (ids.length === 0) return [];
      return prev.filter((p) => ids.includes(p.id));
    });
  }, []);

  useEffect(() => {
    syncWishlist();
    window.addEventListener("wishlist-change", syncWishlist);
    return () => window.removeEventListener("wishlist-change", syncWishlist);
  }, [syncWishlist]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data }: any) => {
            if (data) setCurrentProfile(data);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("profiles")
          .select("full_name, email")
          .eq("id", session.user.id)
          .single()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .then(({ data }: any) => {
            if (data) setCurrentProfile(data);
          });
      } else {
        setCurrentProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = Boolean(currentUser || userRole);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setSearchSuggestions([]);
      setSearchQuery("");
      setSearchOpen(false);
      setMobileSearchOpen(false);
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      if (scrolledSearchInputRef.current) {
        scrolledSearchInputRef.current.blur();
      }
      if (mobileSearchInputRef.current) {
        mobileSearchInputRef.current.blur();
      }
      if (query.toLowerCase() === "/admin" || query.toLowerCase() === "admin") {
        router.push("/admin");
      } else {
        router.push(`/shop?search=${encodeURIComponent(query)}`);
      }
    }
  }

  function handleSelectSuggestion(slug: string) {
    setSearchSuggestions([]);
    setSearchQuery("");
    setSearchOpen(false);
    setMobileSearchOpen(false);
    router.push(`/products/${slug}`);
  }

  function renderCategoryNav() {
    return (
      <nav className="w-full flex items-center justify-center pt-0.5" aria-label="Category navigation">
        <ul className="flex items-center justify-center gap-4 lg:gap-5 xl:gap-6 list-none m-0 p-0 whitespace-nowrap">
          {navLinks.map((link) => {
            const hasDropdown = !!link.dropdown;
            const catKey = `cat-${link.label}`;
            const isOpen = activeDropdown === catKey;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href.includes("?")
                  ? pathname === link.href.split("?")[0]
                  : pathname.startsWith(link.href) && link.href !== "/shop";
            return (
              <li
                key={`${link.href}-${link.label}`}
                className="relative"
                onMouseEnter={() => hasDropdown && openDropdown(catKey)}
                onMouseLeave={() => hasDropdown && closeDropdown()}
              >
                {hasDropdown ? (
                  <>
                    <button
                      type="button"
                      className={`flex items-center gap-0.5 text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide py-0.5 uppercase transition-colors ${isActive || isOpen
                          ? "text-[#183D2B] font-semibold"
                          : "text-[#1D211F] hover:text-[#183D2B]"
                        }`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        size={11}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          key={catKey}
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white border border-[#DCCFB9]/60 shadow-xl z-50 overflow-hidden rounded-sm"
                          onMouseEnter={() => openDropdown(catKey)}
                          onMouseLeave={() => closeDropdown()}
                        >
                          <div className="flex">
                            {chunkArray(link.dropdown ?? [], 10).map((chunk, colIdx) => (
                              <React.Fragment key={colIdx}>
                                {colIdx > 0 && (
                                  <div className="w-px bg-[#DCCFB9]/60 self-stretch flex-shrink-0" />
                                )}
                                <ul className="list-none m-0 p-1 w-[240px]">
                                  {chunk.map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        href={item.href}
                                        scroll={true}
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                                        }}
                                        className="block px-3 py-1.5 text-[12px] text-[#1D211F] hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors whitespace-nowrap"
                                      >
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </React.Fragment>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={`text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide uppercase py-0.5 relative transition-colors ${isActive
                        ? "text-[#183D2B] font-semibold"
                        : "text-[#1D211F] hover:text-[#183D2B]"
                      }`}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  function renderScrolledNav() {
    return (
      <nav className="w-full flex items-center justify-center" aria-label="Main navigation" ref={dropdownRef}>
        <ul className="flex items-center justify-center gap-5 md:gap-4 list-none m-0 p-0 whitespace-nowrap">
          {navLinks.map((link) => {
            const hasDropdown = !!link.dropdown;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href.includes("?")
                  ? pathname === link.href.split("?")[0]
                  : pathname.startsWith(link.href);
            const isOpen = activeDropdown === link.label;
            return (
              <li
                key={link.href}
                className="relative"
                onMouseEnter={() => hasDropdown && openDropdown(link.label)}
                onMouseLeave={() => hasDropdown && closeDropdown()}
              >
                {hasDropdown ? (
                  <>
                    <button
                      type="button"
                      className={`flex items-center gap-0.5 text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide py-1 px-1 uppercase transition-colors ${isActive || isOpen
                          ? "text-[#183D2B] font-semibold"
                          : "text-[#1D211F] hover:text-[#183D2B]"
                        }`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        size={11}
                        strokeWidth={2.5}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          key={link.label}
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.18, ease: "easeOut" }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max bg-white border border-[#DCCFB9]/60 shadow-xl z-50 overflow-hidden rounded-sm"
                          onMouseEnter={() => openDropdown(link.label)}
                          onMouseLeave={() => closeDropdown()}
                        >
                          <div className="flex">
                            {chunkArray(link.dropdown ?? [], 10).map((chunk, colIdx) => (
                              <React.Fragment key={colIdx}>
                                {colIdx > 0 && (
                                  <div className="w-px bg-[#DCCFB9]/60 self-stretch flex-shrink-0" />
                                )}
                                <ul className="list-none m-0 p-1 w-[240px]">
                                  {chunk.map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        href={item.href}
                                        scroll={true}
                                        onClick={() => {
                                          setActiveDropdown(null);
                                          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                                        }}
                                        className="block px-3 py-1.5 text-[12px] text-[#1D211F] hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors whitespace-nowrap"
                                      >
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </React.Fragment>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={link.href}
                    className={`text-[11px] sm:text-[11.5px] lg:text-[12px] font-medium tracking-wide uppercase py-1 px-1 relative transition-colors ${isActive
                        ? "text-[#183D2B] font-semibold"
                        : "text-[#1D211F] hover:text-[#183D2B]"
                      }`}
                  >
                    {link.label}
                  </Link>
                )}
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
        <AnnouncementBar />

        {/* ─── Main Header ───────────────────────────────────────────── */}
        <header className={`bg-white border-b border-[#DCCFB9]/40 ${isScrolled ? "shadow-md" : "shadow-xs"}`} role="banner">
          <div className="max-w-7xl mx-auto px-4">
            <div className={`flex items-center gap-5 lg:gap-7 ${isScrolled ? "py-3" : "py-2.5"}`}>
              {/* Logo — Stable container width avoids horizontal layout shift */}
              <Link
                href="/"
                className="flex items-center shrink-0 w-[150px] sm:w-[180px] md:w-[210px] hover:scale-[1.02] transition-transform"
                aria-label="Aurelle Home"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
                      <div ref={searchContainerRef} className="w-full max-w-[480px] relative">
                        <form
                          className="w-full h-10 relative flex items-center"
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
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1.5 flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer"
                            aria-label="Submit search"
                          >
                            <Search size={18} strokeWidth={2} />
                          </button>
                        </form>

                        {/* Desktop Search Suggestions */}
                        {searchQuery.trim().length >= 2 && !mobileSearchOpen && (
                          <div className="absolute left-0 right-0 top-full z-50 bg-white border border-[#DCCFB9]/60 rounded-md shadow-2xl overflow-hidden mt-1.5 max-h-[380px] overflow-y-auto">
                            {isSearching ? (
                              <div className="p-3 text-center text-xs text-[#8C938F] animate-pulse">
                                Searching products...
                              </div>
                            ) : searchSuggestions.length > 0 ? (
                              <div className="divide-y divide-[#EDE9DF]">
                                {searchSuggestions.map((item) => {
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  const img = item.product_images?.find((i: any) => i.is_primary) || item.product_images?.[0];
                                  const imgUrl = img?.secure_url || (img?.cloudinary_public_id ? getProductImageUrl(img.cloudinary_public_id, "thumbnail") : null);
                                  return (
                                    <Link
                                      key={item.id}
                                      href={`/products/${item.slug}`}
                                      onClick={() => handleSelectSuggestion(item.slug)}
                                      className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                                    >
                                      <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] shrink-0 overflow-hidden relative border border-[#EDE9DF] flex items-center justify-center">
                                        {imgUrl ? (
                                          <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <ShoppingBag size={16} className="text-[#8C938F]" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        {item.brand?.name && (
                                          <p className="text-[10px] uppercase font-bold text-[#8C938F] tracking-wider truncate">
                                            {item.brand.name}
                                          </p>
                                        )}
                                        <p className="text-xs font-semibold text-[#1D211F] truncate">{item.name}</p>
                                        <p className="text-xs font-bold text-[#183D2B] mt-0.5">{formatPrice(item.retail_price)}</p>
                                      </div>
                                    </Link>
                                  );
                                })}
                                <Link
                                  href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                                  onClick={() => {
                                    setSearchSuggestions([]);
                                    setSearchQuery("");
                                    setSearchOpen(false);
                                    setMobileSearchOpen(false);
                                  }}
                                  className="w-full py-2.5 px-3 text-center text-xs font-bold text-[#183D2B] bg-[#F7F5EF] hover:bg-[#EDE9DF] transition-colors block cursor-pointer"
                                >
                                  View all results for &ldquo;{searchQuery}&rdquo; →
                                </Link>
                              </div>
                            ) : (
                              <div className="p-4 text-center">
                                <p className="text-xs text-[#5C6460]">No products found</p>
                                <button
                                  type="button"
                                  onClick={handleSearchSubmit}
                                  className="mt-1.5 text-xs font-semibold text-[#183D2B] underline cursor-pointer"
                                >
                                  Search full catalog for &ldquo;{searchQuery}&rdquo;
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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

                    <div
                      onMouseEnter={openAccount}
                      onMouseLeave={closeAccount}
                      className="relative flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                      aria-label={isAuthenticated ? "My account" : "Sign in"}
                    >
                      <User size={19} strokeWidth={1.6} />
                      <span className="text-[11px] font-semibold tracking-tight">Account</span>
                      {accountOpen && (
                        <span
                          onMouseEnter={openAccount}
                          onMouseLeave={closeAccount}
                          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-sm bg-white p-2 text-left shadow-2xl border border-[#EDE9DF]/80"
                        >
                          {isAuthenticated ? (
                            <>
                              <div className="px-3 py-2 border-b border-[#EDE9DF]/60 mb-1">
                                <p className="text-[10px] uppercase font-bold text-[#8C938F] tracking-wider">Signed In As</p>
                                <p className="text-xs font-semibold text-[#183D2B] truncate">
                                  {currentProfile?.full_name || currentUser?.email?.split("@")[0] || "My Account"}
                                </p>
                              </div>
                              <Link href="/account" onClick={() => setAccountOpen(false)} className="block px-3 py-2 text-xs font-medium text-[#1D211F] hover:bg-[#F7F5EF] rounded-md transition-colors">My Profile</Link>
                              <Link href="/account?tab=orders" onClick={() => setAccountOpen(false)} className="block px-3 py-2 text-xs font-medium text-[#1D211F] hover:bg-[#F7F5EF] rounded-md transition-colors">Recent Orders</Link>
                              <Link href="/account?tab=addresses" onClick={() => setAccountOpen(false)} className="block px-3 py-2 text-xs font-medium text-[#1D211F] hover:bg-[#F7F5EF] rounded-md transition-colors">Saved Addresses</Link>
                              <button
                                type="button"
                                onClick={async () => {
                                  setAccountOpen(false);
                                  const supabase = createClient();
                                  await supabase.auth.signOut();
                                  window.location.assign("/");
                                }}
                                className="block w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border-t border-[#EDE9DF]/40 mt-1 cursor-pointer"
                              >
                                Sign Out
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthModalMode("login");
                                  setAuthModalOpen(true);
                                  setAccountOpen(false);
                                }}
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#183D2B] hover:bg-[#F7F5EF] rounded-md transition-colors cursor-pointer"
                              >
                                Log In
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setAuthModalMode("signup");
                                  setAuthModalOpen(true);
                                  setAccountOpen(false);
                                }}
                                className="block w-full px-3 py-2 text-left text-xs font-medium text-[#5C6460] hover:bg-[#F7F5EF] hover:text-[#183D2B] rounded-md transition-colors cursor-pointer"
                              >
                                Sign Up
                              </button>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Wishlist button → drawer */}
                    <button
                      type="button"
                      onClick={() => setWishlistDrawerOpen(true)}
                      className="flex flex-col items-center gap-0.5 text-[#1D211F] hover:text-[#183D2B] transition-colors p-1"
                      aria-label={`Wishlist${wishlistCount2 > 0 ? `, ${wishlistCount2} items` : ""}`}
                    >
                      <div className="relative flex items-center justify-center">
                        <Heart size={19} strokeWidth={1.6} />
                        {wishlistCount2 > 0 && (
                          <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[9.5px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white leading-none">
                            {wishlistCount2 > 99 ? "99+" : wishlistCount2}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight">Wishlist</span>
                    </button>

                    {/* Cart button → drawer */}
                    <button
                      type="button"
                      onClick={() => setCartDrawerOpen(true)}
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
                    </button>
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
                {/* Mobile Cart → drawer */}
                <button
                  type="button"
                  className="flex items-center p-1 text-[#1D211F] hover:text-[#183D2B]"
                  onClick={() => setCartDrawerOpen(true)}
                  aria-label="Cart"
                >
                  <div className="relative">
                    <ShoppingBag size={20} strokeWidth={1.6} />
                    <span className="absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 bg-[#183D2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-[1.5px] border-white">
                      {liveCartCount > 99 ? "99+" : liveCartCount}
                    </span>
                  </div>
                </button>
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
              <div ref={mobileSearchContainerRef} className="md:hidden relative pb-3">
                <form
                  onSubmit={handleSearchSubmit}
                  role="search"
                >
                  <div className="relative flex items-center">
                    <input
                      ref={mobileSearchInputRef}
                      type="text"
                      className="w-full h-10 pl-3.5 pr-10 bg-white border border-[#D8CDBB] rounded-sm text-sm text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:border-[#183D2B] transition-colors"
                      placeholder="Search products, brands..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1 cursor-pointer"
                      aria-label="Search"
                    >
                      <Search size={18} strokeWidth={2} />
                    </button>
                  </div>
                </form>

                {/* Instant Suggestions Dropdown on Mobile */}
                {searchQuery.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-50 bg-white border border-[#DCCFB9]/60 rounded-md shadow-2xl overflow-hidden mt-1 max-h-[360px] overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-center text-xs text-[#8C938F] animate-pulse">
                        Searching products...
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      <div className="divide-y divide-[#EDE9DF]">
                        {searchSuggestions.map((item) => {
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          const img = item.product_images?.find((i: any) => i.is_primary) || item.product_images?.[0];
                          const imgUrl = img?.secure_url || (img?.cloudinary_public_id ? getProductImageUrl(img.cloudinary_public_id, "thumbnail") : null);
                          return (
                            <Link
                              key={item.id}
                              href={`/products/${item.slug}`}
                              onClick={() => handleSelectSuggestion(item.slug)}
                              className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                            >
                              <div className="w-11 h-11 rounded-sm bg-[#FAF8F5] shrink-0 overflow-hidden relative border border-[#EDE9DF] flex items-center justify-center">
                                {imgUrl ? (
                                  <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ShoppingBag size={16} className="text-[#8C938F]" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                {item.brand?.name && (
                                  <p className="text-[10px] uppercase font-bold text-[#8C938F] tracking-wider truncate">
                                    {item.brand.name}
                                  </p>
                                )}
                                <p className="text-xs font-semibold text-[#1D211F] truncate">{item.name}</p>
                                <p className="text-xs font-bold text-[#183D2B] mt-0.5">{formatPrice(item.retail_price)}</p>
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                          onClick={() => {
                            setSearchSuggestions([]);
                            setSearchQuery("");
                            setSearchOpen(false);
                            setMobileSearchOpen(false);
                          }}
                          className="w-full py-2.5 px-3 text-center text-xs font-bold text-[#183D2B] bg-[#F7F5EF] hover:bg-[#EDE9DF] transition-colors block cursor-pointer"
                        >
                          View all results for &ldquo;{searchQuery}&rdquo; →
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-[#5C6460]">No products found</p>
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="mt-1.5 text-xs font-semibold text-[#183D2B] underline cursor-pointer"
                        >
                          Search full catalog for &ldquo;{searchQuery}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Search Dropdown (when scrolled and user clicks search icon) */}
            {isScrolled && searchOpen && (
              <div className="hidden md:block border-t border-[#DCCFB9]/40 py-2.5">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                  <div ref={scrolledSearchContainerRef} className="flex-1 relative">
                    <form
                      className="w-full relative flex items-center"
                      onSubmit={handleSearchSubmit}
                      role="search"
                    >
                      <input
                        ref={scrolledSearchInputRef}
                        type="text"
                        className="w-full h-10 pl-4 pr-11 bg-transparent border border-[#D8CDBB] rounded-sm text-[13.5px] text-[#1D211F] outline-none placeholder:text-[#8C938F] focus:border-[#183D2B] focus:ring-2 focus:ring-[#183D2B]/10 transition-colors"
                        placeholder="Search for products, brands or categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search for products, brands or categories"
                      />
                      <button
                        type="submit"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#183D2B] p-1.5 flex items-center justify-center hover:opacity-75 transition-opacity cursor-pointer"
                        aria-label="Submit search"
                      >
                        <Search size={18} strokeWidth={2} />
                      </button>
                    </form>

                    {/* Scrolled Search Suggestions */}
                    {searchQuery.trim().length >= 2 && searchOpen && (
                      <div className="absolute left-0 right-0 top-full z-50 bg-white border border-[#DCCFB9]/60 rounded-md shadow-2xl overflow-hidden mt-1.5 max-h-[380px] overflow-y-auto">
                        {isSearching ? (
                          <div className="p-3 text-center text-xs text-[#8C938F] animate-pulse">
                            Searching products...
                          </div>
                        ) : searchSuggestions.length > 0 ? (
                          <div className="divide-y divide-[#EDE9DF]">
                            {searchSuggestions.map((item) => {
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              const img = item.product_images?.find((i: any) => i.is_primary) || item.product_images?.[0];
                              const imgUrl = img?.secure_url || (img?.cloudinary_public_id ? getProductImageUrl(img.cloudinary_public_id, "thumbnail") : null);
                              return (
                                <Link
                                  key={item.id}
                                  href={`/products/${item.slug}`}
                                  onClick={() => handleSelectSuggestion(item.slug)}
                                  className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-[#F7F5EF] transition-colors cursor-pointer"
                                >
                                  <div className="w-10 h-10 rounded-sm bg-[#FAF8F5] shrink-0 overflow-hidden relative border border-[#EDE9DF] flex items-center justify-center">
                                    {imgUrl ? (
                                      <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <ShoppingBag size={16} className="text-[#8C938F]" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {item.brand?.name && (
                                      <p className="text-[10px] uppercase font-bold text-[#8C938F] tracking-wider truncate">
                                        {item.brand.name}
                                      </p>
                                    )}
                                    <p className="text-xs font-semibold text-[#1D211F] truncate">{item.name}</p>
                                    <p className="text-xs font-bold text-[#183D2B] mt-0.5">{formatPrice(item.retail_price)}</p>
                                  </div>
                                </Link>
                              );
                            })}
                            <Link
                              href={`/shop?search=${encodeURIComponent(searchQuery)}`}
                              onClick={() => {
                                setSearchSuggestions([]);
                                setSearchQuery("");
                                setSearchOpen(false);
                                setMobileSearchOpen(false);
                              }}
                              className="w-full py-2.5 px-3 text-center text-xs font-bold text-[#183D2B] bg-[#F7F5EF] hover:bg-[#EDE9DF] transition-colors block cursor-pointer"
                            >
                              View all results for &ldquo;{searchQuery}&rdquo; →
                            </Link>
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-[#5C6460]">No products found</p>
                            <button
                              type="button"
                              onClick={handleSearchSubmit}
                              className="mt-1.5 text-xs font-semibold text-[#183D2B] underline cursor-pointer"
                            >
                              Search full catalog for &ldquo;{searchQuery}&rdquo;
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/45 z-50 backdrop-blur-[2px]"
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileDropdownOpen(null);
              }}
              aria-hidden="true"
            />

            {/* Slide-in Drawer from Right Side */}
            <motion.div
              key="mobile-drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 bottom-0 w-[min(340px,88vw)] bg-white z-50 flex flex-col shadow-2xl overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE9DF] shrink-0">
                <Link
                  href="/"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileDropdownOpen(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center"
                  aria-label="Aurelle Home"
                >
                  <Image
                    src="/logo.png"
                    alt="Aurelle Cosmetics Trading FZ-LLC"
                    width={150}
                    height={70}
                    className="h-10 w-auto object-contain"
                  />
                </Link>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#1D211F] hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors cursor-pointer"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setMobileDropdownOpen(null);
                  }}
                  aria-label="Close menu"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-[#EDE9DF]/50" aria-label="Mobile navigation">
                {/* Main Navigation Links */}
                <div className="pb-3">
                  <ul className="flex flex-col gap-1 list-none p-0 m-0">
                    {navLinks.map((link) => {
                      const hasDropdown = Boolean(link.dropdown && link.dropdown.length > 0);
                      const isDropdownOpen = mobileDropdownOpen === link.label;

                      if (hasDropdown) {
                        return (
                          <li key={`${link.href}-${link.label}`} className="flex flex-col">
                            <button
                              type="button"
                              onClick={() =>
                                setMobileDropdownOpen((prev) =>
                                  prev === link.label ? null : link.label
                                )
                              }
                              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[15px] font-medium rounded-lg transition-colors cursor-pointer ${
                                isDropdownOpen
                                  ? "bg-[#FAF8F5] text-[#183D2B] font-semibold"
                                  : "text-[#1D211F] hover:bg-[#F7F5EF] hover:text-[#183D2B]"
                              }`}
                            >
                              <span>{link.label}</span>
                              <ChevronDown
                                size={18}
                                className={`transition-transform duration-200 ${
                                  isDropdownOpen
                                    ? "rotate-180 text-[#183D2B]"
                                    : "text-[#8C938F]"
                                }`}
                              />
                            </button>

                            {/* Dropdown Menu with motion */}
                            <AnimatePresence initial={false}>
                              {isDropdownOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.22, ease: "easeInOut" }}
                                  className="overflow-hidden"
                                >
                                  <ul className="pl-3 pr-1 py-1.5 space-y-0.5 border-l-2 border-[#183D2B]/20 ml-4 my-1 list-none">
                                    {link.dropdown!.map((sub) => (
                                      <li key={sub.href}>
                                        <Link
                                          href={sub.href}
                                          onClick={() => {
                                            setMobileMenuOpen(false);
                                            setMobileDropdownOpen(null);
                                          }}
                                          className="block px-3 py-2 text-[13px] font-medium text-[#5C6460] hover:text-[#183D2B] hover:bg-[#FAF8F5] rounded-md transition-colors"
                                        >
                                          {sub.label}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </li>
                        );
                      }

                      return (
                        <li key={`${link.href}-${link.label}`}>
                          <Link
                            href={link.href}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setMobileDropdownOpen(null);
                            }}
                            className="block px-3.5 py-2.5 text-[15px] font-medium text-[#1D211F] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Explore Links */}
                <div className="pt-3">
                  <p className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-[#8C938F] mb-1.5">
                    Explore
                  </p>
                  <ul className="flex flex-col gap-0.5 list-none p-0 m-0">
                    <li>
                      <Link
                        href="/about"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileDropdownOpen(null);
                        }}
                        className="block px-3.5 py-2 text-[13px] font-medium text-[#5C6460] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                      >
                        About Aurelle
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileDropdownOpen(null);
                        }}
                        className="block px-3.5 py-2 text-[13px] font-medium text-[#5C6460] rounded-lg hover:bg-[#F7F5EF] hover:text-[#183D2B] transition-colors"
                      >
                        Contact Us
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>

              {/* Account & Sign Out footer (ALWAYS PINNED AND VISIBLE) */}
              <div className="p-4 border-t border-[#EDE9DF] bg-[#FAF8F5]/80 space-y-2 shrink-0">
                {isAuthenticated ? (
                  <>
                    {currentProfile?.full_name && (
                      <p className="text-xs text-[#8C938F] px-1 truncate">
                        Signed in as <strong className="text-[#14231B]">{currentProfile.full_name}</strong>
                      </p>
                    )}
                    <Link
                      href="/account"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileDropdownOpen(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#183D2B] text-white font-semibold text-xs hover:bg-[#102D20] transition-colors shadow-2xs"
                    >
                      <User size={16} strokeWidth={1.8} aria-hidden="true" />
                      My Account
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        setMobileDropdownOpen(null);
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.assign("/");
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-red-200 text-red-600 bg-red-50/60 hover:bg-red-100/70 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut size={15} strokeWidth={1.8} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalMode("login");
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                      setMobileDropdownOpen(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#183D2B] text-white font-semibold text-sm hover:bg-[#102D20] transition-colors shadow-2xs cursor-pointer"
                  >
                    <User size={18} strokeWidth={1.75} aria-hidden="true" />
                    Sign In / Register
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AccountAuthModal open={authModalOpen} initialMode={authModalMode} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <WishlistDrawer
        open={wishlistDrawerOpen}
        onClose={() => setWishlistDrawerOpen(false)}
      />
    </>
  );
}
