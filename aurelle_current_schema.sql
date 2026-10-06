


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."customer_type" AS ENUM (
    'retail',
    'wholesale'
);


ALTER TYPE "public"."customer_type" OWNER TO "postgres";


CREATE TYPE "public"."discount_type" AS ENUM (
    'percentage',
    'fixed'
);


ALTER TYPE "public"."discount_type" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'awaiting_payment',
    'paid',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'partially_refunded'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'expired',
    'refunded',
    'partially_refunded'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."product_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."product_status" OWNER TO "postgres";


CREATE TYPE "public"."stock_status" AS ENUM (
    'in_stock',
    'low_stock',
    'out_of_stock'
);


ALTER TYPE "public"."stock_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'customer',
    'wholesale_pending',
    'wholesale_customer',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."wholesale_application_status" AS ENUM (
    'pending',
    'under_review',
    'approved',
    'rejected'
);


ALTER TYPE "public"."wholesale_application_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_current_stock INTEGER;
  v_threshold INTEGER;
BEGIN
  SELECT stock_quantity, low_stock_threshold
  INTO v_current_stock, v_threshold
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE;  -- Lock the row

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;

  UPDATE inventory
  SET
    stock_quantity = stock_quantity - p_quantity,
    stock_status = CASE
      WHEN (stock_quantity - p_quantity) <= 0 THEN 'out_of_stock'::stock_status
      WHEN (stock_quantity - p_quantity) <= low_stock_threshold THEN 'low_stock'::stock_status
      ELSE 'in_stock'::stock_status
    END,
    updated_at = NOW()
  WHERE product_id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_wholesale_customer"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'wholesale_customer'
  );
$$;


ALTER FUNCTION "public"."is_wholesale_customer"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text",
    "full_name" "text" NOT NULL,
    "phone" "text",
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'AE'::"text" NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid",
    "details" "jsonb",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."banners" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "image_url" "text",
    "image_public_id" "text",
    "link_url" "text",
    "link_text" "text",
    "position" "text" DEFAULT 'hero'::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "logo_public_id" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cart_has_owner" CHECK ((("user_id" IS NOT NULL) OR ("session_id" IS NOT NULL)))
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "image_public_id" "text",
    "parent_id" "uuid",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "seo_title" "text",
    "seo_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_redemptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "discount_applied" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coupon_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "public"."discount_type" NOT NULL,
    "discount_value" numeric(10,2) NOT NULL,
    "minimum_order_amount" numeric(10,2),
    "maximum_discount_amount" numeric(10,2),
    "usage_limit" integer,
    "usage_count" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "coupons_discount_value_check" CHECK (("discount_value" > (0)::numeric))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homepage_sections" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "section_key" "text" NOT NULL,
    "title" "text",
    "subtitle" "text",
    "body" "text",
    "data" "jsonb",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."homepage_sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku" "text" NOT NULL,
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "reserved_quantity" integer DEFAULT 0 NOT NULL,
    "low_stock_threshold" integer DEFAULT 5 NOT NULL,
    "stock_status" "public"."stock_status" DEFAULT 'out_of_stock'::"public"."stock_status" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_reserved_quantity_check" CHECK (("reserved_quantity" >= 0)),
    CONSTRAINT "inventory_stock_quantity_check" CHECK (("stock_quantity" >= 0))
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_snapshot" "jsonb" NOT NULL,
    "sku_snapshot" "text" NOT NULL,
    "price_snapshot" numeric(10,2) NOT NULL,
    "quantity" integer NOT NULL,
    "line_total" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "order_items_line_total_check" CHECK (("line_total" >= (0)::numeric)),
    CONSTRAINT "order_items_price_snapshot_check" CHECK (("price_snapshot" >= (0)::numeric)),
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_number" "text" NOT NULL,
    "user_id" "uuid",
    "customer_email" "text" NOT NULL,
    "customer_type" "public"."customer_type" DEFAULT 'retail'::"public"."customer_type" NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "payment_status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "discount_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "shipping_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total" numeric(10,2) NOT NULL,
    "shipping_address" "jsonb" NOT NULL,
    "billing_address" "jsonb",
    "notes" "text",
    "stripe_checkout_session_id" "text",
    "stripe_payment_intent_id" "text",
    "coupon_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "orders_total_check" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "stripe_payment_intent_id" "text",
    "stripe_checkout_session_id" "text",
    "stripe_event_id" "text",
    "amount" integer NOT NULL,
    "currency" "text" DEFAULT 'aed'::"text" NOT NULL,
    "status" "public"."payment_status" NOT NULL,
    "payment_method" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "cloudinary_public_id" "text" NOT NULL,
    "secure_url" "text" NOT NULL,
    "width" integer,
    "height" integer,
    "format" "text",
    "alt_text" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "sku" "text" NOT NULL,
    "brand_id" "uuid",
    "category_id" "uuid",
    "description" "text",
    "benefits" "text",
    "ingredients" "text",
    "usage_instructions" "text",
    "specifications" "jsonb",
    "retail_price" numeric(10,2) NOT NULL,
    "compare_at_price" numeric(10,2),
    "wholesale_price" numeric(10,2),
    "wholesale_moq" integer,
    "is_retail_available" boolean DEFAULT true NOT NULL,
    "is_wholesale_available" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "is_best_seller" boolean DEFAULT false NOT NULL,
    "is_new_arrival" boolean DEFAULT false NOT NULL,
    "status" "public"."product_status" DEFAULT 'draft'::"public"."product_status" NOT NULL,
    "seo_title" "text",
    "seo_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subcategory_id" "uuid",
    CONSTRAINT "products_compare_at_price_check" CHECK (("compare_at_price" >= (0)::numeric)),
    CONSTRAINT "products_retail_price_check" CHECK (("retail_price" >= (0)::numeric)),
    CONSTRAINT "products_wholesale_moq_check" CHECK (("wholesale_moq" > 0)),
    CONSTRAINT "products_wholesale_price_check" CHECK (("wholesale_price" >= (0)::numeric)),
    CONSTRAINT "valid_sale_price" CHECK ((("compare_at_price" IS NULL) OR ("compare_at_price" > "retail_price"))),
    CONSTRAINT "wholesale_requires_moq" CHECK (((NOT "is_wholesale_available") OR ("wholesale_moq" IS NOT NULL))),
    CONSTRAINT "wholesale_requires_price" CHECK (((NOT "is_wholesale_available") OR ("wholesale_price" IS NOT NULL)))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "role" "public"."user_role" DEFAULT 'customer'::"public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "title" "text",
    "body" "text",
    "is_verified_purchase" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "image_public_id" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wholesale_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "business_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "country" "text" NOT NULL,
    "business_type" "text" NOT NULL,
    "expected_order_volume" "text",
    "trade_license_url" "text",
    "trade_license_public_id" "text",
    "notes" "text",
    "status" "public"."wholesale_application_status" DEFAULT 'pending'::"public"."wholesale_application_status" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wholesale_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wholesale_price_tiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "min_quantity" integer NOT NULL,
    "max_quantity" integer,
    "price_per_unit" numeric(10,2) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wholesale_price_tiers_check" CHECK ((("max_quantity" IS NULL) OR ("max_quantity" > "min_quantity"))),
    CONSTRAINT "wholesale_price_tiers_min_quantity_check" CHECK (("min_quantity" > 0)),
    CONSTRAINT "wholesale_price_tiers_price_per_unit_check" CHECK (("price_per_unit" >= (0)::numeric))
);


ALTER TABLE "public"."wholesale_price_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wishlist_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wishlist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banners"
    ADD CONSTRAINT "banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_product_id_key" UNIQUE ("cart_id", "product_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_coupon_id_order_id_key" UNIQUE ("coupon_id", "order_id");



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homepage_sections"
    ADD CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homepage_sections"
    ADD CONSTRAINT "homepage_sections_section_key_key" UNIQUE ("section_key");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_stripe_checkout_session_id_key" UNIQUE ("stripe_checkout_session_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_stripe_event_id_key" UNIQUE ("stripe_event_id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_user_id_key" UNIQUE ("product_id", "user_id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."wholesale_applications"
    ADD CONSTRAINT "wholesale_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wholesale_price_tiers"
    ADD CONSTRAINT "wholesale_price_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_wishlist_id_product_id_key" UNIQUE ("wishlist_id", "product_id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_addresses_user_id" ON "public"."addresses" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_admin_id" ON "public"."audit_logs" USING "btree" ("admin_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_resource_type" ON "public"."audit_logs" USING "btree" ("resource_type");



CREATE INDEX "idx_banners_is_active" ON "public"."banners" USING "btree" ("is_active");



CREATE INDEX "idx_banners_position" ON "public"."banners" USING "btree" ("position", "is_active", "sort_order");



CREATE INDEX "idx_brands_is_active" ON "public"."brands" USING "btree" ("is_active");



CREATE INDEX "idx_brands_slug" ON "public"."brands" USING "btree" ("slug");



CREATE INDEX "idx_brands_sort_order" ON "public"."brands" USING "btree" ("sort_order");



CREATE INDEX "idx_cart_items_cart_id" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "idx_cart_items_product_id" ON "public"."cart_items" USING "btree" ("product_id");



CREATE INDEX "idx_carts_session_id" ON "public"."carts" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_carts_user_id" ON "public"."carts" USING "btree" ("user_id");



CREATE INDEX "idx_categories_is_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_categories_parent_id" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_slug" ON "public"."categories" USING "btree" ("slug");



CREATE INDEX "idx_categories_sort" ON "public"."categories" USING "btree" ("sort_order");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_is_active" ON "public"."coupons" USING "btree" ("is_active");



CREATE INDEX "idx_inventory_low_stock" ON "public"."inventory" USING "btree" ("stock_quantity", "low_stock_threshold") WHERE ("stock_status" = ANY (ARRAY['low_stock'::"public"."stock_status", 'out_of_stock'::"public"."stock_status"]));



CREATE INDEX "idx_inventory_product_id" ON "public"."inventory" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_stock_status" ON "public"."inventory" USING "btree" ("stock_status");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_customer_email" ON "public"."orders" USING "btree" ("customer_email");



CREATE INDEX "idx_orders_customer_type" ON "public"."orders" USING "btree" ("customer_type");



CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");



CREATE INDEX "idx_orders_payment_status" ON "public"."orders" USING "btree" ("payment_status");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_stripe_session" ON "public"."orders" USING "btree" ("stripe_checkout_session_id") WHERE ("stripe_checkout_session_id" IS NOT NULL);



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_payments_order_id" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_stripe_event_id" ON "public"."payments" USING "btree" ("stripe_event_id") WHERE ("stripe_event_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_product_images_primary" ON "public"."product_images" USING "btree" ("product_id") WHERE ("is_primary" = true);



CREATE INDEX "idx_product_images_product_id" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_product_images_sort" ON "public"."product_images" USING "btree" ("product_id", "sort_order");



CREATE INDEX "idx_products_brand_id" ON "public"."products" USING "btree" ("brand_id");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_products_is_best_seller" ON "public"."products" USING "btree" ("is_best_seller") WHERE ("is_best_seller" = true);



CREATE INDEX "idx_products_is_featured" ON "public"."products" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_products_is_new_arrival" ON "public"."products" USING "btree" ("is_new_arrival") WHERE ("is_new_arrival" = true);



CREATE INDEX "idx_products_is_published" ON "public"."products" USING "btree" ("is_published");



CREATE INDEX "idx_products_is_wholesale" ON "public"."products" USING "btree" ("is_wholesale_available") WHERE ("is_wholesale_available" = true);



CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_retail_price" ON "public"."products" USING "btree" ("retail_price");



CREATE INDEX "idx_products_search" ON "public"."products" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("sku", ''::"text")) || ' '::"text") || COALESCE("description", ''::"text"))));



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku");



CREATE INDEX "idx_products_sku_trgm" ON "public"."products" USING "gin" ("sku" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_slug" ON "public"."products" USING "btree" ("slug");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_reviews_is_published" ON "public"."reviews" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_reviews_product_id" ON "public"."reviews" USING "btree" ("product_id");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_subcategories_category_id" ON "public"."subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_subcategories_is_active" ON "public"."subcategories" USING "btree" ("is_active");



CREATE INDEX "idx_subcategories_slug" ON "public"."subcategories" USING "btree" ("slug");



CREATE INDEX "idx_wholesale_apps_created" ON "public"."wholesale_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_wholesale_apps_status" ON "public"."wholesale_applications" USING "btree" ("status");



CREATE INDEX "idx_wholesale_apps_user_id" ON "public"."wholesale_applications" USING "btree" ("user_id");



CREATE INDEX "idx_wholesale_tiers_active" ON "public"."wholesale_price_tiers" USING "btree" ("product_id", "is_active");



CREATE INDEX "idx_wholesale_tiers_product_id" ON "public"."wholesale_price_tiers" USING "btree" ("product_id");



CREATE INDEX "idx_wishlist_items_product_id" ON "public"."wishlist_items" USING "btree" ("product_id");



CREATE INDEX "idx_wishlist_items_wishlist_id" ON "public"."wishlist_items" USING "btree" ("wishlist_id");



CREATE INDEX "idx_wishlists_user_id" ON "public"."wishlists" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wholesale_applications"
    ADD CONSTRAINT "wholesale_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wholesale_applications"
    ADD CONSTRAINT "wholesale_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wholesale_price_tiers"
    ADD CONSTRAINT "wholesale_price_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist_items"
    ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "addresses_delete_own" ON "public"."addresses" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "addresses_insert_own" ON "public"."addresses" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "addresses_select_admin" ON "public"."addresses" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "addresses_select_own" ON "public"."addresses" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "addresses_update_own" ON "public"."addresses" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_insert_admin" ON "public"."audit_logs" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "audit_logs_select_admin" ON "public"."audit_logs" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."banners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "banners_all_admin" ON "public"."banners" USING ("public"."is_admin"());



CREATE POLICY "banners_select_active" ON "public"."banners" FOR SELECT USING ((("is_active" = true) AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));



ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "brands_all_admin" ON "public"."brands" USING ("public"."is_admin"());



CREATE POLICY "brands_read_all" ON "public"."brands" FOR SELECT USING (true);



CREATE POLICY "brands_write_all" ON "public"."brands" USING (true) WITH CHECK (true);



ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cart_items_delete_own" ON "public"."cart_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = "auth"."uid"()) OR ("carts"."user_id" IS NULL))))));



CREATE POLICY "cart_items_insert_own" ON "public"."cart_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = "auth"."uid"()) OR ("carts"."user_id" IS NULL))))));



CREATE POLICY "cart_items_select_own" ON "public"."cart_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND (("carts"."user_id" = "auth"."uid"()) OR ("carts"."user_id" IS NULL))))));



CREATE POLICY "cart_items_update_own" ON "public"."cart_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."carts"
  WHERE (("carts"."id" = "cart_items"."cart_id") AND ("carts"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "carts_delete_own" ON "public"."carts" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "carts_insert_own" ON "public"."carts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "carts_select_own" ON "public"."carts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("session_id" IS NOT NULL)));



CREATE POLICY "carts_update_own" ON "public"."carts" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_all_admin" ON "public"."categories" USING ("public"."is_admin"());



CREATE POLICY "categories_select_public" ON "public"."categories" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."coupon_redemptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupon_redemptions_all_admin" ON "public"."coupon_redemptions" USING ("public"."is_admin"());



CREATE POLICY "coupon_redemptions_select_own" ON "public"."coupon_redemptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "coupons_all_admin" ON "public"."coupons" USING ("public"."is_admin"());



CREATE POLICY "coupons_select_admin" ON "public"."coupons" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."homepage_sections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "homepage_sections_all_admin" ON "public"."homepage_sections" USING ("public"."is_admin"());



CREATE POLICY "homepage_sections_select_active" ON "public"."homepage_sections" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_all_admin" ON "public"."inventory" USING ("public"."is_admin"());



CREATE POLICY "inventory_select_public" ON "public"."inventory" FOR SELECT USING (true);



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_select_admin" ON "public"."order_items" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "order_items_select_own" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_select_admin" ON "public"."orders" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "orders_select_own" ON "public"."orders" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "orders_update_admin" ON "public"."orders" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payments_all_admin" ON "public"."payments" USING ("public"."is_admin"());



CREATE POLICY "payments_select_own" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "payments"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_images_all_admin" ON "public"."product_images" USING ("public"."is_admin"());



CREATE POLICY "product_images_select_public" ON "public"."product_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."products"
  WHERE (("products"."id" = "product_images"."product_id") AND ("products"."is_published" = true) AND ("products"."status" = 'published'::"public"."product_status")))));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_all_admin" ON "public"."products" USING ("public"."is_admin"());



CREATE POLICY "products_select_published" ON "public"."products" FOR SELECT USING ((("is_published" = true) AND ("status" = 'published'::"public"."product_status")));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_admin" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_admin" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK ((("id" = "auth"."uid"()) AND ("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())))));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_all_admin" ON "public"."reviews" USING ("public"."is_admin"());



CREATE POLICY "reviews_insert_own" ON "public"."reviews" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "reviews_select_own" ON "public"."reviews" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "reviews_select_published" ON "public"."reviews" FOR SELECT USING (("is_published" = true));



CREATE POLICY "reviews_update_own" ON "public"."reviews" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK ((("user_id" = "auth"."uid"()) AND ("is_published" = false)));



ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "site_settings_all_admin" ON "public"."site_settings" USING ("public"."is_admin"());



CREATE POLICY "site_settings_select_public" ON "public"."site_settings" FOR SELECT USING (true);



ALTER TABLE "public"."subcategories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subcategories_all_admin" ON "public"."subcategories" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



CREATE POLICY "subcategories_select_public" ON "public"."subcategories" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."wholesale_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wholesale_apps_all_admin" ON "public"."wholesale_applications" USING ("public"."is_admin"());



CREATE POLICY "wholesale_apps_insert_own" ON "public"."wholesale_applications" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "wholesale_apps_select_own" ON "public"."wholesale_applications" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."wholesale_price_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wholesale_tiers_all_admin" ON "public"."wholesale_price_tiers" USING ("public"."is_admin"());



CREATE POLICY "wholesale_tiers_select_wholesale" ON "public"."wholesale_price_tiers" FOR SELECT USING ("public"."is_wholesale_customer"());



ALTER TABLE "public"."wishlist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlist_items_delete_own" ON "public"."wishlist_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_items"."wishlist_id") AND ("wishlists"."user_id" = "auth"."uid"())))));



CREATE POLICY "wishlist_items_insert_own" ON "public"."wishlist_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_items"."wishlist_id") AND ("wishlists"."user_id" = "auth"."uid"())))));



CREATE POLICY "wishlist_items_select_own" ON "public"."wishlist_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."wishlists"
  WHERE (("wishlists"."id" = "wishlist_items"."wishlist_id") AND ("wishlists"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "wishlists_delete_own" ON "public"."wishlists" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "wishlists_insert_own" ON "public"."wishlists" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "wishlists_select_own" ON "public"."wishlists" FOR SELECT USING (("user_id" = "auth"."uid"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_stock"("p_product_id" "uuid", "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_wholesale_customer"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_wholesale_customer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_wholesale_customer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."banners" TO "anon";
GRANT ALL ON TABLE "public"."banners" TO "authenticated";
GRANT ALL ON TABLE "public"."banners" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."coupon_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."homepage_sections" TO "anon";
GRANT ALL ON TABLE "public"."homepage_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."homepage_sections" TO "service_role";



GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."wholesale_applications" TO "anon";
GRANT ALL ON TABLE "public"."wholesale_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."wholesale_applications" TO "service_role";



GRANT ALL ON TABLE "public"."wholesale_price_tiers" TO "anon";
GRANT ALL ON TABLE "public"."wholesale_price_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."wholesale_price_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist_items" TO "anon";
GRANT ALL ON TABLE "public"."wishlist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist_items" TO "service_role";



GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































