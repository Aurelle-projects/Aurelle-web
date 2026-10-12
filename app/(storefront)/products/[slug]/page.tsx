import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "@/utils/slug";
import ProductDetailClient from "./ProductDetailClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// 60-second ISR caching: guarantees lightning-fast sub-10ms edge delivery and eliminates DB latency
export const revalidate = 60;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    notFound();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const decodedSlug = decodeURIComponent(slug).trim();
  const cleanSlug = slugify(decodedSlug);

  // Try clean slug first
  let { data: product, error } = await supabase
    .from("products")
    .select(`
      id, name, slug, sku, category_id, subcategory_id, specifications,
      description, benefits, ingredients, usage_instructions,
      retail_price, compare_at_price, tax_enabled, is_out_of_stock,
      is_published, is_featured, is_best_seller, is_new_arrival,
      brand:brands(name),
      category:categories(name, slug),
      subcategory:subcategories(name, slug),
      product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
    `)
    .eq("slug", cleanSlug)
    .eq("status", "published")
    .maybeSingle();

  // Fallback: If not found, check decoded slug in case DB still has spaces
  if (!product && decodedSlug !== cleanSlug) {
    const { data: legacyProduct } = await supabase
      .from("products")
      .select(`
        id, name, slug, sku, category_id, subcategory_id, specifications,
        description, benefits, ingredients, usage_instructions,
        retail_price, compare_at_price, tax_enabled, is_out_of_stock,
        is_published, is_featured, is_best_seller, is_new_arrival,
        brand:brands(name),
        category:categories(name, slug),
        subcategory:subcategories(name, slug),
        product_images(cloudinary_public_id, secure_url, alt_text, is_primary, sort_order)
      `)
      .eq("slug", decodedSlug)
      .eq("status", "published")
      .maybeSingle();
    product = legacyProduct;
  }

  // Resolve subcategory if stored in specifications JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const specSubId = (product?.specifications as any)?.subcategory_id || product?.subcategory_id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (product && !(product as any).subcategory && specSubId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subData } = await (supabase as any)
      .from("subcategories")
      .select("name, slug")
      .eq("id", specSubId)
      .maybeSingle();
    if (subData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (product as any).subcategory = subData;
    }
  }

  if (error || !product) {
    notFound();
  }

  // If the requested URL was non-canonical (e.g. contained %20 or spaces), redirect to clean canonical URL
  if (product.slug && (slug !== product.slug || slug.includes("%20") || slug.includes(" "))) {
    redirect(`/products/${product.slug}`);
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

  return (
    <ProductDetailClient
      initialProduct={product}
      initialRelatedProducts={relatedProducts}
      slug={slug}
    />
  );
}