"use client";

import React from "react";
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
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories & Images", icon: Layers, badge: "10" },
  { href: "/admin/hero", label: "Home Management", icon: Sliders },
  { href: "/admin/products", label: "Products Catalog", icon: Package },
  { href: "/admin/orders", label: "Customer Orders", icon: ShoppingBag },
  { href: "/admin/wholesale", label: "B2B Wholesale", icon: Briefcase },
  { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 bottom-0 left-0 w-64 bg-[#102D20] text-white flex flex-col z-50 border-r border-white/10 shadow-2xl"
      aria-label="Admin Navigation"
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex flex-col items-center text-center">
        <Link href="/admin" className="flex flex-col items-center gap-2.5 group">
          <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 transition-all">
            <Image
              src="/logo.png"
              alt="Aurelle Logo"
              width={130}
              height={65}
              className="h-9 w-auto object-contain filter brightness-110 drop-shadow-sm"
              priority
            />
          </div>
          <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#C9A84C] bg-[#C9A84C]/15 border border-[#C9A84C]/30 rounded-full uppercase">
            ADMIN CONSOLE
          </span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-white/50 uppercase">
          MANAGEMENT
        </p>

        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${
                    isActive
                      ? "bg-[#183D2B] text-white font-semibold border-l-4 border-[#C9A84C] shadow-inner"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.75}
                      className={isActive ? "text-[#C9A84C]" : "text-white/70"}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[11px] font-bold bg-[#C9A84C] text-[#102D20] rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight size={14} className="text-[#C9A84C]" />
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Storefront Link */}
      <div className="p-4 border-t border-white/10 bg-[#0C2218] mt-auto flex flex-col gap-2.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-[#183D2B] rounded-lg border border-white/10 hover:border-[#C9A84C]/40 transition-all shadow-xs"
        >
          <ExternalLink size={14} className="text-[#C9A84C]" />
          <span>View Live Storefront</span>
        </Link>
        <p className="text-[10.5px] text-center text-white/50 leading-tight">
          Aurelle Cosmetics Trading FZ-LLC
          <br />
          UAE E-Commerce Platform
        </p>
      </div>
    </aside>
  );
}
