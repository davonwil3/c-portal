-- Fix portfolio slug constraint
-- Remove the global UNIQUE constraint on slug (line 14)
-- Keep only the unique_user_slug constraint which allows different users to have the same slug

-- Drop the global unique constraint on slug
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_slug_key;

-- The unique_user_slug constraint (user_id, slug) should remain
-- This allows different users to have the same slug, but prevents duplicates per user

