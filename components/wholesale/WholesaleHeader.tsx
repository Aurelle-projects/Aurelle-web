"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Package,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useWholesaleCart } from "@/context/WholesaleCartContext";

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

export interface WholesaleNavItem {
  key: string;
  label: string;
  href: string;
  isDropdown?: boolean;
  dropdownType?: "categories" | "brands";
}

export const WHOLESALE_NAV_ITEMS: WholesaleNavItem[] = [
  { key: "home", label: "Home", href: "/wholesale" },
  { key: "collections", label: "Collections", href: "/wholesale/shop" },
  {
    key: "categories",
    label: "Categories",
    href: "/wholesale/shop",
    isDropdown: true,
    dropdownType: "categories",
  },
  {
    key: "brands",
    label: "Brands",
    href: "/wholesale/shop",
    isDropdown: true,
    dropdownType: "brands",
  },

  { key: "about", label: "About", href: "/wholesale/about" },
  { key: "contact", label: "Contact", href: "/wholesale/contact" },
];

interface WholesaleHeaderProps {
  navBrands?: WholesaleNavBrand[];
  navCategories?: WholesaleNavCategory[];
}

export default function WholesaleHeader({
  navBrands = [],
  navCategories = [],
}: WholesaleHeaderProps) {
  const wholesaleCart = useWholesaleCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accountDropdownRef = useRef<HTMLDivElement | null>(null);

  // Auth State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<{
    full_name?: string;
    company_name?: string;
    role?: string;
    email?: string;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadUserProfile(user: any) {
      if (!user) {
        setCurrentProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        // Query valid profiles table columns (id, email, full_name, role)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData } = await (supabase as any)
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", user.id)
          .maybeSingle();

        let companyName: string | undefined = undefined;
        if (profileData?.role === "wholesale_customer") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: appData } = await (supabase as any)
            .from("wholesale_applications")
            .select("company_name")
            .eq("user_id", user.id)
            .maybeSingle();
          if (appData?.company_name) {
            companyName = appData.company_name;
          }
        }

        if (profileData) {
          setCurrentProfile({
            full_name: profileData.full_name,
            role: profileData.role,
            email: profileData.email,
            company_name: companyName,
          });
        } else {
          setCurrentProfile(null);
        }
      } catch (err) {
        console.error("WholesaleHeader profile load error:", err);
      } finally {
        setAuthLoading(false);
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      loadUserProfile(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      loadUserProfile(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCurrentProfile(null);
    setAccountMenuOpen(false);
    window.location.assign("/wholesale");
  };

  // Lock scroll when mobile menu is open
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

            {/* Desktop Navigation Links mapped from WHOLESALE_NAV_ITEMS */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[13px] font-medium text-[#14231B]">
              {WHOLESALE_NAV_ITEMS.map((item) => {
                if (!item.isDropdown) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="hover:text-[#183D2B] transition-colors py-2 whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  );
                }

                const isCategories = item.dropdownType === "categories";
                const dropdownList = isCategories ? navCategories : navBrands;
                const paramName = isCategories ? "category" : "brand";

                return (
                  <div
                    key={item.key}
                    className="relative py-2"
                    onMouseEnter={() => handleMouseEnter(item.key)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-1 hover:text-[#183D2B] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          activeDropdown === item.key ? "rotate-180 text-[#183D2B]" : ""
                        }`}
                      />
                    </Link>

                    {activeDropdown === item.key && (
                      <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-sm py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 border border-[#EFEAE0]">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-[#8E9590] uppercase tracking-wider">
                          Wholesale {item.label}
                        </div>
                        {dropdownList.length > 0 ? (
                          dropdownList.map((subItem) => (
                            <Link
                              key={subItem.id}
                              href={`/wholesale/shop?${paramName}=${subItem.id}`}
                              onClick={() => setActiveDropdown(null)}
                              className="block px-3 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                            >
                              {subItem.name}
                            </Link>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-xs text-[#8E9590]">
                            All {item.label.toLowerCase()} available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions: B2B Register, Login, Enquiry Buttons / Authenticated Wholesale State */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Wholesale Cart Icon */}
              <Link
                href="/wholesale/cart"
                className="relative p-2 text-[#14231B] hover:text-[#183D2B] transition-colors"
                title="Wholesale Cart"
              >
                <ShoppingBag size={20} />
                {wholesaleCart.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#183D2B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wholesaleCart.itemCount}
                  </span>
                )}
              </Link>

              {authLoading ? (
                <div className="hidden sm:block w-28 h-8 bg-neutral-100 rounded-sm animate-pulse" />
              ) : currentUser && currentProfile?.role === "wholesale_customer" ? (
                <div className="relative" ref={accountDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#183D2B]/10 hover:bg-[#183D2B]/15 text-[#183D2B] text-xs font-semibold border border-[#183D2B]/20 cursor-pointer transition-colors"
                  >
                    <User size={14} className="shrink-0 text-[#183D2B]" />
                    <span className="max-w-[130px] md:max-w-[170px] truncate">
                      {currentProfile.full_name || currentProfile.company_name || "Wholesale Partner"}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider bg-[#183D2B] text-white px-1.5 py-0.5 rounded-xs font-bold shrink-0">
                      B2B
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 text-[#183D2B] ${
                        accountMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-sm shadow-xl border border-[#EFEAE0] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-4 py-2.5 border-b border-[#EFEAE0] bg-[#FAF8F5]">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E9590]">
                          Wholesale Account
                        </p>
                        <p className="text-xs font-bold text-[#14231B] truncate mt-0.5">
                          {currentProfile.full_name || "Wholesale Partner"}
                        </p>
                        {currentProfile.company_name && (
                          <p className="text-xs text-[#183D2B] font-semibold truncate">
                            {currentProfile.company_name}
                          </p>
                        )}
                      </div>

                      <div className="py-1">
                        <Link
                          href="/wholesale/account"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                        >
                          <Settings size={14} />
                          <span>Account Settings</span>
                        </Link>
                        <Link
                          href="/wholesale/account?section=orders"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                        >
                          <Package size={14} />
                          <span>Orders</span>
                        </Link>
                        <Link
                          href="/wholesale/account?section=addresses"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#14231B] hover:bg-[#FAF8F5] hover:text-[#183D2B] transition-colors"
                        >
                          <MapPin size={14} />
                          <span>Saved Addresses</span>
                        </Link>
                      </div>

                      <div className="border-t border-[#EFEAE0] pt-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            handleSignOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors text-left cursor-pointer font-medium"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/wholesale"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#14231B] hover:text-[#183D2B] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/wholesale/register"
                    className="px-3.5 sm:px-4 py-2 rounded-sm border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B]/5 text-xs font-bold uppercase tracking-wider transition-all text-center whitespace-nowrap"
                  >
                    Register B2B
                  </Link>
                </>
              )}
              <Link
                href="/wholesale/contact"
                className="px-4 sm:px-5 py-2 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs sm:text-xs font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md text-center whitespace-nowrap"
              >
                Enquiry
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation with Motion */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl z-10 flex flex-col p-6 border-r border-[#EFEAE0]"
            >
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
                  className="p-1.5 text-[#5C6460] hover:text-[#14231B] cursor-pointer rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Navigation Links mapped from WHOLESALE_NAV_ITEMS */}
              <nav className="flex-1 overflow-y-auto py-6 space-y-4 text-sm font-semibold text-[#14231B]">
                {WHOLESALE_NAV_ITEMS.map((item) => {
                  if (!item.isDropdown) {
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block hover:text-[#183D2B] py-1 transition-colors"
                      >
                        {item.label}
                      </Link>
                    );
                  }

                  const isOpen = openMobileDropdown === item.key;
                  const isCategories = item.dropdownType === "categories";
                  const dropdownList = isCategories ? navCategories : navBrands;
                  const paramName = isCategories ? "category" : "brand";

                  return (
                    <div key={item.key}>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMobileDropdown((prev) => (prev === item.key ? null : item.key))
                        }
                        className="w-full flex items-center justify-between hover:text-[#183D2B] py-1 text-left cursor-pointer transition-colors"
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 text-[#5C6460] ${
                            isOpen ? "rotate-180 text-[#183D2B]" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-3 pr-1 pt-1 pb-2 space-y-1 border-l-2 border-[#183D2B]/20 ml-1.5 mt-1.5"
                          >
                            {dropdownList.map((subItem) => (
                              <Link
                                key={subItem.id}
                                href={`/wholesale/shop?${paramName}=${subItem.id}`}
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setOpenMobileDropdown(null);
                                }}
                                className="block text-xs font-normal text-[#5C6460] hover:text-[#183D2B] py-1 transition-colors"
                              >
                                {subItem.name}
                              </Link>
                            ))}
                            <Link
                              href={`/wholesale/shop?filter=${item.key}`}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setOpenMobileDropdown(null);
                              }}
                              className="block text-xs font-semibold text-[#183D2B] hover:underline pt-1"
                            >
                              All {item.label} &rarr;
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              {authLoading ? (
                <div className="pt-4 border-t border-[#EFEAE0]">
                  <div className="w-full h-10 bg-neutral-100 rounded-sm animate-pulse" />
                </div>
              ) : currentUser && currentProfile?.role === "wholesale_customer" ? (
                <div className="pt-4 border-t border-[#EFEAE0] space-y-2.5">
                  <div className="p-3 rounded-sm bg-[#183D2B]/10 text-[#183D2B] border border-[#183D2B]/20">
                    <div className="flex items-center gap-2">
                      <User size={16} className="shrink-0 text-[#183D2B]" />
                      <span className="text-xs font-bold truncate">
                        {currentProfile.full_name || "Wholesale Partner"}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider bg-[#183D2B] text-white px-1.5 py-0.5 rounded-xs font-bold ml-auto shrink-0">
                        B2B
                      </span>
                    </div>
                    {currentProfile.company_name && (
                      <p className="text-xs font-semibold text-[#183D2B] mt-1 pl-6">
                        {currentProfile.company_name}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/wholesale/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 px-3 rounded-sm border border-[#EFEAE0] hover:border-[#183D2B] text-xs font-semibold text-[#14231B] hover:text-[#183D2B] flex items-center gap-2 transition-colors"
                  >
                    <Settings size={14} />
                    <span>Account Settings</span>
                  </Link>
                  <Link
                    href="/wholesale/account?section=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 px-3 rounded-sm border border-[#EFEAE0] hover:border-[#183D2B] text-xs font-semibold text-[#14231B] hover:text-[#183D2B] flex items-center gap-2 transition-colors"
                  >
                    <Package size={14} />
                    <span>Orders</span>
                  </Link>
                  <Link
                    href="/wholesale/account?section=addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 px-3 rounded-sm border border-[#EFEAE0] hover:border-[#183D2B] text-xs font-semibold text-[#14231B] hover:text-[#183D2B] flex items-center gap-2 transition-colors"
                  >
                    <MapPin size={14} />
                    <span>Saved Addresses</span>
                  </Link>

                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await handleSignOut();
                    }}
                    className="w-full py-2 text-xs font-semibold text-red-600 hover:text-red-700 text-center block cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-[#EFEAE0] space-y-2">
                  <Link
                    href="/wholesale/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-sm border border-[#183D2B] text-[#183D2B] hover:bg-[#183D2B]/5 text-xs font-bold uppercase tracking-wider text-center block transition-colors"
                  >
                    Register B2B Account
                  </Link>
                  <Link
                    href="/wholesale/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider text-center block shadow-xs transition-colors"
                  >
                    Enquiry
                  </Link>
                  <Link
                    href="/login?redirect=/wholesale"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2 text-xs font-semibold text-[#5C6460] hover:text-[#183D2B] text-center block"
                  >
                    Already a wholesale customer? Sign In
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
