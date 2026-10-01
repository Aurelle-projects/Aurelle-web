-- ============================================================
-- AURELLE COSMETICS — WHOLESALE PACKAGING & PRICING CONFIGURATION
-- Migration: 20260930153000_wholesale_packaging.sql
-- ============================================================

-- 1. PRODUCTS: Add wholesale purchasing fields
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS wholesale_unit_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wholesale_unit_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS wholesale_box_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wholesale_units_per_box INTEGER,
  ADD COLUMN IF NOT EXISTS wholesale_box_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS wholesale_custom_quantity_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- Populate wholesale_unit_price from wholesale_price for existing rows
UPDATE products 
SET wholesale_unit_price = wholesale_price 
WHERE wholesale_unit_price IS NULL AND wholesale_price IS NOT NULL;

-- Remove legacy constraints that blocked box-only or custom-only products
ALTER TABLE products DROP CONSTRAINT IF EXISTS wholesale_requires_price;
ALTER TABLE products DROP CONSTRAINT IF EXISTS wholesale_requires_moq;

-- Add flexible packaging constraint for wholesale products
ALTER TABLE products DROP CONSTRAINT IF EXISTS wholesale_packaging_check;
ALTER TABLE products ADD CONSTRAINT wholesale_packaging_check CHECK (
  NOT is_wholesale_available OR (
    (wholesale_unit_enabled = TRUE AND wholesale_unit_price IS NOT NULL) OR
    (wholesale_box_enabled = TRUE AND wholesale_box_price IS NOT NULL AND wholesale_units_per_box IS NOT NULL AND wholesale_units_per_box > 0) OR
    (wholesale_custom_quantity_enabled = TRUE AND (wholesale_unit_price IS NOT NULL OR wholesale_box_price IS NOT NULL))
  )
);

-- 2. CARTS: Add cart_type to distinguish retail vs wholesale carts
ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS cart_type customer_type NOT NULL DEFAULT 'retail';

-- 3. CART_ITEMS: Add purchase_mode and units_per_box
ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS purchase_mode TEXT NOT NULL DEFAULT 'unit',
  ADD COLUMN IF NOT EXISTS units_per_box INTEGER;

-- Update unique constraint on cart_items to allow different purchase modes for same product in cart
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_purchase_mode_key;
ALTER TABLE cart_items ADD CONSTRAINT cart_items_cart_id_product_id_purchase_mode_key UNIQUE (cart_id, product_id, purchase_mode);
