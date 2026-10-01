-- Migration: Remove Inventory and Stock Quantity Tracking System
-- Description: Aurelle no longer tracks inventory quantities or stock statuses. Availability is determined solely by published/active status.

-- 1. Drop stock decrement RPC function
DROP FUNCTION IF EXISTS public.decrement_stock(UUID, INTEGER);

-- 2. Drop RLS policies on inventory
DROP POLICY IF EXISTS "inventory_select_public" ON public.inventory;
DROP POLICY IF EXISTS "inventory_all_admin" ON public.inventory;

-- 3. Drop indexes on inventory table
DROP INDEX IF EXISTS public.idx_inventory_product_id;
DROP INDEX IF EXISTS public.idx_inventory_stock_status;
DROP INDEX IF EXISTS public.idx_inventory_low_stock;

-- 4. Drop inventory table
DROP TABLE IF EXISTS public.inventory CASCADE;

-- 5. Drop stock_status enum
DROP TYPE IF EXISTS public.stock_status CASCADE;
