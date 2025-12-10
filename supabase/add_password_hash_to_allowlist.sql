-- Add password_hash column to client_allowlist table
-- This stores hashed passwords for client portal users (separate from Supabase Auth)

ALTER TABLE client_allowlist 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_allowlist_password_hash ON client_allowlist(password_hash) WHERE password_hash IS NOT NULL;

-- Note: password_hash will be NULL for users who haven't set up password login yet
-- The has_password_setup column can still be used to track if they've completed setup
