"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { getCategoryImageUrl } from "@/lib/cloudinary/transforms";

export interface WholesaleCategoryItem {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  sort_order?: number;
}

interface WholesaleCategorySectionProps {
  categories: WholesaleCategoryItem[];
}

export default function WholesaleCategorySection({
  categories: initialCategories,
}: WholesaleCategorySectionProps) {
  const [categories, setCategories] = useState<WholesaleCategoryItem[]>(initialCategories || []);
  const [isPaused, setIsPaused] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Sync server categories
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // Timed jump animation (automatic sliding)
  useEffect(() => {
    if (isPaused || categories.length <= 1) return;

    const interval = setInterval(() => {
      const slider = sliderRef.current;
      if (!slider) return;

      const track = slider.firstElementChild as HTMLElement;
      if (!track) return;

      const firstItem = track.children[0] as HTMLElement;
      const secondItem = track.children[1] as HTMLElement;
      const setItem = track.children[categories.length] as HTMLElement;

      const step =
        secondItem && firstItem
          ? secondItem.offsetLeft - firstItem.offsetLeft
          : (firstItem?.offsetWidth || 160) + 16;
      const singleSetWidth =
        setItem && firstItem ? setItem.offsetLeft - firstItem.offsetLeft : 0;

      // Infinite loop: if scrolled past the first set, reset silently then scroll
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

  // Manual scroll with left/right buttons
  const scroll = (direction: "left" | "right") => {
    const slider = sliderRef.current;
    if (!slider) return;
    const track = slider.firstElementChild as HTMLElement;
    const firstItem = track?.children[0] as HTMLElement;
    const secondItem = track?.children[1] as HTMLElement;
    const step =
      secondItem && firstItem
        ? (secondItem.offsetLeft - firstItem.offsetLeft) * 2
        : (slider.clientWidth * 0.5);

    slider.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  // Duplicate items for seamless infinite auto-slide loop
  const displayItems = categories.concat(categories).concat(categories);

  return (
    <section
      className="bg-white py-10 md:py-16 border-b border-[#EFEAE0] select-none"
      aria-labelledby="wholesale-categories-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        isDraggingRef.current = false;
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Section Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#183D2B] block mb-1">
              Procurement by Category
            </span>
            <h2
              id="wholesale-categories-heading"
              className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-[#14231B]"
            >
              Shop by Category
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-sm border border-[#EDE9DF] bg-[#FAF8F5] hover:bg-[#EFEAE0] flex items-center justify-center text-[#14231B] transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-sm border border-[#EDE9DF] bg-[#FAF8F5] hover:bg-[#EFEAE0] flex items-center justify-center text-[#14231B] transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Categories Auto-Slider (Square Shape Design) */}
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClickCapture={handleClickCapture}
          className="w-full overflow-x-auto scroll-smooth pb-4 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex items-stretch gap-4 sm:gap-6 w-max">
            {displayItems.map((category, idx) => {
              const imageUrl =
                category.image_url ||
                (category.image_public_id ? getCategoryImageUrl(category.image_public_id) : null);

              return (
                <Link
                  key={`${category.id || category.slug}-${idx}`}
                  href={`/wholesale/shop?category=${category.id || category.slug}`}
                  draggable={false}
                  className="group shrink-0 w-36 sm:w-44 md:w-48 flex flex-col transition-all duration-200"
                >
                  {/* ── Square Shape Category Image Container ── */}
                  <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-[#FAF8F5] border border-[#EDE9DF] shadow-2xs group-hover:border-[#183D2B] transition-all duration-300">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={category.name}
                        fill
                        sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 192px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#8E9590] p-4 bg-gradient-to-br from-[#FAF8F5] to-[#EDE9DF]/60">
                        <Layers size={28} className="text-[#183D2B]/60 mb-1" />
                        <span className="text-xl font-bold text-[#183D2B]/80">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Subtle inner dark gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>

                  {/* Category Label Below Square Image */}
                  <div className="pt-2.5 text-center">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#14231B] group-hover:text-[#183D2B] transition-colors line-clamp-1">
                      {category.name}
                    </h3>
                    <span className="text-[10px] text-[#8E9590] uppercase tracking-wider block mt-0.5 group-hover:text-[#183D2B] transition-colors">
                      Explore
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
