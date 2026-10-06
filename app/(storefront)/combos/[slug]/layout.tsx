import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://aurellecosmeticshop.com";

interface ComboLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getCombo(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: combo } = await supabase
      .from("combo_offers")
      .select("id, name, slug, sku, description, price, compare_at_price, primary_image_url, is_out_of_stock")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    return combo;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const combo = await getCombo(slug);

  if (!combo) {
    return {
      title: "Combo Offer | Aurelle Cosmetics UAE",
      robots: { index: false, follow: false },
    };
  }

  const cleanDescription = combo.description
    ? combo.description.replace(/\s+/g, " ").trim().slice(0, 160)
    : `Exclusive beauty combo offer: ${combo.name}. Save on curated luxury cosmetics and skincare in UAE. AED ${combo.price}. Express delivery across Dubai & UAE.`;

  const pageUrl = `${SITE_URL}/combos/${combo.slug}`;
  const image = combo.primary_image_url || `${SITE_URL}/og-image.jpg`;

  return {
    title: `${combo.name} | Beauty Combo Offer UAE`,
    description: cleanDescription,
    keywords: [
      combo.name,
      `${combo.name} UAE`,
      "beauty combo offers Dubai",
      "skincare bundle UAE",
      "cosmetics value set UAE",
      "makeup combo deals Dubai",
      "عروض مكياج دبي",
      "مجموعات عناية بالبشرة الإمارات",
      "حزم تجميل مخفضة",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${combo.name} | Exclusive Beauty Combo UAE | Aurelle`,
      description: cleanDescription,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: combo.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${combo.name} | Aurelle Cosmetics UAE`,
      description: cleanDescription,
      images: [image],
    },
  };
}

export default async function ComboLayout({
  children,
  params,
}: ComboLayoutProps) {
  const { slug } = await params;
  const combo = await getCombo(slug);

  if (!combo) {
    return <>{children}</>;
  }

  const pageUrl = `${SITE_URL}/combos/${combo.slug}`;
  const image = combo.primary_image_url || `${SITE_URL}/og-image.jpg`;

  const comboSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: combo.name,
    image: [image],
    description:
      combo.description ||
      `Curated beauty combination package ${combo.name} by Aurelle Cosmetics UAE.`,
    sku: combo.sku || combo.id,
    brand: {
      "@type": "Brand",
      name: "Aurelle",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "AED",
      price: combo.price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: combo.is_out_of_stock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Aurelle Cosmetics Trading FZ-LLC",
      },
    },
  };

  const breadcrumbSchema = {
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
        name: "Combos",
        item: `${SITE_URL}/combos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: combo.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(comboSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      {children}
    </>
  );
}
