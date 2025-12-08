-- Add company contact fields to accounts table
-- Run this in your Supabase SQL editor

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS email text;

-- Add comments for documentation
COMMENT ON COLUMN public.accounts.phone IS 'Company phone number';
COMMENT ON COLUMN public.accounts.email IS 'Company email address';

