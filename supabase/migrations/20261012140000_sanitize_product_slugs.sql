-- ============================================================
-- AURELLE COSMETICS — SANITIZE PRODUCT SLUGS MIGRATION
-- Migration: 20261012140000_sanitize_product_slugs.sql
-- Fixes existing products that have spaces or invalid characters in slugs.
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
  base_slug TEXT;
  counter INT;
BEGIN
  FOR rec IN
    SELECT id, name, slug
    FROM products
    WHERE slug ~ '[^a-z0-9-]' OR slug LIKE '% %'
  LOOP
    -- Generate base slug: lowercase, replace & with and, replace spaces/special chars with hyphen
    base_slug := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(COALESCE(rec.slug, rec.name)), '&', 'and', 'g'),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '[\s_]+', '-', 'g'
      )
    );
    -- Trim leading and trailing hyphens
    base_slug := trim(both '-' from base_slug);

    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'product-' || substr(rec.id::text, 1, 8);
    END IF;

    -- Ensure uniqueness across all products
    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = new_slug AND id <> rec.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;

    -- Update product with sanitized unique slug
    UPDATE products
    SET slug = new_slug
    WHERE id = rec.id;

    RAISE NOTICE 'Updated product id % from "%" to "%"', rec.id, rec.slug, new_slug;
  END LOOP;
END $$;
