import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

// ─── Fonts: Haute Parfumerie & Luxury Cosmetics Typography ────────────────────
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelle.ae"
  ),
  title: {
    default: "Aurelle — Everyday Essentials. Elevated.",
    template: "%s | Aurelle",
  },
  description:
    "Beauty, personal care and lifestyle essentials for everyone. Shop retail or apply for wholesale at Aurelle Cosmetics Trading FZ-LLC, UAE.",
  keywords: [
    "cosmetics",
    "skincare",
    "beauty",
    "personal care",
    "wholesale cosmetics",
    "UAE beauty",
    "Dubai cosmetics",
    "grooming",
    "hair care",
    "baby care",
    "wellness",
    "fragrances",
  ],
  authors: [{ name: "Aurelle Cosmetics Trading FZ-LLC" }],
  creator: "Aurelle",
  publisher: "Aurelle Cosmetics Trading FZ-LLC",
  robots: {
    index: true,
    follow: true,
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
    siteName: "Aurelle",
    title: "Aurelle — Everyday Essentials. Elevated.",
    description:
      "Beauty, personal care and lifestyle essentials for everyone. Shop retail or apply for wholesale.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aurelle Cosmetics — Everyday Essentials. Elevated.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurelle — Everyday Essentials. Elevated.",
    description:
      "Beauty, personal care and lifestyle essentials for everyone.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
};

// ─── Organization Schema ──────────────────────────────────────────────────────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Aurelle Cosmetics Trading FZ-LLC",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelle.ae",
  logo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://aurelle.ae"}/logo.png`,
  description:
    "Premium beauty, personal care and lifestyle essentials for everyone.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "AE",
  },
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
            __html: JSON.stringify(organizationSchema),
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
