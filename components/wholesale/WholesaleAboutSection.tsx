import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface WholesaleAboutData {
  heading?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_public_id?: string | null;
}

interface WholesaleAboutSectionProps {
  data?: WholesaleAboutData | null;
  showButton?: boolean;
}

export default function WholesaleAboutSection({
  data,
  showButton = true,
}: WholesaleAboutSectionProps) {
  if (!data) return null;

  const heading = data.heading?.trim() || "";
  const description = data.description?.trim() || "";

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "korjax8u";
  const imageSrc =
    data.image_url ||
    (data.image_public_id
      ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1200,c_limit/${data.image_public_id}`
      : null);

  // If no heading, description, or image is provided, do not render mock data
  if (!heading && !description && !imageSrc) {
    return null;
  }

  return (
    <section
      className="bg-white py-12 md:py-20 border-b border-[#EFEAE0]/60"
      aria-label="Wholesale About Section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 ${imageSrc ? "lg:grid-cols-12" : ""} gap-8 md:gap-12 lg:gap-16 items-center`}>
          {/* Left Side: Image */}
          {imageSrc && (
            <div className="lg:col-span-6 w-full">
              <div className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-4/3 overflow-hidden rounded-sm border border-[#DCCFB9]/50 shadow-xs bg-[#FAF8F5]">
                <Image
                  src={imageSrc}
                  alt={heading || "Wholesale About Section"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            </div>
          )}

          {/* Right Side: Heading and Description */}
          <div className={`${imageSrc ? "lg:col-span-6" : "max-w-3xl mx-auto"} flex flex-col justify-center space-y-4 md:space-y-6`}>
            {heading && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#14231B] tracking-tight leading-tight">
                {heading}
              </h2>
            )}

            {description && (
              <div className="text-sm sm:text-base text-[#5C6460] leading-relaxed whitespace-pre-line space-y-3">
                {description}
              </div>
            )}

            {showButton && (
              <div className="pt-2">
                <Link
                  href="/wholesale/about"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 sm:px-8 bg-[#183D2B] hover:bg-[#14231B] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-sm transition-all duration-150 shadow-xs active:scale-95 group cursor-pointer w-fit"
                >
                  <span>Learn More</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
