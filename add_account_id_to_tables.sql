-- Add missing account_id columns to existing tables
-- Run this in your Supabase SQL editor

-- Add account_id to magic_link_tokens table
ALTER TABLE magic_link_tokens 
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Add account_id to client_sessions table  
ALTER TABLE client_sessions 
ADD COLUMN IF NOT EXISTS account_id UUID;

-- Update existing records with account_id from client_allowlist
-- This will populate account_id for existing magic link tokens
UPDATE magic_link_tokens 
SET account_id = (
  SELECT cal.account_id 
  FROM client_allowlist cal 
  WHERE cal.email = magic_link_tokens.email 
  AND cal.company_slug = magic_link_tokens.company_slug
  LIMIT 1
)
WHERE account_id IS NULL;

-- This will populate account_id for existing client sessions
UPDATE client_sessions 
SET account_id = (
  SELECT cal.account_id 
  FROM client_allowlist cal 
  WHERE cal.email = client_sessions.email 
  AND cal.company_slug = client_sessions.company_slug
  LIMIT 1
)
WHERE account_id IS NULL;

-- Make account_id NOT NULL after populating
ALTER TABLE magic_link_tokens 
ALTER COLUMN account_id SET NOT NULL;

ALTER TABLE client_sessions 
ALTER COLUMN account_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE magic_link_tokens 
ADD CONSTRAINT fk_magic_link_tokens_account_id 
FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

ALTER TABLE client_sessions 
ADD CONSTRAINT fk_client_sessions_account_id 
FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_account_id ON magic_link_tokens(account_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_account_id ON client_sessions(account_id);
