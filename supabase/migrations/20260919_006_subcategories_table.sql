-- =============================================================================
-- Migration: 20260919_006_subcategories_table.sql
-- Description: Dedicated subcategories table with foreign key to categories
-- =============================================================================

-- 1. Create dedicated subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  image_url           TEXT,
  image_public_id     TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON public.subcategories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_is_active ON public.subcategories(is_active);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Public can view active subcategories
CREATE POLICY "subcategories_select_public" ON public.subcategories
  FOR SELECT USING (is_active = TRUE);

-- Admins have full access
CREATE POLICY "subcategories_all_admin" ON public.subcategories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );


-- 5. Add optional subcategory_id reference to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;
