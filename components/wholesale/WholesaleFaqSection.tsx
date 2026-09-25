"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

export interface WholesaleFaqItem {
  question?: string | null;
  answer?: string | null;
}

export interface WholesaleFaqData {
  heading?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
  items?: WholesaleFaqItem[];
}

interface WholesaleFaqSectionProps {
  data?: WholesaleFaqData | null;
}

export default function WholesaleFaqSection({ data }: WholesaleFaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!data) return null;

  const heading = data.heading?.trim() || "";
  const description = data.description?.trim() || "";
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";
  const imageSrc =
    data.image_url ||
    (data.image_public_id
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,c_limit/${data.image_public_id}`
      : null);

  // Maximum 5 questions, filter those with text
  const validItems = (Array.isArray(data.items) ? data.items : [])
    .slice(0, 5)
    .map((item) => ({
      question: item?.question?.trim() || "",
      answer: item?.answer?.trim() || "",
    }))
    .filter((item) => item.question || item.answer);

  // Strictly do not render mock data if no items and no image
  if (validItems.length === 0 && !imageSrc && !heading && !description) {
    return null;
  }

  function toggleItem(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section
      className="bg-white py-12 md:py-20 border-b border-[#EFEAE0]/60"
      aria-label="Wholesale Frequently Asked Questions"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header: Section Heading & Description */}
        {(heading || description) && (
          <div className="max-w-3xl mb-8 md:mb-4 space-y-2.5">
            {heading && (
              <h2 className="text-3xl sm:text-4xl text-[#14231B] tracking-tight leading-tight">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-sm text-[#5C6460] leading-relaxed whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Two Columns: Image and Accordion with equal width (50/50) and matching height */}
        <div
          className={`grid grid-cols-1 ${
            imageSrc ? "lg:grid-cols-2 items-stretch" : ""
          } gap-6 lg:gap-10`}
        >
          {/* Left Column: Image with exact same width (50%) and matching height */}
          {imageSrc && (
            <div className="w-full flex">
              <div className="relative w-full min-h-[340px] sm:min-h-[420px] lg:min-h-0 h-full overflow-hidden rounded-sm border border-[#DCCFB9]/60 shadow-xs bg-[#FAF8F5]">
                <Image
                  src={imageSrc}
                  alt={heading || "Wholesale FAQ Image"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          )}

          {/* Right Column: Accordion with exact same width (50%) and clean borderless '+' button */}
          <div
            className={`${
              imageSrc ? "w-full" : "max-w-3xl mx-auto w-full"
            } flex flex-col justify-between space-y-3`}
          >
            {validItems.map((item, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div
                  key={idx}
                  className="border border-[#DCCFB9]/60 rounded-sm bg-[#FAF8F5]/60 overflow-hidden transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    aria-expanded={isOpen}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-[#FAF8F5] transition-colors cursor-pointer group"
                  >
                    <span className="text-sm text-[#14231B] leading-snug">
                      {item.question}
                    </span>
                    <Plus
                      size={20}
                      strokeWidth={2}
                      className={`text-[#14231B] shrink-0 transition-transform duration-300 ease-out ${
                        isOpen ? "rotate-45" : "rotate-0 text-[#14231B]/80 group-hover:text-[#14231B]"
                      }`}
                    />
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    {item.answer && (
                      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-[#5C6460] leading-relaxed whitespace-pre-line border-t border-[#EFEAE0]/80">
                        {item.answer}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
