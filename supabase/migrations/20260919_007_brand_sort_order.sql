-- =============================================================================
-- Migration: 20260919_007_brand_sort_order.sql
-- Description: Add sort_order (order priority) to brands table
-- =============================================================================

-- 1. Ensure brands table exists with all standard columns
CREATE TABLE IF NOT EXISTS public.brands (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT,
  logo_url            TEXT,
  logo_public_id      TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add sort_order column if table already exists without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'brands' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.brands ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 3. Create index for fast sorting by order priority
CREATE INDEX IF NOT EXISTS idx_brands_sort_order ON public.brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON public.brands(is_active);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 5. Public select policy (active brands visible to storefront anon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brands' 
    AND policyname = 'brands_select_public'
  ) THEN
    CREATE POLICY "brands_select_public" ON public.brands
      FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

-- 6. Service role full access (admin API bypasses RLS with service key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brands' 
    AND policyname = 'brands_service_role_all'
  ) THEN
    CREATE POLICY "brands_service_role_all" ON public.brands
      USING (current_setting('role') = 'service_role')
      WITH CHECK (current_setting('role') = 'service_role');
  END IF;
END $$;
