"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  Package,
  ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/utils/price";

const AccountAuthModal = dynamic(() => import("@/components/auth/AccountAuthModal"), {
  ssr: false,
});

export interface WholesaleNavBrand {
  id: string;
  name: string;
  slug: string;
}

export interface WholesaleNavCategory {
  id: string;
  name: string;
  slug: string;
}

interface WholesaleHeaderProps {
  navBrands?: WholesaleNavBrand[];
  navCategories?: WholesaleNavCategory[];
}

export default function WholesaleHeader({
  navBrands = [],
  navCategories = [],
}: WholesaleHeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileBrandOpen, setMobileBrandOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync auth status
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient() as any;
        const { data } = await supabase.auth.getUser();
        setCurrentUser(data?.user ?? null);
      } catch {
        setCurrentUser(null);
      }
    }
    checkAuth();
  }, []);

  // Close search results on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live real-time search for wholesale products
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, slug, sku, retail_price, wholesale_price, wholesale_moq,
            brand:brands(name),
            category:categories(name, slug),
            product_images(cloudinary_public_id, secure_url, alt_text, is_primary)
          `)
          .eq("status", "published")
          .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
          .limit(6);

        if (!error && data) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Wholesale search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  function handleSelectProduct(slug: string) {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    router.push(`/wholesale/products/${slug}`);
  }

  const handleMouseEnter = (menu: string) => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-[#EFEAE0]/80">
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 md:h-20 flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#14231B] hover:text-[#183D2B] cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>

            {/* Brand Logo (from public/Aurelle-Logo.png, without wholesale badge) */}
            <div className="flex items-center shrink-0">
              <Link href="/wholesale" className="flex items-center">
                <Image
                  src="/Aurelle-Logo.png"
                  alt="Aurelle"
                  width={160}
                  height={48}
                  priority
                  className="h-9 sm:h-11 md:h-12 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-[13px] font-medium text-[#14231B]">
              <Link
                href="/wholesale"
                className="hover:text-[#183D2B] transition-colors py-2 whitespace-nowrap"
              >
                Home
              </Link>

              <Link
                href="/wholesale/shop"
                className="hover:text-[#183D2B] transition-colors py-2 whitespace-nowrap font-medium"
              >
                Shop All
              </Link>

              {/* Shop by Category Dropdown */}
              <div
                className="relative py-2"
                onMouseEnter={() => handleMouseEnter("categories")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/wholesale/shop"
                  className="flex items-center gap-1 hover:text-[#183D2B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Shop by Category</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "categories" ? "rotate-180 text-[#183D2B]" : ""
                    }`}
                  />
                </Link>

                {activeDropdown === "categories" && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 border border-[#EFEAE0]">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">
                      Wholesale Categories
                    </div>
                    {navCategories.length > 0 ? (
                      navCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/wholesale/shop?category=${cat.id}`}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-[#8E9590]">All categories available</p>
                    )}
                  </div>
                )}
              </div>

              {/* Shop by Brand Dropdown */}
              <div
                className="relative py-2"
                onMouseEnter={() => handleMouseEnter("brands")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/wholesale/shop"
                  className="flex items-center gap-1 hover:text-[#183D2B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Shop by Brand</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      activeDropdown === "brands" ? "rotate-180 text-[#183D2B]" : ""
                    }`}
                  />
                </Link>

                {activeDropdown === "brands" && (
                  <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 border border-[#EFEAE0]">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">
                      Wholesale Brands
                    </div>
                    {navBrands.length > 0 ? (
                      navBrands.map((brand) => (
                        <Link
                          key={brand.id}
                          href={`/wholesale/shop?brand=${brand.id}`}
                          onClick={() => setActiveDropdown(null)}
                          className="block px-3 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                        >
                          {brand.name}
                        </Link>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-[#8E9590]">All brands available</p>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/wholesale/contact"
                className="hover:text-[#183D2B] transition-colors py-2 whitespace-nowrap"
              >
                Contact Us
              </Link>

              <Link
                href="/wholesale/about"
                className="hover:text-[#183D2B] transition-colors py-2 whitespace-nowrap"
              >
                About Us
              </Link>
            </nav>

            {/* Actions: Search, Cart, Account (icon only), Enquiry Button */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search toggle (icon only) */}
              <button
                type="button"
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-[#14231B] hover:text-[#183D2B] transition-colors cursor-pointer"
                aria-label="Search wholesale products"
                title="Search"
              >
                <Search size={20} />
              </button>


              {/* Account (icon ONLY - no text) */}
              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    window.location.assign("/account");
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                className="p-2 text-[#14231B] hover:text-[#183D2B] transition-colors cursor-pointer"
                aria-label={currentUser ? "Account" : "Login"}
                title={currentUser ? "Account" : "Trade Login"}
              >
                <User size={20} />
              </button>

              {/* Enquiry Button */}
              <Link
                href="/wholesale/contact"
                className="ml-1 px-4 py-2 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Enquiry
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Search Drawer / Bar (Background removed, clean design) */}
        {searchOpen && (
          <div className="px-4 py-3 border-t border-[#EFEAE0] bg-white">
            <div ref={searchContainerRef} className="max-w-3xl mx-auto relative">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-sm border border-[#EDE9DF] bg-white focus-within:border-[#183D2B] transition-colors">
                <Search size={16} className="text-[#8E9590] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setSearchOpen(false);
                      setSearchResults([]);
                      router.push(`/wholesale/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  placeholder="Search genuine cosmetics, wholesale SKUs, brands..."
                  className="w-full text-xs text-[#14231B] placeholder-[#8E9590] bg-transparent outline-none"
                  autoFocus
                />
                {isSearching && (
                  <div className="w-3.5 h-3.5 border-2 border-[#183D2B]/30 border-t-[#183D2B] rounded-full animate-spin shrink-0" />
                )}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="text-[#8E9590] hover:text-[#14231B] cursor-pointer p-0.5"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#EDE9DF] shadow-xl rounded-sm py-1.5 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8E9590] flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#183D2B]/30 border-t-[#183D2B] rounded-full animate-spin" />
                      <span>Searching wholesale products...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-[#F7F5EF]">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">
                        Matching Wholesale Products ({searchResults.length})
                      </div>
                      {searchResults.map((prod) => {
                        const primaryImg =
                          (prod.product_images ?? []).find((img: any) => img.is_primary) ??
                          prod.product_images?.[0];
                        const imgUrl = primaryImg?.secure_url;
                        const price = prod.wholesale_price || prod.retail_price;
                        const moq = prod.wholesale_moq || 1;

                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleSelectProduct(prod.slug)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF8F5] transition-colors flex items-center gap-3 cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-xs bg-[#FAF8F5] border border-[#EDE9DF] shrink-0 overflow-hidden relative flex items-center justify-center">
                              {imgUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imgUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <Package size={18} className="text-[#8E9590]" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase text-[#183D2B] tracking-wider truncate">
                                {prod.brand?.name || "Aurelle"}
                              </p>
                              <h4 className="text-xs font-semibold text-[#14231B] group-hover:text-[#183D2B] transition-colors truncate">
                                {prod.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                {prod.sku && (
                                  <span className="text-[10px] font-mono text-[#8E9590]">
                                    SKU: {prod.sku}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-[#183D2B]">
                                  {formatPrice(price)}
                                </span>
                                <span className="text-[9.5px] px-1.5 py-0.2 bg-[#183D2B]/10 text-[#183D2B] rounded-xs font-semibold">
                                  MOQ: {moq} units
                                </span>
                              </div>
                            </div>

                            <ArrowRight
                              size={14}
                              className="text-[#8E9590] group-hover:text-[#183D2B] group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                          </button>
                        );
                      })}
                      <div className="p-2 border-t border-[#EDE9DF] bg-[#FAF8F5] text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchResults([]);
                            router.push(`/wholesale/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                          }}
                          className="text-[11px] font-bold text-[#183D2B] hover:underline cursor-pointer"
                        >
                          View all search results in wholesale shop &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#8E9590]">
                      No wholesale products found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col p-6 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEAE0]">
              <Link
                href="/wholesale"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center"
              >
                <Image
                  src="/Aurelle-Logo.png"
                  alt="Aurelle"
                  width={130}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#5C6460] hover:text-[#14231B] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 space-y-4 text-sm font-semibold text-[#14231B]">
              <Link
                href="/wholesale"
                onClick={() => setMobileMenuOpen(false)}
                className="block hover:text-[#183D2B] py-1"
              >
                Home
              </Link>
              <Link
                href="/wholesale/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block hover:text-[#183D2B] py-1"
              >
                Shop All Products
              </Link>
              {/* Shop by Category Dropdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileCategoryOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between hover:text-[#183D2B] py-1 text-left cursor-pointer"
                >
                  <span>Shop by Category</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 text-[#5C6460] ${
                      mobileCategoryOpen ? "rotate-180 text-[#183D2B]" : ""
                    }`}
                  />
                </button>
                {mobileCategoryOpen && (
                  <div className="pl-3 pr-1 pt-1 pb-2 space-y-1 border-l-2 border-[#183D2B]/20 ml-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {navCategories.map((c) => (
                      <Link
                        key={c.id}
                        href={`/wholesale/shop?category=${c.id}`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileCategoryOpen(false);
                        }}
                        className="block text-xs font-normal text-[#5C6460] hover:text-[#183D2B] py-1 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                    <Link
                      href="/wholesale/shop?filter=categories"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileCategoryOpen(false);
                      }}
                      className="block text-xs font-semibold text-[#183D2B] hover:underline pt-1"
                    >
                      All Categories &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* Shop by Brand Dropdown */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileBrandOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between hover:text-[#183D2B] py-1 text-left cursor-pointer"
                >
                  <span>Shop by Brand</span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 text-[#5C6460] ${
                      mobileBrandOpen ? "rotate-180 text-[#183D2B]" : ""
                    }`}
                  />
                </button>
                {mobileBrandOpen && (
                  <div className="pl-3 pr-1 pt-1 pb-2 space-y-1 border-l-2 border-[#183D2B]/20 ml-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {navBrands.map((b) => (
                      <Link
                        key={b.id}
                        href={`/wholesale/shop?brand=${b.id}`}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setMobileBrandOpen(false);
                        }}
                        className="block text-xs font-normal text-[#5C6460] hover:text-[#183D2B] py-1 transition-colors"
                      >
                        {b.name}
                      </Link>
                    ))}
                    <Link
                      href="/wholesale/shop?filter=brands"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setMobileBrandOpen(false);
                      }}
                      className="block text-xs font-semibold text-[#183D2B] hover:underline pt-1"
                    >
                      All Brands &rarr;
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/wholesale/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block hover:text-[#183D2B] py-1"
              >
                Contact Us
              </Link>
              <Link
                href="/wholesale/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block hover:text-[#183D2B] py-1"
              >
                About Us
              </Link>
            </nav>

            <div className="pt-4 border-t border-[#EFEAE0] space-y-2.5">
              <Link
                href="/wholesale/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-sm bg-[#183D2B] text-white text-xs font-bold uppercase tracking-wider text-center block shadow-xs"
              >
                Enquiry
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (currentUser) window.location.assign("/account");
                  else setAuthModalOpen(true);
                }}
                className="w-full py-2 rounded-sm bg-[#FAF8F5] text-[#14231B] text-xs font-semibold text-center hover:bg-[#EFEAE0] transition-colors"
              >
                {currentUser ? "My Account" : "Trade Login / Register"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal (Login / Sign Up reuse) */}
      <AccountAuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </>
  );
}
