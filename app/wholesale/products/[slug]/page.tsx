import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import WholesaleProductDetailClient from "./WholesaleProductDetailClient";

interface WholesaleProductPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://aurellecosmeticshop.com";

export const revalidate = 60;

export async function generateMetadata({ params }: WholesaleProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { title: "Wholesale Product | Aurelle Cosmetics UAE" };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: product } = await supabase
    .from("products")
    .select(`
      name, slug, description, wholesale_price, wholesale_moq,
      brand:brands(name),
      category:categories(name),
      product_images(secure_url, is_primary)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!product) {
    return {
      title: "Wholesale Product Not Found | Aurelle Cosmetics UAE",
      robots: { index: false, follow: false },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brandName = (product.brand as any)?.name || "Aurelle";
  const title = `${product.name} Wholesale UAE | Aurelle B2B Cosmetics Dubai`;
  const cleanDesc = product.description
    ? product.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 160)
    : `Buy bulk ${product.name} wholesale in UAE at Aurelle. Direct B2B supplier with starter MOQ of ${product.wholesale_moq || 1} units for pharmacies, salons & retail shops across UAE.`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product.product_images as any)?.find((img: any) => img.is_primary)?.secure_url ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (product.product_images as any)?.[0]?.secure_url ||
    `${SITE_URL}/og-image.jpg`;
  const pageUrl = `${SITE_URL}/wholesale/products/${slug}`;

  return {
    title,
    description: cleanDesc,
    keywords: [
      `${product.name} wholesale`,
      `${product.name} bulk UAE`,
      "wholesale cosmetics UAE",
      "B2B beauty supplier Dubai",
      brandName,
      "Aurelle Wholesale",
      "Aurelle Cosmetics UAE",
      "cosmetics distributor Dubai",
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
          alt: `${product.name} Wholesale — Aurelle Cosmetics UAE`,
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

export default async function WholesaleProductDetailPage({ params }: WholesaleProductPageProps) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    notFound();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: product, error } = await (supabase as any)
    .from("products")
    .select(`
      id, name, slug, sku, category_id, description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, wholesale_price, wholesale_moq,
      wholesale_unit_enabled, wholesale_unit_price, wholesale_box_enabled,
      wholesale_units_per_box, wholesale_box_price, wholesale_custom_quantity_enabled,
      is_wholesale_available, is_out_of_stock, is_published, is_featured, is_best_seller, is_new_arrival,
      brand:brands(name, slug),
      category:categories(name, slug),
      product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  // Fetch wholesale price tiers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tierData } = await (supabase as any)
    .from("wholesale_price_tiers")
    .select("*")
    .eq("product_id", product.id)
    .eq("is_active", true)
    .order("min_quantity", { ascending: true });

  // Related wholesale products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let relatedProducts: any[] = [];
  if (product.category_id) {
    const { data: related } = await supabase
      .from("products")
      .select(`
        id, name, slug, sku, retail_price, compare_at_price, wholesale_price, wholesale_moq,
        is_out_of_stock, is_new_arrival, is_featured, is_best_seller,
        brand:brands(name),
        category:categories(name, slug),
        product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
      `)
      .eq("status", "published")
      .eq("category_id", product.category_id)
      .neq("id", product.id)
      .limit(4);

    relatedProducts = related ?? [];
  }

  return (
    <WholesaleProductDetailClient
      initialProduct={product}
      initialTiers={tierData ?? []}
      initialRelatedProducts={relatedProducts}
      slug={slug}
    />
  );
}
