// ============================================================
// AURELLE — SUPABASE DATABASE TYPES
// Auto-generate from Supabase CLI after migrations are applied:
//   npx supabase gen types typescript --local > types/database.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          image_public_id: string | null;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
          seo_title?: string | null;
          seo_description?: string | null;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          logo_public_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          logo_public_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          logo_public_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          brand_id: string | null;
          category_id: string | null;
          description: string | null;
          benefits: string | null;
          ingredients: string | null;
          usage_instructions: string | null;
          specifications: Json | null;
          retail_price: number;
          compare_at_price: number | null;
          tax_enabled: boolean;
          is_out_of_stock: boolean;
          wholesale_price: number | null;
          wholesale_moq: number | null;
          wholesale_unit_enabled: boolean;
          wholesale_unit_price: number | null;
          wholesale_box_enabled: boolean;
          wholesale_units_per_box: number | null;
          wholesale_box_price: number | null;
          wholesale_custom_quantity_enabled: boolean;
          is_retail_available: boolean;
          is_wholesale_available: boolean;
          is_published: boolean;
          is_featured: boolean;
          is_best_seller: boolean;
          is_new_arrival: boolean;
          status: ProductStatus;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sku: string;
          brand_id?: string | null;
          category_id?: string | null;
          description?: string | null;
          benefits?: string | null;
          ingredients?: string | null;
          usage_instructions?: string | null;
          specifications?: Json | null;
          retail_price: number;
          compare_at_price?: number | null;
          tax_enabled?: boolean;
          is_out_of_stock?: boolean;
          wholesale_price?: number | null;
          wholesale_moq?: number | null;
          wholesale_unit_enabled?: boolean;
          wholesale_unit_price?: number | null;
          wholesale_box_enabled?: boolean;
          wholesale_units_per_box?: number | null;
          wholesale_box_price?: number | null;
          wholesale_custom_quantity_enabled?: boolean;
          is_retail_available?: boolean;
          is_wholesale_available?: boolean;
          is_published?: boolean;
          is_featured?: boolean;
          is_best_seller?: boolean;
          is_new_arrival?: boolean;
          status?: ProductStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          sku?: string;
          brand_id?: string | null;
          category_id?: string | null;
          description?: string | null;
          benefits?: string | null;
          ingredients?: string | null;
          usage_instructions?: string | null;
          specifications?: Json | null;
          retail_price?: number;
          compare_at_price?: number | null;
          tax_enabled?: boolean;
          is_out_of_stock?: boolean;
          wholesale_price?: number | null;
          wholesale_moq?: number | null;
          wholesale_unit_enabled?: boolean;
          wholesale_unit_price?: number | null;
          wholesale_box_enabled?: boolean;
          wholesale_units_per_box?: number | null;
          wholesale_box_price?: number | null;
          wholesale_custom_quantity_enabled?: boolean;
          is_retail_available?: boolean;
          is_wholesale_available?: boolean;
          is_published?: boolean;
          is_featured?: boolean;
          is_best_seller?: boolean;
          is_new_arrival?: boolean;
          status?: ProductStatus;
          seo_title?: string | null;
          seo_description?: string | null;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          cloudinary_public_id: string;
          secure_url: string;
          width: number | null;
          height: number | null;
          format: string | null;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          cloudinary_public_id: string;
          secure_url: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          cloudinary_public_id?: string;
          secure_url?: string;
          width?: number | null;
          height?: number | null;
          format?: string | null;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
        };
      };
      wholesale_price_tiers: {
        Row: {
          id: string;
          product_id: string;
          min_quantity: number;
          max_quantity: number | null;
          price_per_unit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          min_quantity: number;
          max_quantity?: number | null;
          price_per_unit: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          min_quantity?: number;
          max_quantity?: number | null;
          price_per_unit?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          stock_quantity: number;
          reserved_quantity: number;
          low_stock_threshold: number;
          stock_status: StockStatus;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          stock_quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          stock_status?: StockStatus;
          updated_at?: string;
        };
        Update: {
          stock_quantity?: number;
          reserved_quantity?: number;
          low_stock_threshold?: number;
          stock_status?: StockStatus;
          updated_at?: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          cart_type: CustomerType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          cart_type?: CustomerType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          session_id?: string | null;
          cart_type?: CustomerType;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          purchase_mode: "unit" | "box" | "custom";
          units_per_box: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_id: string;
          quantity: number;
          purchase_mode?: "unit" | "box" | "custom";
          units_per_box?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          purchase_mode?: "unit" | "box" | "custom";
          units_per_box?: number | null;
          updated_at?: string;
        };
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      wishlist_items: {
        Row: {
          id: string;
          wishlist_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_email: string;
          customer_type: CustomerType;
          status: OrderStatus;
          payment_status: PaymentStatus;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          shipping_amount: number;
          total: number;
          shipping_address: Json;
          billing_address: Json | null;
          notes: string | null;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          coupon_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_email: string;
          customer_type?: CustomerType;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          subtotal: number;
          discount_amount?: number;
          tax_amount?: number;
          shipping_amount?: number;
          total: number;
          shipping_address: Json;
          billing_address?: Json | null;
          notes?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          coupon_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          notes?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_snapshot: Json;
          sku_snapshot: string;
          price_snapshot: number;
          quantity: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_snapshot: Json;
          sku_snapshot: string;
          price_snapshot: number;
          quantity: number;
          line_total: number;
          combo_id?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      combo_offers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          description: string | null;
          features: Json;
          price: number;
          compare_at_price: number | null;
          tax_enabled: boolean;
          is_active: boolean;
          is_featured: boolean;
          primary_image_url: string | null;
          primary_image_public_id: string | null;
          images: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sku: string;
          description?: string | null;
          features?: Json;
          price: number;
          compare_at_price?: number | null;
          tax_enabled?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          primary_image_url?: string | null;
          primary_image_public_id?: string | null;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sku?: string;
          description?: string | null;
          features?: Json;
          price?: number;
          compare_at_price?: number | null;
          tax_enabled?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          primary_image_url?: string | null;
          primary_image_public_id?: string | null;
          images?: Json;
          updated_at?: string;
        };
      };
      combo_offer_items: {
        Row: {
          id: string;
          combo_id: string;
          product_id: string;
          quantity: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          combo_id: string;
          product_id: string;
          quantity: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          sort_order?: number;
        };
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string | null;
          full_name: string;
          phone: string | null;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string | null;
          full_name: string;
          phone?: string | null;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state?: string | null;
          postal_code?: string | null;
          country: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string | null;
          full_name?: string;
          phone?: string | null;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string | null;
          postal_code?: string | null;
          country?: string;
          is_default?: boolean;
          updated_at?: string;
        };
      };
      wholesale_applications: {
        Row: {
          id: string;
          user_id: string | null;
          business_name: string;
          contact_person: string;
          email: string;
          phone: string;
          country: string;
          business_type: string;
          expected_order_volume: string | null;
          trade_license_url: string | null;
          trade_license_public_id: string | null;
          notes: string | null;
          status: WholesaleApplicationStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          business_name: string;
          contact_person: string;
          email: string;
          phone: string;
          country: string;
          business_type: string;
          expected_order_volume?: string | null;
          trade_license_url?: string | null;
          trade_license_public_id?: string | null;
          notes?: string | null;
          status?: WholesaleApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: WholesaleApplicationStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          updated_at?: string;
        };
      };
      wholesale_enquiries: {
        Row: {
          id: string;
          company_name: string;
          contact_person: string;
          phone: string;
          email: string | null;
          whatsapp: string | null;
          category_name: string | null;
          product_name: string | null;
          quantity: string | null;
          message: string | null;
          notes: string | null;
          status: "pending" | "under_review" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_person: string;
          phone: string;
          email?: string | null;
          whatsapp?: string | null;
          category_name?: string | null;
          product_name?: string | null;
          quantity?: string | null;
          message?: string | null;
          notes?: string | null;
          status?: "pending" | "under_review" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_name?: string;
          contact_person?: string;
          phone?: string;
          email?: string | null;
          whatsapp?: string | null;
          category_name?: string | null;
          product_name?: string | null;
          quantity?: string | null;
          message?: string | null;
          notes?: string | null;
          status?: "pending" | "under_review" | "approved" | "rejected";
          updated_at?: string;
        };
      };
      banners: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          overline: string | null;
          image_url: string | null;
          image_public_id: string | null;
          mobile_image_url: string | null;
          mobile_image_public_id: string | null;
          product_image_url: string | null;
          product_image_public_id: string | null;
          link_url: string | null;
          link_text: string | null;
          position: string;
          sort_order: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          overline?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          mobile_image_url?: string | null;
          mobile_image_public_id?: string | null;
          product_image_url?: string | null;
          product_image_public_id?: string | null;
          link_url?: string | null;
          link_text?: string | null;
          position?: string;
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          overline?: string | null;
          image_url?: string | null;
          image_public_id?: string | null;
          mobile_image_url?: string | null;
          mobile_image_public_id?: string | null;
          product_image_url?: string | null;
          product_image_public_id?: string | null;
          link_url?: string | null;
          link_text?: string | null;
          position?: string;
          sort_order?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          updated_at?: string;
        };
      };
      homepage_sections: {
        Row: {
          id: string;
          section_key: string;
          title: string | null;
          subtitle: string | null;
          body: string | null;
          data: Json | null;
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_key: string;
          title?: string | null;
          subtitle?: string | null;
          body?: string | null;
          data?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          subtitle?: string | null;
          body?: string | null;
          data?: Json | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          value?: Json;
          updated_at?: string;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: DiscountType;
          discount_value: number;
          minimum_order_amount: number | null;
          maximum_discount_amount: number | null;
          usage_limit: number | null;
          usage_count: number;
          is_active: boolean;
          starts_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: DiscountType;
          discount_value: number;
          minimum_order_amount?: number | null;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          starts_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          discount_type?: DiscountType;
          discount_value?: number;
          minimum_order_amount?: number | null;
          maximum_discount_amount?: number | null;
          usage_limit?: number | null;
          usage_count?: number;
          is_active?: boolean;
          starts_at?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      coupon_redemptions: {
        Row: {
          id: string;
          coupon_id: string;
          order_id: string;
          user_id: string | null;
          discount_applied: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          order_id: string;
          user_id?: string | null;
          discount_applied: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          order_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          is_verified_purchase: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_verified_purchase?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number;
          title?: string | null;
          body?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          details: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          details?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_event_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_event_id?: string | null;
          amount: number;
          currency?: string;
          status: PaymentStatus;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_event_id?: string | null;
          status?: PaymentStatus;
          payment_method?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// ─── Enum Types ───────────────────────────────────────────────────────────────
export type UserRole =
  | "customer"
  | "wholesale_pending"
  | "wholesale_customer"
  | "admin"
  | "super_admin";

export type ProductStatus = "draft" | "published" | "archived";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "partially_refunded";

export type CustomerType = "retail" | "wholesale";

export type WholesaleApplicationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type DiscountType = "percentage" | "fixed";
