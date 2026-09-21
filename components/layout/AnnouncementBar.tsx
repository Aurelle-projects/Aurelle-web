"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<{
    text: string;
    link: string;
    country: string;
  } | null>(null);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/admin/hero");
        const data = await res.json();
        if (data.success && data.hero?.top_announcement) {
          setAnnouncement({
            text: data.hero.top_announcement,
            link: "/shop",
            country: data.hero.currency_label || "",
          });
        } else {
          setAnnouncement(null);
        }
      } catch {
        setAnnouncement(null);
      }
    }
    loadAnnouncement();
  }, []);

  if (!announcement?.text) {
    return null;
  }

  return (
    <div
      className="bg-[#183D2B] text-white text-[11px] tracking-wide border-b border-white/10"
      role="region"
      aria-label="Announcement"
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[34px]">
        <div className="flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
          <Link
            href={announcement.link || "/shop"}
            className="text-white/90 hover:text-white hover:underline transition-colors font-medium"
          >
            <span>{announcement.text}</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {announcement.country && (
            <>
              <div className="text-white/85 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-pointer">
                <span>{announcement.country}</span>
                <ChevronDown size={13} strokeWidth={2} />
              </div>
              <span className="text-white/25 text-[10px]" aria-hidden="true">|</span>
            </>
          )}

          <Link
            href="/contact"
            className="text-white/85 hover:text-white transition-colors font-medium"
          >
            Help
          </Link>

          <span className="text-white/25 text-[10px]" aria-hidden="true">|</span>

          <Link
            href="/account/orders"
            className="text-white/85 hover:text-white transition-colors font-medium"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
