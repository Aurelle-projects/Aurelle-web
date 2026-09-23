"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Sliders,
  Package,
  ShoppingBag,
  Briefcase,
  Settings,
  ExternalLink,
  ChevronRight,
  Tag,
  MessageSquare,
  LogOut,
  RotateCw,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
  smallFont?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "SALES & ORDERS",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/wholesale", label: "B2B Wholesale", icon: Briefcase },
    ],
  },
  {
    title: "CATALOG & STORE",
    items: [
      { href: "/admin/products", label: "Products Catalog", icon: Package, smallFont: true },
      { href: "/admin/categories", label: "Category & Subcategory", icon: Layers, smallFont: true },
      { href: "/admin/brands", label: "Brands", icon: Tag, smallFont: true },
      { href: "/admin/hero", label: "Home Management", icon: Sliders, smallFont: true },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquare, smallFont: true },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { href: "/admin/settings", label: "Store Settings", icon: Settings, smallFont: true },
    ],
  },
];

import { useAdminData } from "@/context/AdminDataContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const { pendingOrdersCount, loadOrders } = useAdminData();

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin";
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.href = "/admin";
    }
  }

  return (
    <aside
      className="fixed top-0 bottom-0 left-0 w-64 bg-[#102D20] text-white flex flex-col z-50 border-r border-white/10 shadow-2xl"
      aria-label="Admin Navigation"
    >
      {/* Brand Header — exact h-16 to match AdminHeader */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-center shrink-0">
        <Link href="/admin" className="flex items-center justify-center group">
          <Image
            src="/logo.png"
            alt="Aurelle Logo"
            width={120}
            height={44}
            className="h-10 w-auto object-contain filter brightness-110 drop-shadow-sm group-hover:scale-105 transition-transform"
            priority
          />
        </Link>
      </div>

      {/* Navigation List - Y-axis scrollbar hidden via CSS */}
      <nav className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 px-2.5 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-2.5 pb-1 text-[9.5px] font-bold tracking-wider text-white/45 uppercase">
              {group.title}
            </p>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : item.href === "/admin/categories"
                    ? pathname.startsWith("/admin/categories") || pathname.startsWith("/admin/subcategories")
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isActive
                          ? "bg-[#183D2B] text-white font-semibold border-l-3 border-[#C9A84C] shadow-inner"
                          : "text-white/75 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          size={15}
                          strokeWidth={isActive ? 2.2 : 1.75}
                          className={isActive ? "text-[#C9A84C]" : "text-white/65"}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* New order indication specifically and only for the Orders tab */}
                        {item.href === "/admin/orders" && pendingOrdersCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#C9A84C] text-[#102D20] rounded-full leading-none shadow-xs"
                            title={`${pendingOrdersCount} new order${pendingOrdersCount > 1 ? "s" : ""}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
                            <span>{pendingOrdersCount} New</span>
                          </span>
                        )}
                        {item.badge && item.href !== "/admin/orders" && (
                          <span className="px-1.5 py-0.5 text-[9.5px] font-bold bg-[#C9A84C] text-[#102D20] rounded-full leading-none">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <ChevronRight size={12} className="text-[#C9A84C]" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Storefront Link & Logout */}
      <div className="p-3 border-t border-white/10 bg-[#0C2218] mt-auto flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white/90 bg-white/10 hover:bg-[#183D2B] rounded-md border border-white/10 hover:border-[#C9A84C]/40 transition-all shadow-xs"
        >
          <ExternalLink size={12} className="text-[#C9A84C]" />
          <span>View Live Storefront</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-red-300 hover:text-white bg-red-500/10 hover:bg-red-600/30 rounded-md border border-red-500/20 transition-all cursor-pointer disabled:opacity-60"
        >
          {loggingOut ? (
            <RotateCw size={12} className="animate-spin" />
          ) : (
            <LogOut size={12} />
          )}
          <span>{loggingOut ? "Signing Out..." : "Logout Admin"}</span>
        </button>
      </div>
    </aside>
  );
}
