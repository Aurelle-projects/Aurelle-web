-- ============================================================
-- AURELLE COSMETICS — ROW LEVEL SECURITY POLICIES
-- Migration: 20260916_002_rls_policies.sql
-- ============================================================

-- ─── Enable RLS on all tables ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wholesale_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─── Helper functions ────────────────────────────────────────────────────────

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Check if current user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
$$;

-- Check if current user is approved wholesale customer
CREATE OR REPLACE FUNCTION is_wholesale_customer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'wholesale_customer'
  );
$$;

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- Users can read/update their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent users from changing their own role
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

-- Admins can update any profile (for role management)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
-- Public: anyone can read active categories
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (is_active = TRUE);

-- Admins: full access
CREATE POLICY "categories_all_admin" ON categories
  FOR ALL USING (is_admin());

-- ─── BRANDS ──────────────────────────────────────────────────────────────────
CREATE POLICY "brands_select_public" ON brands
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "brands_all_admin" ON brands
  FOR ALL USING (is_admin());

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────
-- Public: only published products
-- NOTE: wholesale_price column is filtered by the application layer,
-- not exposed to public via direct SELECT.
-- Server-side services must enforce authorization before returning price fields.
CREATE POLICY "products_select_published" ON products
  FOR SELECT USING (is_published = TRUE AND status = 'published');

-- Admins: full access
CREATE POLICY "products_all_admin" ON products
  FOR ALL USING (is_admin());

-- ─── PRODUCT IMAGES ──────────────────────────────────────────────────────────
-- Public: images for published products
CREATE POLICY "product_images_select_public" ON product_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE id = product_id
      AND is_published = TRUE
      AND status = 'published'
    )
  );

CREATE POLICY "product_images_all_admin" ON product_images
  FOR ALL USING (is_admin());

-- ─── WHOLESALE PRICE TIERS ────────────────────────────────────────────────────
-- Only approved wholesale customers can see tiers
CREATE POLICY "wholesale_tiers_select_wholesale" ON wholesale_price_tiers
  FOR SELECT USING (is_wholesale_customer());

-- Admins: full access
CREATE POLICY "wholesale_tiers_all_admin" ON wholesale_price_tiers
  FOR ALL USING (is_admin());

-- ─── INVENTORY ───────────────────────────────────────────────────────────────
-- Public: stock_status only (not full quantity — prevent gaming)
CREATE POLICY "inventory_select_public" ON inventory
  FOR SELECT USING (TRUE);

-- Admins: full access
CREATE POLICY "inventory_all_admin" ON inventory
  FOR ALL USING (is_admin());

-- ─── CARTS ───────────────────────────────────────────────────────────────────
CREATE POLICY "carts_select_own" ON carts
  FOR SELECT USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "carts_insert_own" ON carts
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "carts_update_own" ON carts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "carts_delete_own" ON carts
  FOR DELETE USING (user_id = auth.uid());

-- ─── CART ITEMS ──────────────────────────────────────────────────────────────
CREATE POLICY "cart_items_select_own" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "cart_items_insert_own" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

CREATE POLICY "cart_items_update_own" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "cart_items_delete_own" ON cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id
      AND (user_id = auth.uid() OR user_id IS NULL)
    )
  );

-- ─── WISHLISTS ───────────────────────────────────────────────────────────────
CREATE POLICY "wishlists_select_own" ON wishlists
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "wishlists_insert_own" ON wishlists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_delete_own" ON wishlists
  FOR DELETE USING (user_id = auth.uid());

-- ─── WISHLIST ITEMS ──────────────────────────────────────────────────────────
CREATE POLICY "wishlist_items_select_own" ON wishlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_insert_own" ON wishlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "wishlist_items_delete_own" ON wishlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wishlists WHERE id = wishlist_id AND user_id = auth.uid()
    )
  );

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────
CREATE POLICY "addresses_select_own" ON addresses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "addresses_insert_own" ON addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "addresses_update_own" ON addresses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "addresses_delete_own" ON addresses
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "addresses_select_admin" ON addresses
  FOR SELECT USING (is_admin());

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
-- Users can only see their own orders
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (user_id = auth.uid());

-- Orders can only be inserted server-side (service role / admin)
-- No direct user insert policy — checkout API uses service role
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (is_admin());

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

-- ─── ORDER ITEMS ─────────────────────────────────────────────────────────────
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (is_admin());

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
-- Payments are managed server-side only
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "payments_all_admin" ON payments
  FOR ALL USING (is_admin());

-- ─── COUPONS ─────────────────────────────────────────────────────────────────
-- Public: only active, non-expired coupons (code validation handled server-side)
CREATE POLICY "coupons_select_admin" ON coupons
  FOR SELECT USING (is_admin());

CREATE POLICY "coupons_all_admin" ON coupons
  FOR ALL USING (is_admin());

-- ─── COUPON REDEMPTIONS ──────────────────────────────────────────────────────
CREATE POLICY "coupon_redemptions_select_own" ON coupon_redemptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "coupon_redemptions_all_admin" ON coupon_redemptions
  FOR ALL USING (is_admin());

-- ─── WHOLESALE APPLICATIONS ──────────────────────────────────────────────────
-- Users can read their own applications
CREATE POLICY "wholesale_apps_select_own" ON wholesale_applications
  FOR SELECT USING (user_id = auth.uid());

-- Users can create applications
CREATE POLICY "wholesale_apps_insert_own" ON wholesale_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins: full access
CREATE POLICY "wholesale_apps_all_admin" ON wholesale_applications
  FOR ALL USING (is_admin());

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
-- Public: only published reviews
CREATE POLICY "reviews_select_published" ON reviews
  FOR SELECT USING (is_published = TRUE);

-- Users can see their own reviews (including unpublished)
CREATE POLICY "reviews_select_own" ON reviews
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert reviews for products they purchased
CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND is_published = FALSE);

-- Admins: full access
CREATE POLICY "reviews_all_admin" ON reviews
  FOR ALL USING (is_admin());

-- ─── BANNERS ─────────────────────────────────────────────────────────────────
CREATE POLICY "banners_select_active" ON banners
  FOR SELECT USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

CREATE POLICY "banners_all_admin" ON banners
  FOR ALL USING (is_admin());

-- ─── HOMEPAGE SECTIONS ───────────────────────────────────────────────────────
CREATE POLICY "homepage_sections_select_active" ON homepage_sections
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "homepage_sections_all_admin" ON homepage_sections
  FOR ALL USING (is_admin());

-- ─── SITE SETTINGS ───────────────────────────────────────────────────────────
-- Public can read non-sensitive settings
CREATE POLICY "site_settings_select_public" ON site_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "site_settings_all_admin" ON site_settings
  FOR ALL USING (is_admin());

-- ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_logs_insert_admin" ON audit_logs
  FOR INSERT WITH CHECK (is_admin());
