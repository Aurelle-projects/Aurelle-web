import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://aurellecosmeticshop.com";

interface ProductLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: product } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        sku,
        description,
        retail_price,
        compare_at_price,
        is_out_of_stock,
        brand:brands(name),
        category:categories(name, slug),
        product_images(secure_url, is_primary)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    return product;
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
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product | Aurelle Cosmetics UAE",
      robots: { index: false, follow: false },
    };
  }

  const brandName = Array.isArray(product.brand)
    ? product.brand[0]?.name
    : (product.brand as { name: string } | null)?.name || "Aurelle";

  const categoryName = Array.isArray(product.category)
    ? product.category[0]?.name
    : (product.category as { name: string; slug: string } | null)?.name || "Cosmetics";

  const primaryImg =
    product.product_images?.find((img: { is_primary: boolean; secure_url: string }) => img.is_primary)?.secure_url ||
    product.product_images?.[0]?.secure_url ||
    `${SITE_URL}/og-image.jpg`;

  const cleanDescription = product.description
    ? product.description.replace(/\s+/g, " ").trim().slice(0, 160)
    : `Buy authentic ${product.name} online in Dubai & UAE. AED ${product.retail_price}. Express delivery across Dubai, Abu Dhabi, Sharjah & all Emirates. 100% Genuine.`;

  const pageUrl = `${SITE_URL}/products/${product.slug}`;

  return {
    title: `${product.name} | Buy Online UAE`,
    description: cleanDescription,
    keywords: [
      product.name,
      `${product.name} UAE`,
      `${product.name} Dubai`,
      brandName,
      categoryName,
      "buy cosmetics UAE",
      "beauty shop Dubai",
      "authentic skincare UAE",
      "cash on delivery UAE",
      "تسوق أونلاين الإمارات",
      "مستحضرات تجميل دبي",
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${product.name} | Buy Online UAE | Aurelle Cosmetics`,
      description: cleanDescription,
      url: pageUrl,
      type: "website",
      images: [
        {
          url: primaryImg,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Aurelle Cosmetics UAE`,
      description: cleanDescription,
      images: [primaryImg],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: ProductLayoutProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return <>{children}</>;
  }

  const brandName = Array.isArray(product.brand)
    ? product.brand[0]?.name
    : (product.brand as { name: string } | null)?.name || "Aurelle";

  const categoryName = Array.isArray(product.category)
    ? product.category[0]?.name
    : (product.category as { name: string; slug: string } | null)?.name || "Cosmetics";

  const images = (product.product_images || [])
    .map((img: { secure_url: string }) => img.secure_url)
    .filter(Boolean);

  if (images.length === 0) {
    images.push(`${SITE_URL}/og-image.jpg`);
  }

  const pageUrl = `${SITE_URL}/products/${product.slug}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description:
      product.description ||
      `Authentic ${product.name} available at Aurelle Cosmetics UAE. Express delivery across Dubai, Abu Dhabi, and GCC.`,
    sku: product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: categoryName,
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "AED",
      price: product.retail_price,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.is_out_of_stock
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
        name: "Shop",
        item: `${SITE_URL}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: pageUrl,
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
      {children}
    </>
  );
}
