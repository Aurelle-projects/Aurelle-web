-- ============================================================
-- AURELLE COSMETICS — DATABASE INDEXES
-- Migration: 20260916_003_indexes.sql
-- All indexes for query performance on production workloads.
-- ============================================================

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_slug          ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku           ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id      ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_is_published  ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_status        ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured   ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_best_seller ON products(is_best_seller) WHERE is_best_seller = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_retail_price  ON products(retail_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at    ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_wholesale  ON products(is_wholesale_available) WHERE is_wholesale_available = TRUE;

-- Full-text search index on products
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products
  USING GIN (
    to_tsvector('english',
      COALESCE(name, '') || ' ' ||
      COALESCE(sku, '') || ' ' ||
      COALESCE(description, '')
    )
  );

-- Trigram index for ILIKE search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products USING GIN (sku gin_trgm_ops);

-- ─── PRODUCT IMAGES ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort       ON product_images(product_id, sort_order);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort      ON categories(sort_order);

-- ─── BRANDS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_brands_slug      ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands(is_active);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_product_id   ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_status ON inventory(stock_status);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
  ON inventory(stock_quantity, low_stock_threshold)
  WHERE stock_status IN ('low_stock', 'out_of_stock');

-- ─── CARTS ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_carts_user_id    ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id) WHERE session_id IS NOT NULL;

-- ─── CART ITEMS ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id    ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ─── WISHLISTS ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id          ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id  ON wishlist_items(product_id);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id               ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status        ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_type         ON orders(customer_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at            ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session        ON orders(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number          ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email        ON orders(customer_email);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_order_id          ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_event_id   ON payments(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ─── WHOLESALE APPLICATIONS ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wholesale_apps_user_id ON wholesale_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_apps_status  ON wholesale_applications(status);
CREATE INDEX IF NOT EXISTS idx_wholesale_apps_created ON wholesale_applications(created_at DESC);

-- ─── WHOLESALE PRICE TIERS ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_wholesale_tiers_product_id ON wholesale_price_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_wholesale_tiers_active     ON wholesale_price_tiers(product_id, is_active);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product_id   ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id      ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_published ON reviews(is_published) WHERE is_published = TRUE;

-- ─── BANNERS ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_banners_position  ON banners(position, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);

-- ─── COUPONS ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id      ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);

-- ─── PROFILES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
