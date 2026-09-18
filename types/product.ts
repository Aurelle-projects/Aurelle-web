// ============================================================
// AURELLE — PRODUCT TYPES
// ============================================================

import type {
  Database,
  StockStatus,
  CustomerType,
} from "./database";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductImage =
  Database["public"]["Tables"]["product_images"]["Row"];

export type WholesalePriceTier =
  Database["public"]["Tables"]["wholesale_price_tiers"]["Row"];

export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Brand = Database["public"]["Tables"]["brands"]["Row"];

// ─── Product with relations ───────────────────────────────────────────────────
export interface ProductWithRelations extends Product {
  brand: Pick<Brand, "id" | "name" | "slug"> | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  product_images: ProductImage[];
  inventory: Pick<
    Inventory,
    "stock_quantity" | "reserved_quantity" | "low_stock_threshold" | "stock_status"
  > | null;
}

// ─── Product card (minimal — for listings) ───────────────────────────────────
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand_name: string | null;
  category_name: string | null;
  category_slug: string | null;
  retail_price: number;
  compare_at_price: number | null;
  // Wholesale price only included when user is authorized
  wholesale_price?: number | null;
  wholesale_moq?: number | null;
  primary_image_url: string | null;
  primary_image_alt: string | null;
  stock_status: StockStatus;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
}

// ─── Product detail (full — for product page) ────────────────────────────────
export interface ProductDetail extends ProductWithRelations {
  wholesale_price_tiers?: WholesalePriceTier[];
  // These fields only included for authorized wholesale users
  authorized_wholesale_price?: number | null;
  authorized_wholesale_moq?: number | null;
}

// ─── Product listing query params ────────────────────────────────────────────
export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isWholesale?: boolean;
  sort?: ProductSort;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type ProductSort =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za"
  | "featured";

// ─── Authorized price view ───────────────────────────────────────────────────
export interface AuthorizedPriceView {
  retail_price: number;
  compare_at_price: number | null;
  customer_type: CustomerType;
  wholesale_price?: number;
  wholesale_moq?: number;
  wholesale_tiers?: WholesalePriceTier[];
}

// ─── Cloudinary image transform sizes ────────────────────────────────────────
export type ImageSize = "thumbnail" | "small" | "medium" | "large" | "zoom";
