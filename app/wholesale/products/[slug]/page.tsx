import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import WholesaleProductDetailClient from "./WholesaleProductDetailClient";

interface WholesaleProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

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
