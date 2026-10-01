-- Migration: Add manual is_out_of_stock boolean to products and combo_offers
-- Description: Aurelle does not track inventory counts. Product & combo availability is controlled via manual out-of-stock flags.

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.combo_offers
ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN NOT NULL DEFAULT FALSE;

-- Add indexes for availability queries
CREATE INDEX IF NOT EXISTS idx_products_is_out_of_stock ON public.products(is_out_of_stock);
CREATE INDEX IF NOT EXISTS idx_combo_offers_is_out_of_stock ON public.combo_offers(is_out_of_stock);
