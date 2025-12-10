-- Remove client_slug column from client_allowlist table
-- This migration removes the client_slug column as it's no longer needed
-- The account owner's company/name slug is used instead

-- Step 1: Drop the unique constraint that includes client_slug
ALTER TABLE client_allowlist 
DROP CONSTRAINT IF EXISTS client_allowlist_company_slug_client_slug_email_key;

ALTER TABLE client_allowlist 
DROP CONSTRAINT IF EXISTS client_allowlist_account_company_client_email_key;

-- Step 2: Create new unique constraint without client_slug
-- Ensure unique email per account (not per client_slug)
ALTER TABLE client_allowlist 
ADD CONSTRAINT client_allowlist_account_email_key 
UNIQUE(account_id, email);

-- Step 3: Drop the client_slug column from client_allowlist
ALTER TABLE client_allowlist 
DROP COLUMN IF EXISTS client_slug;

-- Step 4: Also remove client_slug from magic_link_tokens table
ALTER TABLE magic_link_tokens 
DROP COLUMN IF EXISTS client_slug;

-- Step 5: Also remove client_slug from client_sessions table
ALTER TABLE client_sessions 
DROP COLUMN IF EXISTS client_slug;

-- Step 6: Update company_slug to be based on account owner's company/name
-- This will be handled by application code, but we can verify the data
-- Note: You may want to update existing company_slug values to match account owner's slug
-- This is a data migration that should be done carefully based on your data

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_allowlist'
ORDER BY ordinal_position;
