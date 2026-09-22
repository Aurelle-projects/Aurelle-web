"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoryImageUrl } from "@/lib/cloudinary/transforms";

export interface CategoryItem {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  sort_order?: number;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

export default function CategoryGrid({ categories: initialCategories }: CategoryGridProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories || []);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Pick up any image updates from DB / Admin Panel
  useEffect(() => {
    async function loadLiveCategories() {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setCategories(data.categories);
          }
        }
      } catch {
        // Ignore
      }
    }
    loadLiveCategories();
  }, []);

  // Sync when server data updates
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Infinite Auto-Slide
  useEffect(() => {
    if (isPaused || categories.length <= 1) return;

    const interval = setInterval(() => {
      const slider = sliderRef.current;
      if (!slider) return;

      const track = slider.firstElementChild as HTMLElement;
      if (!track) return;

      const firstItem = track.children[0] as HTMLElement;
      const tenthItem = track.children[categories.length] as HTMLElement;

      const step = firstItem ? firstItem.offsetWidth + 32 : 220;
      const singleSetWidth = tenthItem && firstItem ? tenthItem.offsetLeft - firstItem.offsetLeft : 0;

      // Infinite loop: if we've scrolled past the first set, reset silently then scroll
      if (singleSetWidth > 0 && slider.scrollLeft >= singleSetWidth - 10) {
        slider.scrollLeft -= singleSetWidth;
      }

      slider.scrollBy({ left: step, behavior: "smooth" });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused, categories.length]);

  // Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = sliderRef.current;
    if (!slider) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const slider = sliderRef.current;
    if (!slider) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 6) {
      hasDraggedRef.current = true;
    }
    slider.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsPaused(false);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      hasDraggedRef.current = false;
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="w-full overflow-hidden py-3 px-2 sm:px-4" aria-label="Loading categories">
        <div className="flex items-start gap-6 sm:gap-8 lg:gap-10 w-max">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 animate-pulse"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full bg-[#F0EBE1] border border-[#E5DFD5]" />
              <div className="h-4 w-20 bg-[#F0EBE1] rounded-full mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Duplicate items 2x for seamless, infinite looping
  const displayItems = categories.concat(categories);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isDraggingRef.current = false;
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── Slider Scroll Track ────────────────────────────────────────── */}
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClickCapture={handleClickCapture}
        className="w-full overflow-x-auto scroll-smooth py-3 px-2 sm:px-4 cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          className="flex items-start gap-6 sm:gap-8 lg:gap-10 w-max"
          role="list"
          aria-label="Product categories slider"
        >
          {displayItems.map((category: CategoryItem, idx: number) => {
            const imageUrl =
              category.image_url ||
              (category.image_public_id ? getCategoryImageUrl(category.image_public_id) : null);

            const displayName = category.name;

            return (
              <Link
                key={`${category.slug}-${idx}`}
                href={`/shop?category=${category.slug}`}
                scroll={true}
                onClick={() => {
                  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
                }}
                className="flex flex-col items-center gap-3 group shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 transition-transform duration-300 hover:-translate-y-1"
                role="listitem"
                aria-label={`Shop ${displayName}`}
                draggable={false}
              >
                {/* ── Large Circular Category Card ─────────────────── */}
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden bg-white ring-2 ring-white group-hover:border-[#183D2B] group-hover:ring-[#183D2B]/20 transition-all duration-300 shadow-sm group-hover:shadow-xl group-hover:shadow-[#183D2B]/15">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={displayName}
                      fill
                      sizes="(max-width: 640px) 112px, (max-width: 1024px) 160px, 176px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      draggable={false}
                    />
                  ) : (
                    /* Elegant Letter Placeholder */
                    <div className="w-full h-full bg-gradient-to-br from-[#EDE8DE] to-[#D9CEBF] flex items-center justify-center">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-[#183D2B]/75">
                        {displayName.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Soft subtle inner glow vignette on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-[#183D2B]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* ── Typography & Label (Clean: Category name only, no extra explore arrows) ─ */}
                <span className="text-sm  text-[#1D211F] text-center tracking-tight leading-snug group-hover:text-[#183D2B] transition-colors">
                  {displayName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}