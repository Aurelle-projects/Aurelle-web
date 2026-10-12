import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

// ─── Viewport: Prevent iPhone Auto-Zoom on Input Focus ────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// ─── Fonts: Haute Parfumerie & Luxury Cosmetics Typography ────────────────────
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

// ─── Metadata ────────────────────────────────────────────────────────────────
const SITE_URL = "https://aurellecosmeticshop.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aurelle Cosmetics | Luxury Beauty & Skincare Shop UAE | متجر أوريل للتجميل دبي",
    template: "%s | Aurelle Cosmetics UAE",
  },
  description:
    "Shop authentic cosmetics, skincare, haircare, perfumes & personal care in UAE. Express delivery in Dubai, Abu Dhabi, Sharjah & GCC. Cash on delivery & Card. متجر مستحضرات تجميل ومكياج وعناية بالبشرة أونلاين في الإمارات.",
  keywords: [
    // English UAE Commercial Keywords
    "cosmetics UAE",
    "online beauty shop Dubai",
    "buy makeup online UAE",
    "skincare Dubai",
    "perfumes online UAE",
    "haircare products UAE",
    "luxury beauty Dubai",
    "Aurelle Cosmetics",
    "cosmetics Abu Dhabi",
    "beauty store Sharjah",
    "personal care UAE",
    "baby care essentials Dubai",
    "wellness products UAE",
    "cash on delivery cosmetics UAE",
    "express beauty delivery Dubai",
    "wholesale cosmetics UAE",
    "beauty distributor Dubai",
    "authentic cosmetics UAE",
    // Arabic High-Volume Search Keywords
    "مستحضرات تجميل دبي",
    "مكياج الإمارات",
    "متجر تجميل أونلاين",
    "عناية بالبشرة دبي",
    "عناية بالبشرة أبوظبي",
    "عطور أصلية دبي",
    "متجر مكياج أونلاين الإمارات",
    "شراء منتجات عناية بالبشرة دبي",
    "منتجات عناية بالشعر الإمارات",
    "أدوات تجميل دبي",
    "مستحضرات تجميل أصلية",
    "توصيل مكياج دبي وأبوظبي",
    "الدفع عند الاستلام مكياج الإمارات",
    "مستحضرات تجميل بالجملة دبي",
    "متجر أوريل",
    "أوريل لمستحضرات التجميل",
  ],
  authors: [{ name: "Aurelle Cosmetics Trading FZ-LLC", url: SITE_URL }],
  creator: "Aurelle Cosmetics",
  publisher: "Aurelle Cosmetics Trading FZ-LLC",
  applicationName: "Aurelle Cosmetics Shop",
  verification: {
    google: "WNB9BN4aPPB5at-urnoGx33fTvAYoRk0JJsEuhFXaQM",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    alternateLocale: ["ar_AE"],
    url: SITE_URL,
    siteName: "Aurelle Cosmetics",
    title: "Aurelle Cosmetics | Luxury Beauty & Skincare Shop UAE",
    description:
      "Shop authentic cosmetics, skincare, haircare, perfumes & personal care in UAE. Express delivery across Dubai, Abu Dhabi & GCC.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aurelle Cosmetics UAE — Luxury Beauty, Skincare & Fragrances",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelle Cosmetics | Luxury Beauty & Skincare Shop UAE",
    description:
      "Authentic cosmetics, skincare, haircare & fragrances delivered across UAE.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-AE": SITE_URL,
      "ar-AE": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  category: "Beauty & Cosmetics",
};

// ─── Comprehensive Multi-Entity JSON-LD Schema (UAE Focused) ─────────────────
const jsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Aurelle Cosmetics Trading FZ-LLC",
      alternateName: ["Aurelle", "أوريل لمستحضرات التجميل"],
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
      },
      description:
        "Premier UAE cosmetics, luxury skincare, haircare, and personal care destination based in Dubai, United Arab Emirates.",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressRegion: "Dubai",
        addressCountry: "AE",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          areaServed: ["AE", "SA", "OM", "KW", "BH", "QA"],
          availableLanguage: ["English", "Arabic"],
        },
      ],
      sameAs: [
        "https://www.instagram.com/aurellecosmetics",
        "https://www.tiktok.com/@aurellecosmetics",
      ],
    },
    {
      "@type": ["OnlineStore", "CosmeticsStore"],
      "@id": `${SITE_URL}/#store`,
      name: "Aurelle Cosmetics Shop",
      url: SITE_URL,
      priceRange: "$$",
      currenciesAccepted: "AED",
      paymentAccepted: "Cash on Delivery, Credit Card, Debit Card, Apple Pay",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Dubai",
        addressRegion: "Dubai",
        addressCountry: "AE",
      },
      areaServed: [
        { "@type": "City", name: "Dubai" },
        { "@type": "City", name: "Abu Dhabi" },
        { "@type": "City", name: "Sharjah" },
        { "@type": "City", name: "Ajman" },
        { "@type": "City", name: "Ras Al Khaimah" },
        { "@type": "City", name: "Fujairah" },
        { "@type": "City", name: "Umm Al Quwain" },
        { "@type": "Country", name: "United Arab Emirates" },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Aurelle Cosmetics",
      inLanguage: ["en-AE", "ar-AE"],
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cormorant.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdGraph),
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        style={{
          fontFamily: "var(--font-sans), -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
