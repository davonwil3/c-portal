-- Fix all database functions for client portal
-- Run this in your Supabase SQL editor

-- 1. Fix generate_magic_link_token function
DROP FUNCTION IF EXISTS generate_magic_link_token(TEXT, TEXT, TEXT);

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

-- 2. Fix create_client_session function
DROP FUNCTION IF EXISTS create_client_session(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_client_session(
  p_email TEXT,
  p_company_slug TEXT,
  p_client_slug TEXT
) RETURNS TABLE(
  session_token TEXT,
  refresh_token TEXT
) AS $$
DECLARE
  v_session_token TEXT;
  v_refresh_token TEXT;
  v_session_hash TEXT;
  v_refresh_hash TEXT;
  v_account_id UUID;
BEGIN
  -- Get account_id from allowlist
  SELECT account_id INTO v_account_id FROM client_allowlist 
  WHERE email = p_email 
  AND (company_slug = p_company_slug OR client_slug = p_client_slug)
  AND is_active = true
  LIMIT 1;
  
  -- Generate tokens
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_refresh_token := encode(gen_random_bytes(32), 'hex');
  v_session_hash := encode(sha256(v_session_token::bytea), 'hex');
  v_refresh_hash := encode(sha256(v_refresh_token::bytea), 'hex');
  
  -- Store session with account_id
  INSERT INTO client_sessions (
    account_id,
    session_token_hash, 
    refresh_token_hash, 
    email, 
    company_slug, 
    client_slug, 
    expires_at
  ) VALUES (
    v_account_id,
    v_session_hash,
    v_refresh_hash,
    p_email,
    p_company_slug,
    p_client_slug,
    NOW() + INTERVAL '24 hours'
  );
  
  RETURN QUERY SELECT v_session_token, v_refresh_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
