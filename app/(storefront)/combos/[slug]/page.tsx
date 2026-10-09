import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ComboDetailClient from "./ComboDetailClient";
import { ComboOffer } from "@/types/combo";

interface ComboPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aurellecosmeticshop.com";

export const revalidate = 60;

export async function generateMetadata({ params }: ComboPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: "Exclusive Combo Offer | Aurelle Cosmetics UAE" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawCombo } = await (supabase as any)
    .from("combo_offers")
    .select("name, slug, description, price, compare_at_price, primary_image_url")
    .eq("slug", slug.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (!rawCombo) {
    return {
      title: "Combo Deal Not Found | Aurelle Cosmetics UAE",
      robots: { index: false, follow: false },
    };
  }

  const title = `${rawCombo.name} | Exclusive Beauty Combo | Aurelle Cosmetics UAE`;
  const cleanDesc = rawCombo.description
    ? rawCombo.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 160)
    : `Shop ${rawCombo.name} at Aurelle Cosmetics UAE for AED ${rawCombo.price}. Curated luxury beauty & skincare bundle with express delivery across Dubai & all Emirates.`;
  const primaryImage = rawCombo.primary_image_url || `${SITE_URL}/og-image.jpg`;
  const pageUrl = `${SITE_URL}/combos/${slug}`;

  return {
    title,
    description: cleanDesc,
    keywords: [
      rawCombo.name,
      `${rawCombo.name} UAE`,
      "beauty combos UAE",
      "skincare bundles Dubai",
      "cosmetics gift sets UAE",
      "Aurelle",
      "Aurelle Cosmetics",
      "Aurelle UAE",
      "Aurelle Cosmetics UAE",
      "buy cosmetics UAE",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description: cleanDesc,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: `${rawCombo.name} — Aurelle Cosmetics UAE`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDesc,
      images: [primaryImage],
    },
  };
}

export default async function ComboDetailPage({ params }: ComboPageProps) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    notFound();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawCombo, error } = await (supabase as any)
    .from("combo_offers")
    .select(`
      id,
      name,
      slug,
      sku,
      description,
      features,
      price,
      compare_at_price,
      tax_enabled,
      is_out_of_stock,
      is_active,
      is_featured,
      primary_image_url,
      primary_image_public_id,
      images,
      created_at,
      updated_at,
      combo_offer_items (
        id,
        product_id,
        quantity,
        sort_order,
        products (
          id,
          name,
          slug,
          sku,
          description,
          benefits,
          ingredients,
          usage_instructions,
          retail_price,
          compare_at_price,
          tax_enabled,
          is_published,
          is_retail_available,
          status,
          brands ( name ),
          categories ( name, slug ),
          product_images ( secure_url, is_primary, alt_text )
        )
      )
    `)
    .eq("slug", slug.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !rawCombo) {
    notFound();
  }

  // Format combo items and calculate bundle savings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (rawCombo.combo_offer_items || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    sort_order: item.sort_order,
    product: item.products
      ? {
          ...item.products,
          brand: item.products.brands,
          category: item.products.categories,
        }
      : null,
  }));

  let individualTotal = 0;
  for (const item of items) {
    const prodPrice = item.product?.retail_price ? Number(item.product.retail_price) : 0;
    individualTotal += prodPrice * item.quantity;
  }

  individualTotal = Math.round(individualTotal * 100) / 100;
  const comboPrice = Number(rawCombo.price) || 0;
  const savings = Math.max(0, Math.round((individualTotal - comboPrice) * 100) / 100);
  const savingsPercent =
    individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  const combo: ComboOffer = {
    ...rawCombo,
    price: comboPrice,
    compare_at_price: rawCombo.compare_at_price ? Number(rawCombo.compare_at_price) : null,
    items,
    total_individual_price: individualTotal,
    savings_amount: savings,
    savings_percentage: savingsPercent,
  };

  // Fetch other combos for bottom shelf
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let otherCombos: any[] = [];
  try {
    const { data: others } = await supabase
      .from("combo_offers")
      .select(`
        id,
        name,
        slug,
        sku,
        description,
        price,
        compare_at_price,
        tax_enabled,
        is_out_of_stock,
        is_active,
        is_featured,
        primary_image_url,
        primary_image_public_id,
        images
      `)
      .eq("is_active", true)
      .neq("id", rawCombo.id)
      .limit(3);

    otherCombos = others || [];
  } catch {
    otherCombos = [];
  }

  const primaryImage = rawCombo.primary_image_url || `${SITE_URL}/og-image.jpg`;

  const comboSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: rawCombo.name,
    image: [primaryImage],
    description:
      rawCombo.description?.replace(/<[^>]*>/g, "").slice(0, 300) ||
      `${rawCombo.name} exclusive beauty combo deal at Aurelle Cosmetics UAE`,
    sku: rawCombo.sku || undefined,
    brand: {
      "@type": "Brand",
      name: "Aurelle",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/combos/${slug}`,
      priceCurrency: "AED",
      price: comboPrice,
      itemCondition: "https://schema.org/NewCondition",
      availability: rawCombo.is_out_of_stock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Aurelle Cosmetics",
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
        name: rawCombo.name,
        item: `${SITE_URL}/combos/${slug}`,
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
      <ComboDetailClient
        initialCombo={combo}
        initialOtherCombos={otherCombos}
        slug={slug}
      />
    </>
  );
}
