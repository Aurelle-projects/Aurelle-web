import React from "react";
import Image from "next/image";

interface ShowcaseImage {
  url: string | null;
  public_id?: string | null;
}

interface BrandShowcaseProps {
  heading?: string | null;
  description?: string | null;
  images?: ShowcaseImage[];
}

export default function BrandShowcase({
  heading,
  description,
  images = [],
}: BrandShowcaseProps) {
  // Filter valid image URLs
  const validImages = images.filter((img) => img && Boolean(img.url));

  // If no content has been configured by admin, do not render
  if (!heading && !description && validImages.length === 0) {
    return null;
  }

  // Ensure 6 slots for the 3x2 grid if images exist
  const displayImages = validImages.slice(0, 6);

  return (
    <section className="bg-white py-6 md:py-20 lg:py-24" aria-labelledby="showcase-heading">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: 6-Image Grid (3 columns x 2 rows) */}
          {displayImages.length > 0 && (
            <div className="lg:col-span-7 xl:col-span-7">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 overflow-hidden rounded-xl">
                {displayImages.map((item, index) => (
                  <div
                    key={index}
                    className="relative aspect-5/6 sm:aspect-4/5 overflow-hidden bg-[#F0EBE1] group"
                  >
                    {item.url && (
                      <Image
                        src={item.url}
                        alt={`${heading || "Showcase"} image ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 30vw, 25vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Heading & Small Description */}
          <div
            className={`${
              displayImages.length > 0
                ? "lg:col-span-5 xl:col-span-5"
                : "lg:col-span-12 text-center max-w-2xl mx-auto"
            } flex flex-col justify-center`}
          >
            {heading && (
              <h2
                id="showcase-heading"
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-[#1D211F] tracking-tight leading-tight"
              >
                {heading}
              </h2>
            )}

            {description && (
              <p className="text-sm sm:text-base text-[#5C6460] leading-relaxed mt-4 sm:mt-5 max-w-lg">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
