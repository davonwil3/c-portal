-- Fix token validation and prevent "token already used" errors
-- Run this in your Supabase SQL editor

-- 1. Fix the validate_magic_link_token function to NOT mark tokens as used immediately
DROP FUNCTION IF EXISTS validate_magic_link_token(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION validate_magic_link_token(
  p_token TEXT,
  p_company_slug TEXT,
  p_client_slug TEXT
) RETURNS TABLE(
  email TEXT,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_token_hash TEXT;
  v_record RECORD;
BEGIN
  v_token_hash := encode(sha256(p_token::bytea), 'hex');
  
  -- Find token
  SELECT * INTO v_record FROM magic_link_tokens 
  WHERE token_hash = v_token_hash 
  AND company_slug = p_company_slug 
  AND client_slug = p_client_slug;
  
  -- Check if token exists and is valid
  IF v_record IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, false::BOOLEAN, 'Invalid token'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token is expired
  IF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT NULL::TEXT, false::BOOLEAN, 'Token expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check if token already used
  IF v_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT NULL::TEXT, false::BOOLEAN, 'Token already used'::TEXT;
    RETURN;
  END IF;
  
  -- Don't mark token as used yet - let the session creation do that
  -- This prevents the token from being marked as used if session creation fails
  
  RETURN QUERY SELECT v_record.email, true::BOOLEAN, 'Token valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function to mark tokens as used after successful session creation
CREATE OR REPLACE FUNCTION mark_magic_link_token_used(
  p_token TEXT,
  p_company_slug TEXT,
  p_client_slug TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_token_hash TEXT;
  v_rows_affected INTEGER;
BEGIN
  v_token_hash := encode(sha256(p_token::bytea), 'hex');
  
  -- Find and mark token as used
  UPDATE magic_link_tokens 
  SET used_at = NOW() 
  WHERE token_hash = v_token_hash 
  AND company_slug = p_company_slug 
  AND client_slug = p_client_slug
  AND used_at IS NULL; -- Only update if not already used
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  RETURN v_rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset any tokens that might have been incorrectly marked as used
-- This will allow you to test with existing tokens
UPDATE magic_link_tokens 
SET used_at = NULL 
WHERE used_at IS NOT NULL 
AND expires_at > NOW();
