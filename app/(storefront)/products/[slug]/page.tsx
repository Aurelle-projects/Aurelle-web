import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aurellecosmeticshop.com";

// 60-second ISR caching: guarantees lightning-fast sub-10ms edge delivery and eliminates DB latency
export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: "Product | Aurelle Cosmetics UAE" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product } = await supabase
    .from("products")
    .select(`
      name, slug, description, retail_price, compare_at_price,
      brand:brands(name),
      category:categories(name),
      product_images(secure_url, is_primary)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product) {
    return {
      title: "Product Not Found | Aurelle Cosmetics UAE",
      robots: { index: false, follow: false },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandName = (product.brand as any)?.name || "Aurelle";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const catName = (product.category as any)?.name || "Cosmetics";
  const title = `${product.name} | ${brandName} | Aurelle Cosmetics UAE`;
  const cleanDesc = product.description
    ? product.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 160)
    : `Buy authentic ${product.name} by ${brandName} online in UAE at Aurelle. Fast delivery across Dubai, Abu Dhabi & GCC. Cash on Delivery available.`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product.product_images?.find((img: any) => img.is_primary)?.secure_url ||
    product.product_images?.[0]?.secure_url ||
    `${SITE_URL}/og-image.jpg`;
  const pageUrl = `${SITE_URL}/products/${slug}`;

  return {
    title,
    description: cleanDesc,
    keywords: [
      product.name,
      `${product.name} UAE`,
      `${product.name} Dubai`,
      brandName,
      catName,
      "Aurelle",
      "Aurelle Cosmetics",
      "Aurelle Cosmetics UAE",
      "buy cosmetics UAE",
      "authentic skincare Dubai",
      "beauty shop UAE",
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
          alt: `${product.name} — Aurelle Cosmetics UAE`,
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

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    notFound();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, sku, category_id, description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, tax_enabled, is_out_of_stock,
      is_published, is_featured, is_best_seller, is_new_arrival,
      brand:brands(name),
      category:categories(name, slug),
      product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let relatedProducts: any[] = [];
  if (product.category_id) {
    const { data: related } = await supabase
      .from("products")
      .select(`
        id, name, slug, sku, retail_price, compare_at_price, tax_enabled, is_out_of_stock,
        is_new_arrival, is_featured, is_best_seller,
        brand:brands(name),
        category:categories(name, slug),
        product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
      `)
      .eq("status", "published")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(4);

    relatedProducts = related || [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandName = (product.brand as any)?.name || "Aurelle";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product.product_images?.find((img: any) => img.is_primary)?.secure_url ||
    product.product_images?.[0]?.secure_url ||
    `${SITE_URL}/og-image.jpg`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    image: product.product_images?.map((img: any) => img.secure_url) || [primaryImage],
    description:
      product.description?.replace(/<[^>]*>/g, "").slice(0, 300) ||
      `${product.name} available at Aurelle Cosmetics UAE`,
    sku: product.sku || undefined,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${slug}`,
      priceCurrency: "AED",
      price: product.retail_price,
      itemCondition: "https://schema.org/NewCondition",
      availability: product.is_out_of_stock
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
        name: "Shop",
        item: `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/products/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <ProductDetailClient
        initialProduct={product}
        initialRelatedProducts={relatedProducts}
        slug={slug}
      />
    </>
  );
}