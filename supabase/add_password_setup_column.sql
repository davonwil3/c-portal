-- Add has_password_setup column to client_allowlist table
-- This tracks whether a user has set up password authentication

ALTER TABLE client_allowlist 
ADD COLUMN IF NOT EXISTS has_password_setup BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allowlist_password_setup ON client_allowlist(has_password_setup);

-- Update existing records - if they have a Supabase auth account, mark as having password setup
-- Note: This is a one-time migration. You may need to manually verify which users have passwords set up
-- For now, we'll leave existing records as false and let them set up passwords when they log in
