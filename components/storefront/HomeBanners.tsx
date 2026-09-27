import React from "react";
import Image from "next/image";
import Link from "next/link";

interface HomeBannerImage {
  url: string | null;
  public_id?: string | null;
  link?: string | null;
}

interface HomeBannersProps {
  images?: HomeBannerImage[];
}

export default function HomeBanners({ images = [] }: HomeBannersProps) {
  const validImages = images.filter((image) => image?.url).slice(0, 2);

  if (validImages.length === 0) return null;

  return (
    <section className="bg-white py-6 md:py-12" aria-label="Homepage banners">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {validImages.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden rounded-xl shadow-xs"
            >
              {image.link ? (
                <Link href={image.link} className="block w-full h-full group">
                  <Image
                    src={image.url as string}
                    alt={`Homepage banner ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </Link>
              ) : (
                <Image
                  src={image.url as string}
                  alt={`Homepage banner ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
