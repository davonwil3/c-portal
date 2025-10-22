-- Cleanup script to remove duplicate allowlist entries
-- This script keeps the first (oldest) entry for each email per account and removes duplicates

-- First, let's see what duplicates exist
SELECT 
    account_id,
    email,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at) as entry_ids,
    ARRAY_AGG(client_slug ORDER BY created_at) as client_slugs
FROM client_allowlist 
WHERE is_active = true
GROUP BY account_id, email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Create a temporary table with the entries to keep (first entry for each email per account)
CREATE TEMP TABLE entries_to_keep AS
SELECT DISTINCT ON (account_id, email)
    id,
    account_id,
    email,
    client_slug,
    created_at
FROM client_allowlist 
WHERE is_active = true
ORDER BY account_id, email, created_at ASC;

-- Show what we're keeping
SELECT 
    'Entries to KEEP' as action,
    account_id,
    email,
    client_slug,
    created_at
FROM entries_to_keep
ORDER BY account_id, email;

-- Show what we're removing
SELECT 
    'Entries to REMOVE' as action,
    ca.account_id,
    ca.email,
    ca.client_slug,
    ca.created_at
FROM client_allowlist ca
WHERE ca.is_active = true
AND ca.id NOT IN (SELECT id FROM entries_to_keep)
ORDER BY ca.account_id, ca.email;

-- Actually remove the duplicates (uncomment to execute)
-- DELETE FROM client_allowlist 
-- WHERE is_active = true
-- AND id NOT IN (SELECT id FROM entries_to_keep);

-- Verify cleanup (run this after the DELETE to confirm)
-- SELECT 
--     account_id,
--     email,
--     COUNT(*) as remaining_count
-- FROM client_allowlist 
-- WHERE is_active = true
-- GROUP BY account_id, email
-- HAVING COUNT(*) > 1
-- ORDER BY remaining_count DESC;
