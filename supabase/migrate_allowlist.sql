-- Migration script to add account_id to client_allowlist table
-- Run this in your Supabase SQL editor

-- Step 1: Add the account_id column (nullable initially)
ALTER TABLE client_allowlist 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Step 2: Update existing records with account_id based on company_slug
-- This assumes you have a way to map company_slug to account_id
-- You may need to manually update these based on your data

-- Example: If you know which company_slug belongs to which account_id
-- UPDATE client_allowlist 
-- SET account_id = 'your-account-uuid-here' 
-- WHERE company_slug = 'acme-co';

-- Step 3: Make account_id NOT NULL after updating all records
-- ALTER TABLE client_allowlist ALTER COLUMN account_id SET NOT NULL;

-- Step 4: Drop the old unique constraint and add the new one
-- ALTER TABLE client_allowlist DROP CONSTRAINT IF EXISTS client_allowlist_company_slug_client_slug_email_key;
-- ALTER TABLE client_allowlist ADD CONSTRAINT client_allowlist_account_company_client_email_key 
--   UNIQUE(account_id, company_slug, client_slug, email);

-- Step 5: Add index for account_id
CREATE INDEX IF NOT EXISTS idx_allowlist_account_id ON client_allowlist(account_id);

-- Note: Uncomment the ALTER COLUMN and CONSTRAINT changes after you've populated account_id for all existing records
