-- =============================================================================
-- Migration 008: Seed site_settings with storefront section data (JSONB)
-- =============================================================================
-- Migrates all hero.json data into Supabase site_settings table.
-- Uses DO UPDATE SET so this is safe to re-run at any time.
-- =============================================================================

-- Hero Banner
INSERT INTO site_settings (key, value) VALUES (
  'hero',
  '{
    "hero_title": "EVERYDAY ESSENTIALS. ELEVATED.",
    "hero_subtitle": "Beauty, personal care and lifestyle products for every member of the family.",
    "hero_tagline": "CARE BEAUTY WELLNESS LIFESTYLE",
    "overline": "NATURAL CARE FOR A BRIGHTER YOU",
    "cta_primary_text": "SHOP COLLECTION →",
    "cta_primary_href": "/shop",
    "product_image_url": "https://res.cloudinary.com/korjax8u/image/upload/v1789736896/aurelle/hero/i3l6ercgu2l1twg7uyxq.jpg",
    "product_image_public_id": "aurelle/hero/i3l6ercgu2l1twg7uyxq",
    "background_image_url": "https://res.cloudinary.com/korjax8u/image/upload/v1789736896/aurelle/hero/i3l6ercgu2l1twg7uyxq.jpg",
    "background_image_public_id": "aurelle/hero/i3l6ercgu2l1twg7uyxq"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Family Banner
INSERT INTO site_settings (key, value) VALUES (
  'family_banner',
  '{
    "title": "FOR THE WHOLE FAMILY",
    "subtitle": "Everyday beauty, personal care and lifestyle essentials for the whole family.",
    "image_url": "https://res.cloudinary.com/korjax8u/image/upload/v1789659008/aurelle/hero/mkqzvf9yggefwkk6fjw9.jpg",
    "image_public_id": "aurelle/hero/mkqzvf9yggefwkk6fjw9"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Promo Banners (left + right)
INSERT INTO site_settings (key, value) VALUES (
  'promo_banners',
  '{
    "left": {
      "tagline": "MERRY",
      "title": "Christmas",
      "discount": "30%off",
      "btn_text": "Shop Now",
      "btn_link": "/shop",
      "image_url": "https://res.cloudinary.com/korjax8u/image/upload/v1789745841/aurelle/banners/eye7knyaslvsp3aopv8l.png",
      "image_public_id": "aurelle/banners/eye7knyaslvsp3aopv8l"
    },
    "right": {
      "tagline": "YOUR NEXT",
      "title": "Purchase",
      "discount": "15%off",
      "btn_text": "Shop Now",
      "btn_link": "/shop",
      "image_url": "https://res.cloudinary.com/korjax8u/image/upload/v1789820497/aurelle/banners/rz84jj4mtdj0gagt7qum.png",
      "image_public_id": "aurelle/banners/rz84jj4mtdj0gagt7qum"
    }
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Announcement Bar
INSERT INTO site_settings (key, value) VALUES (
  'announcement',
  '{
    "text": "Free Shipping Across UAE on AED 199+ | 100% Authentic Products | Skincare, Fragrance, Wellness",
    "currency_label": "UAE | AED",
    "link": "/shop"
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Trust Badges
INSERT INTO site_settings (key, value) VALUES (
  'trust_badges',
  '{
    "badges": [
      { "title": "UAE-Wide Delivery", "subtitle": "Fast & Reliable" },
      { "title": "100% Authentic", "subtitle": "Products" },
      { "title": "Secure", "subtitle": "Payments" },
      { "title": "Easy & Hassle-Free", "subtitle": "Returns" }
    ]
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
