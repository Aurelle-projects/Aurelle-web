"use client";

import React from "react";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    href: string;
  };
}

export default function AdminHeader({
  title,
  subtitle,
  actionButton,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white border-b border-[#DCCFB9]/40 shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-[#1D211F] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#5C6460] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* View Live Store */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#183D2B] bg-[#F7F5EF] hover:bg-[#EDE8DE] border border-[#DCCFB9] rounded-lg transition-colors"
          title="Open live storefront in a new tab"
        >
          <ExternalLink size={14} />
          <span className="hidden sm:inline">View Store</span>
        </Link>

        {/* Quick action button */}
        {actionButton ? (
          <Link
            href={actionButton.href}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{actionButton.label}</span>
          </Link>
        ) : (
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#183D2B] hover:bg-[#102D20] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Product</span>
          </Link>
        )}
      </div>
    </header>
  );
}
