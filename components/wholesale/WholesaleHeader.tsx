"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimerRef = useRef<NodeJS.Timeout | null>(null);

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

            {/* Actions: Enquiry Button */}
            <div className="flex items-center">
              <Link
                href="/wholesale/contact"
                className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-xs hover:shadow-md text-center"
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

              <div className="pt-4 border-t border-[#EFEAE0]">
                <Link
                  href="/wholesale/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-sm bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-bold uppercase tracking-wider text-center block shadow-xs transition-colors"
                >
                  Enquiry
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
