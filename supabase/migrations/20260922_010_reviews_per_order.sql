-- ── Migration: Allow one review per product per purchase/order ───────────────
-- 1. Drop existing unique constraint on (product_id, user_id)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_user_id_key;

-- 2. Add unique constraint on (product_id, order_id)
-- Each product can only be reviewed once per order/purchase
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_order_id_key;
ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_order_id_key UNIQUE (product_id, order_id);
