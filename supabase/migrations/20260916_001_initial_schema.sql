-- ============================================================
-- AURELLE COSMETICS — INITIAL DATABASE SCHEMA
-- Migration: 20260916_001_initial_schema.sql
-- Apply via: Supabase Dashboard → SQL Editor
--            or: npx supabase db push
-- ============================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For trigram full-text search

-- ─── Custom Types / Enums ─────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'customer',
  'wholesale_pending',
  'wholesale_customer',
  'admin',
  'super_admin'
);

CREATE TYPE product_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE stock_status AS ENUM (
  'in_stock',
  'low_stock',
  'out_of_stock'
);

CREATE TYPE order_status AS ENUM (
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

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'expired',
  'refunded',
  'partially_refunded'
);

CREATE TYPE customer_type AS ENUM (
  'retail',
  'wholesale'
);

CREATE TYPE wholesale_application_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected'
);

CREATE TYPE discount_type AS ENUM (
  'percentage',
  'fixed'
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with additional fields
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  image_url           TEXT,
  image_public_id     TEXT,
  parent_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title           TEXT,
  seo_description     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BRANDS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  logo_url            TEXT,
  logo_public_id      TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  sku                     TEXT NOT NULL UNIQUE,
  brand_id                UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
  description             TEXT,
  benefits                TEXT,
  ingredients             TEXT,
  usage_instructions      TEXT,
  specifications          JSONB,
  retail_price            NUMERIC(10, 2) NOT NULL CHECK (retail_price >= 0),
  compare_at_price        NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  wholesale_price         NUMERIC(10, 2) CHECK (wholesale_price >= 0),
  wholesale_moq           INTEGER CHECK (wholesale_moq > 0),
  is_retail_available     BOOLEAN NOT NULL DEFAULT TRUE,
  is_wholesale_available  BOOLEAN NOT NULL DEFAULT FALSE,
  is_published            BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
  is_best_seller          BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival          BOOLEAN NOT NULL DEFAULT FALSE,
  status                  product_status NOT NULL DEFAULT 'draft',
  seo_title               TEXT,
  seo_description         TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_sale_price CHECK (
    compare_at_price IS NULL OR compare_at_price > retail_price
  ),
  CONSTRAINT wholesale_requires_price CHECK (
    NOT is_wholesale_available OR wholesale_price IS NOT NULL
  ),
  CONSTRAINT wholesale_requires_moq CHECK (
    NOT is_wholesale_available OR wholesale_moq IS NOT NULL
  )
);

-- ─── PRODUCT IMAGES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cloudinary_public_id  TEXT NOT NULL,
  secure_url            TEXT NOT NULL,
  width                 INTEGER,
  height                INTEGER,
  format                TEXT,
  alt_text              TEXT,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  is_primary            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one primary image per product
CREATE UNIQUE INDEX idx_product_images_primary
  ON product_images(product_id)
  WHERE is_primary = TRUE;

-- ─── WHOLESALE PRICE TIERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_price_tiers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_quantity    INTEGER NOT NULL CHECK (min_quantity > 0),
  max_quantity    INTEGER CHECK (max_quantity IS NULL OR max_quantity > min_quantity),
  price_per_unit  NUMERIC(10, 2) NOT NULL CHECK (price_per_unit >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INVENTORY ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  sku                   TEXT NOT NULL,
  stock_quantity        INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity     INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  low_stock_threshold   INTEGER NOT NULL DEFAULT 5,
  stock_status          stock_status NOT NULL DEFAULT 'out_of_stock',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Stock decrement RPC (atomic, prevents negative stock) ───────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ─── CARTS ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS carts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cart_has_owner CHECK (
    (user_id IS NOT NULL) OR (session_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS cart_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id     UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(cart_id, product_id)
);

-- ─── WISHLISTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id  UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(wishlist_id, product_id)
);

-- ─── ADDRESSES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label           TEXT,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            TEXT NOT NULL,
  state           TEXT,
  postal_code     TEXT,
  country         TEXT NOT NULL DEFAULT 'AE',
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COUPONS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                    TEXT NOT NULL UNIQUE,
  description             TEXT,
  discount_type           discount_type NOT NULL,
  discount_value          NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  minimum_order_amount    NUMERIC(10, 2),
  maximum_discount_amount NUMERIC(10, 2),
  usage_limit             INTEGER,
  usage_count             INTEGER NOT NULL DEFAULT 0,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at               TIMESTAMPTZ,
  expires_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number                  TEXT NOT NULL UNIQUE,
  user_id                       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_email                TEXT NOT NULL,
  customer_type                 customer_type NOT NULL DEFAULT 'retail',
  status                        order_status NOT NULL DEFAULT 'pending',
  payment_status                payment_status NOT NULL DEFAULT 'pending',
  subtotal                      NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax_amount                    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_amount               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total                         NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  shipping_address              JSONB NOT NULL,
  billing_address               JSONB,
  notes                         TEXT,
  stripe_checkout_session_id    TEXT UNIQUE,
  stripe_payment_intent_id      TEXT,
  coupon_id                     UUID REFERENCES coupons(id) ON DELETE SET NULL,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
-- product_snapshot stores the product state at time of purchase.
-- If product is later modified, historical orders are unaffected.
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  product_snapshot  JSONB NOT NULL,   -- Historical snapshot
  sku_snapshot      TEXT NOT NULL,    -- SKU at time of purchase
  price_snapshot    NUMERIC(10, 2) NOT NULL CHECK (price_snapshot >= 0),
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  line_total        NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  stripe_payment_intent_id      TEXT,
  stripe_checkout_session_id    TEXT,
  stripe_event_id               TEXT UNIQUE,  -- For idempotency
  amount                        INTEGER NOT NULL,  -- In fils (Stripe format)
  currency                      TEXT NOT NULL DEFAULT 'aed',
  status                        payment_status NOT NULL,
  payment_method                TEXT,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── COUPON REDEMPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id         UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  discount_applied  NUMERIC(10, 2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(coupon_id, order_id)
);

-- ─── WHOLESALE APPLICATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_applications (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_name           TEXT NOT NULL,
  contact_person          TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL,
  country                 TEXT NOT NULL,
  business_type           TEXT NOT NULL,
  expected_order_volume   TEXT,
  trade_license_url       TEXT,
  trade_license_public_id TEXT,
  notes                   TEXT,
  status                  wholesale_application_status NOT NULL DEFAULT 'pending',
  reviewed_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  rejection_reason        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id              UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating                INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 TEXT,
  body                  TEXT,
  is_verified_purchase  BOOLEAN NOT NULL DEFAULT FALSE,
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(product_id, user_id)  -- One review per product per user
);

-- ─── BANNERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS banners (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  subtitle          TEXT,
  image_url         TEXT,
  image_public_id   TEXT,
  link_url          TEXT,
  link_text         TEXT,
  position          TEXT NOT NULL DEFAULT 'hero',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── HOMEPAGE SECTIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homepage_sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_key   TEXT NOT NULL UNIQUE,
  title         TEXT,
  subtitle      TEXT,
  body          TEXT,
  data          JSONB,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SITE SETTINGS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  details         JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed default homepage sections ──────────────────────────────────────────
INSERT INTO homepage_sections (section_key, title, subtitle, is_active, sort_order) VALUES
  ('hero', 'EVERYDAY ESSENTIALS. ELEVATED.', 'Beauty, personal care and lifestyle essentials for everyone.', TRUE, 1),
  ('featured_categories', 'Shop by Category', NULL, TRUE, 2),
  ('new_arrivals', 'New Arrivals', 'Fresh additions to our collection.', TRUE, 3),
  ('best_sellers', 'Best Sellers', 'Our most loved products.', TRUE, 4),
  ('featured_products', 'Featured Products', NULL, TRUE, 5)
ON CONFLICT (section_key) DO NOTHING;

-- ─── Seed default site settings ──────────────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('contact_email', '"info@aurelle.ae"'),
  ('contact_phone', 'null'),
  ('contact_address', 'null'),
  ('social_instagram', 'null'),
  ('social_facebook', 'null'),
  ('social_tiktok', 'null'),
  ('social_linkedin', 'null'),
  ('shipping_info', '"Free shipping on orders above AED 150."'),
  ('returns_info', '"30-day return policy on unused items."'),
  ('currency', '"AED"'),
  ('tax_rate', '0'),
  ('announcement_bar', 'null'),
  ('announcement_bar_active', 'false')
ON CONFLICT (key) DO NOTHING;

-- ─── Seed default categories ─────────────────────────────────────────────────
INSERT INTO categories (name, slug, description, sort_order, is_active) VALUES
  ('Cosmetics & Makeup', 'cosmetics-makeup', 'Makeup, lip care, foundation, concealer, eye makeup and beauty tools.', 1, TRUE),
  ('Skincare & Body Care', 'skincare-body-care', 'Face wash, moisturizers, creams, lotions, serums, sunscreen and body care.', 2, TRUE),
  ('Hair Care', 'hair-care', 'Shampoo, conditioner, hair oils, treatments and styling products.', 3, TRUE),
  ('Personal Care & Hygiene', 'personal-care', 'Soaps, shower gels, oral care, shaving, deodorants and hygiene products.', 4, TRUE),
  ('Baby Care', 'baby-care', 'Baby toiletries, lotions, shampoos, diapers and grooming accessories.', 5, TRUE),
  ('Health & Wellness', 'health-wellness', 'Wellness products, vapor rubs, balms, heat patches and healthcare accessories.', 6, TRUE),
  ('Grooming & Beauty Accessories', 'grooming-accessories', 'Combs, brushes, mirrors, manicure items and cosmetic organizers.', 7, TRUE),
  ('Household & Lifestyle', 'household-lifestyle', 'Household essentials, cleaning accessories, storage and travel items.', 8, TRUE),
  ('Perfumes & Fragrances', 'perfumes-fragrances', 'Perfumes, fragrances, body sprays, deodorants and fragrance sets.', 9, TRUE),
  ('General Consumer Goods', 'general-goods', 'Gift items, everyday-use products and other consumer goods.', 10, TRUE)
ON CONFLICT (slug) DO NOTHING;
