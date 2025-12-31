-- Add company email and phone fields to accounts table
-- Run this in your Supabase SQL editor

ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text;

-- Add comments for documentation
COMMENT ON COLUMN public.accounts.email IS 'Company email address';
COMMENT ON COLUMN public.accounts.phone IS 'Company phone number';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_email ON public.accounts(email);



