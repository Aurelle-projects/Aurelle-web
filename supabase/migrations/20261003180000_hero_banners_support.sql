-- =============================================================================
-- Migration: 20261003180000_hero_banners_support.sql
-- Description: Extend existing `banners` table for Hero Slider support & migrate
--              current live site_settings.hero into Banner #1.
-- =============================================================================

-- 1. Extend `banners` table with required fields for Hero Slider
ALTER TABLE banners
  ADD COLUMN IF NOT EXISTS overline TEXT,
  ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS mobile_image_public_id TEXT,
  ADD COLUMN IF NOT EXISTS product_image_url TEXT,
  ADD COLUMN IF NOT EXISTS product_image_public_id TEXT;

-- 2. Ensure RLS is enabled and policies exist
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Select active & scheduled banners for public visitors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'banners_select_active'
  ) THEN
    CREATE POLICY "banners_select_active" ON banners
      FOR SELECT USING (
        is_active = TRUE
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      );
  END IF;
END $$;

-- Admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'banners_all_admin'
  ) THEN
    CREATE POLICY "banners_all_admin" ON banners
      FOR ALL USING (is_admin());
  END IF;
END $$;

-- 3. Migrate existing live `site_settings.hero` into Banner #1 (if not already present)
DO $$
DECLARE
  v_hero_val JSONB;
BEGIN
  SELECT value INTO v_hero_val FROM site_settings WHERE key = 'hero' LIMIT 1;

  IF v_hero_val IS NOT NULL AND NOT EXISTS (SELECT 1 FROM banners WHERE position = 'hero') THEN
    INSERT INTO banners (
      title,
      subtitle,
      overline,
      link_text,
      link_url,
      image_url,
      image_public_id,
      mobile_image_url,
      mobile_image_public_id,
      product_image_url,
      product_image_public_id,
      position,
      sort_order,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      COALESCE(v_hero_val->>'hero_title', 'EVERYDAY ESSENTIALS. ELEVATED'),
      COALESCE(v_hero_val->>'hero_subtitle', 'Beauty, personal care and lifestyle products for every member of the family.'),
      COALESCE(v_hero_val->>'overline', v_hero_val->>'hero_tagline', 'NATURAL CARE FOR A BRIGHTER YOU'),
      COALESCE(v_hero_val->>'cta_primary_text', 'COLLECTION'),
      COALESCE(v_hero_val->>'cta_primary_href', '/shop'),
      COALESCE(v_hero_val->>'background_image_url', v_hero_val->>'product_image_url'),
      COALESCE(v_hero_val->>'background_image_public_id', v_hero_val->>'product_image_public_id'),
      v_hero_val->>'mobile_image_url',
      v_hero_val->>'mobile_image_public_id',
      v_hero_val->>'product_image_url',
      v_hero_val->>'product_image_public_id',
      'hero',
      0,
      TRUE,
      NOW(),
      NOW()
    );
  END IF;
END $$;
