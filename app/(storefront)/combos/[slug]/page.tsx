import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ComboDetailClient from "./ComboDetailClient";
import { ComboOffer } from "@/types/combo";

interface ComboPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

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

  return (
    <ComboDetailClient
      initialCombo={combo}
      initialOtherCombos={otherCombos}
      slug={slug}
    />
  );
}
