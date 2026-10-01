-- ============================================================
-- AURELLE COSMETICS — DEDICATED WHOLESALE ENQUIRIES TABLE
-- Migration: 20261001150000_wholesale_enquiries.sql
-- Separates Product/Trade Enquiries from B2B Account Applications
-- ============================================================

-- 1. Create public.wholesale_enquiries table
CREATE TABLE IF NOT EXISTS public.wholesale_enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,

    phone TEXT NOT NULL,
    email TEXT,

    whatsapp TEXT,

    category_name TEXT,
    product_name TEXT,

    quantity TEXT,

    message TEXT,
    notes TEXT,

    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_wholesale_enquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_wholesale_enquiries_updated_at ON public.wholesale_enquiries;
CREATE TRIGGER trigger_update_wholesale_enquiries_updated_at
    BEFORE UPDATE ON public.wholesale_enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_wholesale_enquiries_updated_at();

-- 3. Useful Indexes
CREATE INDEX IF NOT EXISTS idx_wholesale_enquiries_status ON public.wholesale_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_wholesale_enquiries_created_at ON public.wholesale_enquiries(created_at DESC);

-- 4. Row Level Security (RLS)
ALTER TABLE public.wholesale_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public insert through storefront enquiry modal & contact forms
DROP POLICY IF EXISTS "wholesale_enquiries_insert_public" ON public.wholesale_enquiries;
CREATE POLICY "wholesale_enquiries_insert_public" ON public.wholesale_enquiries
    FOR INSERT WITH CHECK (true);

-- Allow admin full access
DROP POLICY IF EXISTS "wholesale_enquiries_all_admin" ON public.wholesale_enquiries;
CREATE POLICY "wholesale_enquiries_all_admin" ON public.wholesale_enquiries
    FOR ALL USING (is_admin());
