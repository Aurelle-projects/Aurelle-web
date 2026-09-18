-- ============================================================
-- AURELLE COSMETICS — 10 E-COMMERCE PRODUCT CATEGORIES & SUBCATEGORIES
-- Migration: 20260917_004_seed_categories.sql
-- ============================================================

-- Function to safely insert category if slug doesn't exist
DO $$
DECLARE
  v_parent_id UUID;
BEGIN
  -- ─── 1. Cosmetics & Makeup ────────────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Cosmetics & Makeup', 'cosmetics-makeup', 'Luxury cosmetics, makeup essentials, lip care and professional beauty tools.', 1, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 1
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Makeup', 'makeup', v_parent_id, 1, true),
    ('Lip Care', 'lip-care', v_parent_id, 2, true),
    ('Foundation', 'foundation', v_parent_id, 3, true),
    ('Concealer', 'concealer', v_parent_id, 4, true),
    ('Eye Makeup', 'eye-makeup', v_parent_id, 5, true),
    ('Beauty Tools', 'beauty-tools', v_parent_id, 6, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 2. Skincare & Body Care ──────────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Skincare & Body Care', 'skincare-body-care', 'High-performance face washes, hydrating serums, moisturizers, and nourishing body care.', 2, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 2
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Face Wash', 'face-wash', v_parent_id, 1, true),
    ('Moisturizers', 'moisturizers', v_parent_id, 2, true),
    ('Creams', 'creams', v_parent_id, 3, true),
    ('Lotions', 'lotions', v_parent_id, 4, true),
    ('Serums', 'serums', v_parent_id, 5, true),
    ('Sunscreen', 'sunscreen', v_parent_id, 6, true),
    ('Body-Care Products', 'body-care-products', v_parent_id, 7, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 3. Hair Care ─────────────────────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Hair Care', 'hair-care', 'Professional shampoos, restorative conditioners, precious oils and styling treatments.', 3, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 3
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Shampoo', 'shampoo', v_parent_id, 1, true),
    ('Conditioner', 'conditioner', v_parent_id, 2, true),
    ('Hair Oils', 'hair-oils', v_parent_id, 3, true),
    ('Hair Treatments', 'hair-treatments', v_parent_id, 4, true),
    ('Styling Products', 'styling-products', v_parent_id, 5, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 4. Personal Care & Hygiene ───────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Personal Care & Hygiene', 'personal-care-hygiene', 'Everyday hygiene essentials, soaps, refreshing shower gels, and oral care.', 4, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 4
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Soaps', 'soaps', v_parent_id, 1, true),
    ('Shower Gels', 'shower-gels', v_parent_id, 2, true),
    ('Oral-Care Products', 'oral-care-products', v_parent_id, 3, true),
    ('Shaving Products', 'shaving-products', v_parent_id, 4, true),
    ('Deodorants', 'deodorants', v_parent_id, 5, true),
    ('Hygiene Products', 'hygiene-products', v_parent_id, 6, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 5. Baby Care Products ────────────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Baby Care Products', 'baby-care', 'Gentle, dermatologist-tested baby toiletries, lotions, shampoos, and comfort accessories.', 5, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 5
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Baby Toiletries', 'baby-toiletries', v_parent_id, 1, true),
    ('Baby Lotions', 'baby-lotions', v_parent_id, 2, true),
    ('Baby Shampoos', 'baby-shampoos', v_parent_id, 3, true),
    ('Baby Hygiene Products', 'baby-hygiene-products', v_parent_id, 4, true),
    ('Diapers', 'diapers', v_parent_id, 5, true),
    ('Feeding & Grooming Accessories', 'feeding-grooming-accessories', v_parent_id, 6, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 6. Health & Wellness Products ────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Health & Wellness Products', 'health-wellness', 'Topical wellness, vapor balms, cooling patches, and first-aid comfort essentials.', 6, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 6
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Topical Wellness & Balms', 'topical-wellness', v_parent_id, 1, true),
    ('Vapor Rubs & Balms', 'vapor-rubs-balms', v_parent_id, 2, true),
    ('Inhalation & Cold Relief', 'inhalation-cold-relief', v_parent_id, 3, true),
    ('Heat & Cooling Patches', 'heat-cooling-patches', v_parent_id, 4, true),
    ('General Wellness & Comfort', 'general-wellness', v_parent_id, 5, true),
    ('First-Aid & Healthcare Accessories', 'first-aid-accessories', v_parent_id, 6, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 7. Grooming & Beauty Accessories ─────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Grooming & Beauty Accessories', 'grooming-accessories', 'Premium combs, brushes, vanity mirrors, manicure sets and cosmetics organizers.', 7, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 7
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Combs', 'combs', v_parent_id, 1, true),
    ('Brushes', 'brushes', v_parent_id, 2, true),
    ('Mirrors', 'mirrors', v_parent_id, 3, true),
    ('Manicure & Pedicure Items', 'manicure-pedicure', v_parent_id, 4, true),
    ('Cosmetic Bags & Organizers', 'cosmetic-bags-organizers', v_parent_id, 5, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 8. Household & Lifestyle Products ────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Household & Lifestyle Products', 'household-lifestyle', 'Modern home essentials, cleaning accessories, travel items and lifestyle organizers.', 8, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 8
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Household Essentials', 'household-essentials', v_parent_id, 1, true),
    ('Cleaning Accessories', 'cleaning-accessories', v_parent_id, 2, true),
    ('Storage Products', 'storage-products', v_parent_id, 3, true),
    ('Travel Items', 'travel-items', v_parent_id, 4, true),
    ('Lifestyle Accessories', 'lifestyle-accessories', v_parent_id, 5, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 9. Perfumes & Fragrances ─────────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('Perfumes & Fragrances', 'perfumes-fragrances', 'Captivating perfumes, luxury Arabian and French fragrances, body sprays and gift sets.', 9, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 9
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Perfumes', 'perfumes', v_parent_id, 1, true),
    ('Fragrances', 'fragrances', v_parent_id, 2, true),
    ('Body Sprays', 'body-sprays', v_parent_id, 3, true),
    ('Fragrance Deodorants', 'fragrance-deodorants', v_parent_id, 4, true),
    ('Fragrance Sets', 'fragrance-sets', v_parent_id, 5, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── 10. General Consumer Goods ───────────────────────────────────────────
  INSERT INTO categories (name, slug, description, sort_order, is_active)
  VALUES ('General Consumer Goods', 'general-consumer-goods', 'Curated gift items, everyday essentials, convenience items and consumer goods.', 10, true)
  ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, sort_order = 10
  RETURNING id INTO v_parent_id;

  INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES
    ('Gift Items', 'gift-items', v_parent_id, 1, true),
    ('Everyday-Use Products', 'everyday-use-products', v_parent_id, 2, true),
    ('Convenience Products', 'convenience-products', v_parent_id, 3, true),
    ('Other Permissible Goods', 'other-consumer-goods', v_parent_id, 4, true)
  ON CONFLICT (slug) DO NOTHING;

  -- ─── Seed Default Homepage Sections (Hero & Trust Badges) ─────────────────
  INSERT INTO homepage_sections (section_key, title, subtitle, data, is_active)
  VALUES (
    'hero',
    'EVERYDAY ESSENTIALS. ELEVATED.',
    'Beauty, personal care and lifestyle products for every member of the family.',
    '{
      "tagline": "CARE BEAUTY WELLNESS LIFESTYLE",
      "cta_primary_text": "SHOP COLLECTION →",
      "cta_primary_href": "/shop",
      "cta_secondary_text": "Apply for Wholesale",
      "cta_secondary_href": "/wholesale/apply",
      "top_announcement": "Free Shipping Across UAE on AED 199+ | 100% Authentic Products | Skincare, Fragrance, Wellness",
      "background_image_public_id": null
    }'::jsonb,
    true
  )
  ON CONFLICT (section_key) DO UPDATE SET
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle;

  -- ─── Seed Site Settings ───────────────────────────────────────────────────
  INSERT INTO site_settings (key, value) VALUES
    ('currency', '"AED"'),
    ('vat_rate', '0.05'),
    ('free_shipping_threshold', '199'),
    ('store_name', '"Aurelle Cosmetics Trading FZ-LLC"'),
    ('store_email', '"care@aurelle.ae"'),
    ('store_phone', '"+971 4 000 0000"')
  ON CONFLICT (key) DO NOTHING;

END $$;
