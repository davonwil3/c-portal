-- Add company information fields to accounts table
-- Run this in your Supabase SQL editor

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Add comments for documentation
COMMENT ON COLUMN public.accounts.address IS 'Company physical address';
COMMENT ON COLUMN public.accounts.timezone IS 'Company timezone (est, cst, mst, pst)';
COMMENT ON COLUMN public.accounts.industry IS 'Company industry type';
COMMENT ON COLUMN public.accounts.logo_url IS 'URL to company logo stored in storage bucket';

