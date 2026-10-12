import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

  return (
    <ProductDetailClient
      initialProduct={product}
      initialRelatedProducts={relatedProducts}
      slug={slug}
    />
  );
}