import type { Metadata } from "next";

const SITE_URL = "https://aurellecosmeticshop.com";

export const metadata: Metadata = {
  title: "Contact Aurelle Cosmetics UAE | Customer Care Dubai | تواصل معنا",
  description:
    "Contact Aurelle Cosmetics Trading FZ-LLC in Dubai, UAE. Customer support, order inquiries, wholesale distribution, and beauty consultations.",
  keywords: [
    "contact Aurelle cosmetics",
    "cosmetics customer care Dubai",
    "Aurelle UAE phone",
    "beauty support UAE",
    "تواصل مع أوريل للتجميل",
    "خدمة عملاء مستحضرات تجميل دبي",
    "رقم خدمة عملاء مكياج الإمارات",
  ],
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact Aurelle Cosmetics UAE | Customer Care Dubai",
    description:
      "Get in touch with Aurelle Cosmetics Trading FZ-LLC in Dubai, UAE. We are here to assist with retail and wholesale inquiries.",
    url: `${SITE_URL}/contact`,
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Contact Aurelle Cosmetics UAE",
      },
    ],
  },
};

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact Aurelle Cosmetics",
  url: `${SITE_URL}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "Aurelle Cosmetics Trading FZ-LLC",
    url: SITE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "AE",
      availableLanguage: ["English", "Arabic"],
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(contactSchema),
        }}
      />
      {children}
    </>
  );
}
