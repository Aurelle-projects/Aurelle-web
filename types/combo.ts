// ============================================================
// AURELLE — COMBO OFFER TYPES
// Retail-Only Bundled Commercial Offers
// ============================================================

import type { Json } from "./database";

export interface ComboOfferImage {
  secure_url: string;
  cloudinary_public_id?: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
}

export interface ComboOfferItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  benefits?: string | null;
  retail_price: number;
  compare_at_price?: number | null;
  tax_enabled?: boolean;
  is_published?: boolean;
  is_retail_available?: boolean;
  status?: string;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  product_images?: Array<{
    secure_url: string;
    is_primary?: boolean;
    cloudinary_public_id?: string;
  }>;
  inventory?: {
    stock_quantity: number;
    stock_status: string;
  } | null;
}

export interface ComboOfferItem {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
  sort_order: number;
  created_at?: string;
  product?: ComboOfferItemProduct | null;
}

export interface ComboOffer {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  features: string[] | string | null;
  price: number;
  compare_at_price: number | null;
  tax_enabled: boolean;
  is_active: boolean;
  is_featured: boolean;
  primary_image_url: string | null;
  primary_image_public_id: string | null;
  images: ComboOfferImage[];
  created_at: string;
  updated_at: string;
  items?: ComboOfferItem[];
  // Computed values
  total_individual_price?: number;
  savings_amount?: number;
  savings_percentage?: number;
  in_stock?: boolean;
  available_stock?: number;
  component_stock_breakdown?: Array<{
    product_id: string;
    name: string;
    sku?: string;
    required_quantity: number;
    available_quantity: number;
    max_combos: number;
    in_stock: boolean;
  }>;
}

export interface ComboOfferInput {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  features?: string[];
  price: number;
  compare_at_price?: number | null;
  tax_enabled?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  primary_image_url?: string | null;
  primary_image_public_id?: string | null;
  images?: ComboOfferImage[];
  items: Array<{
    product_id: string;
    quantity: number;
    sort_order?: number;
  }>;
}

export interface ComboCartItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  retail_price: number;
  compare_at_price?: number;
  tax_enabled: boolean;
  is_combo: true;
  combo_id: string;
  combo_items: Array<{
    product_id: string;
    name: string;
    sku: string;
    quantity: number;
    image?: string | null;
    retail_price?: number;
  }>;
  images?: Array<{ url: string; alt?: string; is_primary?: boolean }>;
  primary_image_url?: string | null;
  description?: string;
  short_description?: string;
  category_name?: string;
  category_slug?: string;
  category_id?: string;
  subcategory?: string;
  brand_name?: string;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  stock_quantity?: number;
  stock_status?: string;
  wholesale_moq?: number;
  wholesale_price?: number;
  rating?: number;
  reviews_count?: number;
  tags?: string[];
}
