-- Fix portfolio slug constraint - Remove global UNIQUE constraint
-- This allows different users to have portfolios with the same slug
-- The unique_user_slug constraint (user_id, slug) will still prevent duplicates per user

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    -- Drop the global unique constraint on slug if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'portfolios_slug_key'
    ) THEN
        ALTER TABLE portfolios DROP CONSTRAINT portfolios_slug_key;
        RAISE NOTICE 'Dropped portfolios_slug_key constraint';
    ELSE
        RAISE NOTICE 'portfolios_slug_key constraint does not exist';
    END IF;
    
    -- Ensure the unique_user_slug constraint exists (should already exist)
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_user_slug'
    ) THEN
        ALTER TABLE portfolios ADD CONSTRAINT unique_user_slug UNIQUE(user_id, slug);
        RAISE NOTICE 'Created unique_user_slug constraint';
    ELSE
        RAISE NOTICE 'unique_user_slug constraint already exists';
    END IF;
END $$;

