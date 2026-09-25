-- ============================================================
-- AURELLE — ADD WHOLESALE FLAG TO CATEGORIES AND BRANDS
-- Migration: 20260924_011_add_wholesale_to_categories_and_brands.sql
-- Enables admin to toggle category and brand visibility for Wholesale storefront
-- ============================================================

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE brands 
ADD COLUMN IF NOT EXISTS is_wholesale BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_categories_is_wholesale ON categories(is_wholesale) WHERE is_wholesale = TRUE;
CREATE INDEX IF NOT EXISTS idx_brands_is_wholesale ON brands(is_wholesale) WHERE is_wholesale = TRUE;
