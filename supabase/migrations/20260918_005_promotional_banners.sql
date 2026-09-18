-- ============================================================
-- MIGRATION: 20260918_005_promotional_banners.sql
-- DESCRIPTION: Database schema & seed for Storefront Promotional Dual Banners
-- ============================================================

-- ─── OPTION 1: Using Existing `homepage_sections` Table ─────────────────────
-- Automatically integrated with Aurelle storefront and admin panel

INSERT INTO homepage_sections (section_key, title, subtitle, data, is_active, sort_order)
VALUES (
  'promo_dual_banners',
  'Promotional Dual Banners',
  'Two side-by-side promotional campaign banners (Primary Left + Secondary Right)',
  '{
    "left": {
      "tagline": "MERRY",
      "title": "Christmas",
      "discount": "30%off",
      "btn_text": "Shop Now",
      "btn_link": "/shop",
      "image_url": null,
      "image_public_id": null
    },
    "right": {
      "tagline": "YOUR NEXT",
      "title": "Purchase",
      "discount": "15%off",
      "btn_text": "Shop Now",
      "btn_link": "/shop",
      "image_url": null,
      "image_public_id": null
    }
  }'::jsonb,
  TRUE,
  4
)
ON CONFLICT (section_key) DO UPDATE
SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  data = EXCLUDED.data,
  updated_at = NOW();

-- ─── OPTION 2: Dedicated `promotional_banners` Relational Table ───────────────
-- Run this if you prefer a separate dedicated relational table in Supabase

CREATE TABLE IF NOT EXISTS promotional_banners (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_position   TEXT NOT NULL UNIQUE CHECK (banner_position IN ('left', 'right')),
  tagline           TEXT DEFAULT 'PROMOTION',
  title             TEXT NOT NULL,
  discount_text     TEXT,
  btn_text          TEXT DEFAULT 'Shop Now',
  btn_link          TEXT DEFAULT '/shop',
  image_url         TEXT,
  image_public_id   TEXT,
  background_color  TEXT DEFAULT '#F5F5F5',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE promotional_banners ENABLE ROW LEVEL SECURITY;

-- Policies for promotional_banners
CREATE POLICY "promotional_banners_select_active" ON promotional_banners
  FOR SELECT USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

CREATE POLICY "promotional_banners_all_admin" ON promotional_banners
  FOR ALL USING (is_admin());

-- Seed initial data for promotional_banners table
INSERT INTO promotional_banners (banner_position, tagline, title, discount_text, btn_text, btn_link, image_url, image_public_id, background_color, sort_order)
VALUES
  ('left', 'MERRY', 'Christmas', '30%off', 'Shop Now', '/shop', NULL, NULL, '#F5F5F5', 1),
  ('right', 'YOUR NEXT', 'Purchase', '15%off', 'Shop Now', '/shop', NULL, NULL, '#EAEAEA', 2)
ON CONFLICT (banner_position) DO NOTHING;
