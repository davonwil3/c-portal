-- Fix the generate_magic_link_token function
-- Run this in your Supabase SQL editor

-- Drop the old function
DROP FUNCTION IF EXISTS generate_magic_link_token(TEXT, TEXT, TEXT);

-- Create the fixed function
CREATE OR REPLACE FUNCTION generate_magic_link_token(
  p_email TEXT,
  p_company_slug TEXT,
  p_client_slug TEXT
) RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_token_hash TEXT;
  v_account_id UUID;
BEGIN
  -- First get the account_id from the company_slug
  SELECT account_id INTO v_account_id FROM client_allowlist 
  WHERE email = p_email 
  AND (company_slug = p_company_slug OR client_slug = p_client_slug)
  AND is_active = true
  LIMIT 1;
  
  -- Check if email is in allowlist for this company or client
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Email not in allowlist for this portal';
  END IF;
  
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(sha256(v_token::bytea), 'hex');
  
  -- Store token hash with account_id
  INSERT INTO magic_link_tokens (account_id, email, company_slug, client_slug, token_hash, expires_at)
  VALUES (v_account_id, p_email, p_company_slug, p_client_slug, v_token_hash, NOW() + INTERVAL '15 minutes');
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
