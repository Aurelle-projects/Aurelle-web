"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  Sparkles,
  Tag,
} from "lucide-react";

interface AnnouncementData {
  text: string;
  link: string;
  country: string;
  whatsappUrl: string;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const res = await fetch("/api/announcement");
        const data = await res.json();
        if (data.success && data.announcement?.text) {
          setAnnouncement({
            text: data.announcement.text,
            link: data.announcement.link || "/shop",
            country: data.announcement.currency_label || "UAE | AED",
            whatsappUrl:
              data.announcement.whatsapp_url ||
              "https://wa.me/971562096388?text=Hello%20Aurelle%2C%20I%20need%20assistance.",
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

  // Split multi-part announcements separated by '|' into clean distinct messages
  const messages = useMemo(() => {
    if (!announcement?.text) return [];
    return announcement.text
      .split("|")
      .map((m) => m.trim().replace(/,\s*/g, ", "))
      .filter(Boolean);
  }, [announcement?.text]);

  // Auto-cycle through messages every 4 seconds unless hovered
  useEffect(() => {
    if (messages.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length, isPaused]);

  // Reset index if messages change
  useEffect(() => {
    setCurrentIndex(0);
  }, [messages.length]);

  if (!announcement?.text || messages.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const getMessageIcon = (text?: string) => {
    if (!text) return <Sparkles size={13} className="text-[#DCCFB9] shrink-0" />;
    const lower = text.toLowerCase();
    if (
      lower.includes("shipping") ||
      lower.includes("delivery") ||
      lower.includes("aed") ||
      lower.includes("dubai") ||
      lower.includes("rak")
    ) {
      return <Truck size={13} className="text-[#DCCFB9] shrink-0" />;
    }
    if (
      lower.includes("authentic") ||
      lower.includes("guarantee") ||
      lower.includes("genuine") ||
      lower.includes("100%")
    ) {
      return <ShieldCheck size={13} className="text-[#DCCFB9] shrink-0" />;
    }
    if (
      lower.includes("skincare") ||
      lower.includes("hair") ||
      lower.includes("fragrance") ||
      lower.includes("wellness") ||
      lower.includes("beauty")
    ) {
      return <Sparkles size={13} className="text-[#DCCFB9] shrink-0" />;
    }
    if (lower.includes("sale") || lower.includes("offer") || lower.includes("off")) {
      return <Tag size={13} className="text-[#DCCFB9] shrink-0" />;
    }
    return <Sparkles size={13} className="text-[#DCCFB9] shrink-0" />;
  };

  const currentMessage: string = messages[currentIndex] || messages[0] || "";


  return (
    <div
      className="bg-[#183D2B] text-white text-[11px] tracking-wide border-b border-white/10 select-none overflow-hidden"
      role="region"
      aria-label="Announcement"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[34px] sm:h-[36px]">
        {/* ─── Animated Moving Announcement Carousel ─── */}
        <div className="flex-1 flex items-center justify-center md:justify-start min-w-0 pr-0 md:pr-4">
          <div className="flex items-center gap-1.5 sm:gap-2.5 max-w-full min-w-0">
            {/* Interactive arrows when multiple messages exist */}
            {messages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous announcement"
                className="hidden sm:inline-flex items-center justify-center text-white/50 hover:text-white p-0.5 rounded transition-colors cursor-pointer shrink-0"
              >
                <ChevronLeft size={13} />
              </button>
            )}

            {/* Moving Animated Text Container */}
            <div className="relative h-[22px] overflow-hidden flex items-center min-w-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center min-w-0"
                >
                  <Link
                    href={announcement.link || "/shop"}
                    className="text-white/90 hover:text-white transition-colors font-medium flex items-center gap-2 group truncate"
                  >
                    {getMessageIcon(currentMessage)}
                    <span className="truncate group-hover:underline underline-offset-2">
                      {currentMessage}
                    </span>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Interactive arrows and progress indicator */}
            {messages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next announcement"
                  className="hidden sm:inline-flex items-center justify-center text-white/50 hover:text-white p-0.5 rounded transition-colors cursor-pointer shrink-0"
                >
                  <ChevronRight size={13} />
                </button>

                {/* Micro pagination dots */}
                <div
                  className="hidden lg:flex items-center gap-1 shrink-0 ml-1.5"
                  aria-label="Announcement slides"
                >
                  {messages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      aria-label={`Go to announcement ${idx + 1}`}
                      className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentIndex
                          ? "w-3 bg-[#DCCFB9]"
                          : "w-1 bg-white/30 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ─── Right-side Utility Navigation (Desktop) ─── */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {announcement.country && (
            <>
              <div className="text-white/85 hover:text-white transition-colors font-medium flex items-center gap-1 cursor-default">
                <span>{announcement.country}</span>
                <ChevronDown size={13} strokeWidth={2} className="opacity-70" />
              </div>
              <span className="text-white/25 text-[10px]" aria-hidden="true">
                |
              </span>
            </>
          )}

          {/* WhatsApp Direct Help Link */}
          <a
            href={announcement.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/85 hover:text-white transition-colors font-medium flex items-center gap-1.5 group cursor-pointer"
            title="Chat with Customer Support on WhatsApp"
            aria-label="Help via WhatsApp"
          >
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="currentColor"
              aria-hidden="true"
              className="shrink-0 text-[#25D366] group-hover:scale-110 transition-transform"
            >
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.214 8.214 0 012.41 5.82c0 4.54-3.7 8.24-8.24 8.24-1.45 0-2.87-.38-4.12-1.1l-.3-.17-3.12.82.83-3.04-.19-.31a8.232 8.232 0 01-1.26-4.44c0-4.54 3.7-8.24 8.24-8.24v.02zm-3.53 4.67c-.2 0-.41.02-.6.1-.21.09-.64.38-.64 1.15 0 .76.56 1.73.64 1.84.08.11 1.1 1.68 2.67 2.36 1.57.67 1.57.45 1.85.42.29-.02.92-.38 1.05-.74.13-.37.13-.68.09-.75-.04-.07-.15-.11-.32-.19-.17-.08-1.03-.51-1.19-.57-.16-.06-.28-.09-.39.09-.12.17-.45.57-.55.69-.1.11-.2.13-.37.04-.17-.08-.73-.27-1.39-.86-.51-.46-.86-1.03-.96-1.2-.1-.17-.01-.27.07-.35.08-.08.17-.2.26-.3.09-.1.12-.17.18-.28.06-.11.03-.21-.01-.3-.05-.08-.39-.95-.54-1.3-.14-.34-.29-.29-.39-.3z" />
            </svg>
            <span>Help</span>
          </a>

          <span className="text-white/25 text-[10px]" aria-hidden="true">
            |
          </span>

          <Link
            href="/account?tab=orders"
            className="text-white/85 hover:text-white transition-colors font-medium"
          >
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}
