import type { Metadata } from "next";
import CombosListingClient from "./CombosListingClient";

const SITE_URL = "https://aurellecosmeticshop.com";

export const metadata: Metadata = {
  title: "Exclusive Beauty Combos & Skincare Bundles UAE | عروض باقات التجميل دبي",
  description:
    "Discover curated luxury beauty, skincare & makeup combos with exclusive savings in UAE. Express delivery across Dubai, Abu Dhabi & GCC. عروض حزم مستحضرات التجميل والعناية بالبشرة في الإمارات.",
  keywords: [
    "beauty combos UAE",
    "skincare bundles Dubai",
    "makeup combo deals UAE",
    "cosmetics gift sets Dubai",
    "discounted beauty sets UAE",
    "عروض باقات الجمال دبي",
    "عروض مكياج الإمارات",
    "مجموعات عناية بالبشرة مخفضة",
  ],
  alternates: { canonical: `${SITE_URL}/combos` },
  openGraph: {
    title: "Exclusive Beauty Combos & Skincare Bundles UAE | Aurelle",
    description:
      "Save on curated luxury beauty & skincare bundles with express delivery across Dubai & UAE.",
    url: `${SITE_URL}/combos`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Beauty Combos & Bundles - Aurelle UAE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Exclusive Beauty Combos & Skincare Bundles UAE | Aurelle",
    description: "Curated beauty & skincare bundles with express delivery across UAE.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

export default function CombosPage() {
  return <CombosListingClient />;
}
