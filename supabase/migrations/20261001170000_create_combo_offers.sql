-- Migration: Create Combo Offers & Combo Offer Items Tables
-- Description: Retail-only combo offers composed of multiple catalog products with independent pricing, tax settings, media, and inventory mapping.

-- 1. Create combo_offers table
CREATE TABLE IF NOT EXISTS public.combo_offers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  sku                     TEXT NOT NULL UNIQUE,
  description             TEXT,
  features                JSONB DEFAULT '[]'::jsonb,
  price                   NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price        NUMERIC(10, 2) CHECK (compare_at_price >= 0),
  tax_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
  primary_image_url       TEXT,
  primary_image_public_id TEXT,
  images                  JSONB DEFAULT '[]'::jsonb,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create combo_offer_items table
CREATE TABLE IF NOT EXISTS public.combo_offer_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combo_id    UUID NOT NULL REFERENCES public.combo_offers(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(combo_id, product_id)
);

-- 3. Add combo_id to order_items if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'order_items'
    AND column_name = 'combo_id'
  ) THEN
    ALTER TABLE public.order_items
    ADD COLUMN combo_id UUID REFERENCES public.combo_offers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_combo_offers_slug ON public.combo_offers(slug);
CREATE INDEX IF NOT EXISTS idx_combo_offers_sku ON public.combo_offers(sku);
CREATE INDEX IF NOT EXISTS idx_combo_offers_active ON public.combo_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_combo_offers_featured ON public.combo_offers(is_featured);
CREATE INDEX IF NOT EXISTS idx_combo_offer_items_combo ON public.combo_offer_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_offer_items_product ON public.combo_offer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_combo ON public.order_items(combo_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.combo_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_offer_items ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for combo_offers
-- Public can view active combos
DROP POLICY IF EXISTS "Public can view active combo offers" ON public.combo_offers;
CREATE POLICY "Public can view active combo offers"
  ON public.combo_offers
  FOR SELECT
  USING (is_active = TRUE);

-- Admins full access
DROP POLICY IF EXISTS "Admins full access to combo offers" ON public.combo_offers;
CREATE POLICY "Admins full access to combo offers"
  ON public.combo_offers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 7. RLS Policies for combo_offer_items
-- Public can view items of active combos
DROP POLICY IF EXISTS "Public can view items of active combos" ON public.combo_offer_items;
CREATE POLICY "Public can view items of active combos"
  ON public.combo_offer_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.combo_offers
      WHERE combo_offers.id = combo_offer_items.combo_id
      AND combo_offers.is_active = TRUE
    )
  );

-- Admins full access to combo_offer_items
DROP POLICY IF EXISTS "Admins full access to combo offer items" ON public.combo_offer_items;
CREATE POLICY "Admins full access to combo offer items"
  ON public.combo_offer_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
