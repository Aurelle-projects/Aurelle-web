import type { Metadata } from "next";

const SITE_URL = "https://aurellecosmeticshop.com";

export const metadata: Metadata = {
  title: "Shop Luxury Cosmetics & Skincare Online UAE | متجر التجميل والمكياج دبي",
  description:
    "Explore 100% genuine cosmetics, skincare, haircare, perfumes & personal care products with fast delivery across Dubai, Abu Dhabi, Sharjah & all UAE at Aurelle Cosmetics. Cash on Delivery & Card payment. تسوق أرقى مستحضرات التجميل والمكياج والعناية بالبشرة أونلاين في الإمارات.",
  keywords: [
    "Aurelle",
    "Aurelle Cosmetics",
    "Aurelle UAE",
    "Aurelle Cosmetics UAE",
    "Aurelle shop",
    "shop cosmetics UAE",
    "buy makeup online Dubai",
    "skincare products UAE",
    "luxury beauty shop Dubai",
    "hair care UAE",
    "perfumes online UAE",
    "personal care products Dubai",
    "beauty products Abu Dhabi",
    "cosmetics cash on delivery UAE",
    "تسوق مكياج أونلاين الإمارات",
    "شراء مستحضرات تجميل دبي",
    "متجر عناية بالبشرة دبي",
    "منتجات تجميل أصلية الإمارات",
    "عطور أصلية دبي",
    "مكياج دبي أونلاين",
    "أوريل كوزمتكس",
  ],
  alternates: {
    canonical: `${SITE_URL}/shop`,
  },
  openGraph: {
    title: "Shop Luxury Cosmetics & Skincare Online UAE | Aurelle",
    description:
      "Explore 100% genuine cosmetics, skincare, haircare, perfumes & personal care with express delivery across Dubai, Abu Dhabi & GCC.",
    url: `${SITE_URL}/shop`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Shop Cosmetics & Skincare UAE - Aurelle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Luxury Cosmetics & Skincare Online UAE | Aurelle",
    description:
      "Shop authentic cosmetics, skincare & haircare with fast delivery across Dubai & UAE.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
};

const collectionSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Aurelle Cosmetics Catalog UAE",
  url: `${SITE_URL}/shop`,
  description:
    "Full catalog of luxury beauty, cosmetics, personal care, and skincare products in Dubai, United Arab Emirates.",
  isPartOf: {
    "@type": "WebSite",
    name: "Aurelle Cosmetics",
    url: SITE_URL,
  },
  breadcrumb: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop Catalog",
        item: `${SITE_URL}/shop`,
      },
    ],
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema),
        }}
      />
      {children}
    </>
  );
}
