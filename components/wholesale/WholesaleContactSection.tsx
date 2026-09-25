import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface WholesaleContactSectionProps {
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export default function WholesaleContactSection({
  heading = "Have a Wholesale Requirement? Let's Talk.",
  description = "Discuss your requirements with our team and find the right products for your business.",
  buttonText = "CONTACT US",
  buttonHref = "/wholesale/contact",
  className = "",
}: WholesaleContactSectionProps) {
  return (
    <section
      className={`py-8 md:py-14 bg-white ${className}`}
      aria-label="Wholesale Contact CTA"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#14231B] rounded-sm sm:rounded-md p-8 sm:p-10 md:p-12 lg:p-14 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-10 shadow-sm relative overflow-hidden">
          {/* Left Side: Heading & Description */}
          <div className="space-y-2.5 max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl text-white tracking-tight leading-tight">
              {heading}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans">
              {description}
            </p>
          </div>

          {/* Right Side: Contact Us Button */}
          <div className="shrink-0 flex justify-center md:justify-end w-full md:w-auto">
            <Link
              href={buttonHref}
              className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-6 sm:px-8 bg-white hover:bg-[#FAF8F5] text-[#14231B] text-xs sm:text-sm font-bold uppercase tracking-wider rounded-sm transition-all duration-150 shadow-xs active:scale-95 group"
            >
              <span>{buttonText}</span>
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
