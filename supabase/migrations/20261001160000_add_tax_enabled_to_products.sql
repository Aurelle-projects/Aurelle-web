-- Migration: Add tax_enabled to products
-- Description: Adds a boolean flag to control whether retail tax applies to a product (default TRUE)

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN NOT NULL DEFAULT TRUE;
