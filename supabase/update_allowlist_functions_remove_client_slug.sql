-- Update database functions to remove client_slug parameter
-- Run this AFTER removing the client_slug column from the tables

-- Update generate_magic_link_token function
CREATE OR REPLACE FUNCTION generate_magic_link_token(
  p_email TEXT,
  p_company_slug TEXT
) RETURNS TEXT AS $$
DECLARE
  v_account_id UUID;
  v_token_hash TEXT;
  v_token TEXT;
BEGIN
  -- Generate a random token
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(sha256(v_token::bytea), 'hex');

  -- Find account_id from company_slug (matching account owner's company/name)
  SELECT account_id INTO v_account_id
  FROM client_allowlist
  WHERE email = p_email
  AND company_slug = p_company_slug
  AND is_active = true
  LIMIT 1;

  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Email not authorized for this portal';
  END IF;

  -- Insert token (without client_slug)
  INSERT INTO magic_link_tokens (account_id, email, company_slug, token_hash, expires_at)
  VALUES (v_account_id, p_email, p_company_slug, v_token_hash, NOW() + INTERVAL '24 hours');

  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update validate_magic_link_token function
CREATE OR REPLACE FUNCTION validate_magic_link_token(
  p_token TEXT,
  p_company_slug TEXT
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
  
  -- Find token (without client_slug)
  SELECT * INTO v_record FROM magic_link_tokens 
  WHERE token_hash = v_token_hash 
  AND company_slug = p_company_slug;
  
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
  
  RETURN QUERY SELECT v_record.email, true::BOOLEAN, 'Token valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update create_client_session function
CREATE OR REPLACE FUNCTION create_client_session(
  p_email TEXT,
  p_company_slug TEXT
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
  AND company_slug = p_company_slug
  AND is_active = true
  LIMIT 1;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'Email not authorized for this portal';
  END IF;
  
  -- Generate tokens
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_refresh_token := encode(gen_random_bytes(32), 'hex');
  v_session_hash := encode(sha256(v_session_token::bytea), 'hex');
  v_refresh_hash := encode(sha256(v_refresh_token::bytea), 'hex');
  
  -- Delete existing session for this user and portal
  DELETE FROM client_sessions 
  WHERE email = p_email 
  AND company_slug = p_company_slug;
  
  -- Store new session (without client_slug)
  INSERT INTO client_sessions (
    account_id,
    session_token_hash, 
    refresh_token_hash, 
    email, 
    company_slug, 
    expires_at
  ) VALUES (
    v_account_id,
    v_session_hash,
    v_refresh_hash,
    p_email,
    p_company_slug,
    NOW() + INTERVAL '24 hours'
  );
  
  RETURN QUERY SELECT v_session_token, v_refresh_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update validate_client_session function
CREATE OR REPLACE FUNCTION validate_client_session(
  p_session_token TEXT,
  p_company_slug TEXT
) RETURNS TABLE(
  email TEXT,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_token_hash TEXT;
  v_record RECORD;
BEGIN
  v_token_hash := encode(sha256(p_session_token::bytea), 'hex');
  
  -- Find session (without client_slug)
  SELECT * INTO v_record FROM client_sessions 
  WHERE session_token_hash = v_token_hash 
  AND company_slug = p_company_slug;
  
  -- Check if session exists
  IF v_record IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, false::BOOLEAN, 'Invalid session'::TEXT;
    RETURN;
  END IF;
  
  -- Check if session is expired
  IF v_record.expires_at < NOW() THEN
    RETURN QUERY SELECT NULL::TEXT, false::BOOLEAN, 'Session expired'::TEXT;
    RETURN;
  END IF;
  
  -- Update last used
  UPDATE client_sessions SET last_used_at = NOW() WHERE id = v_record.id;
  
  RETURN QUERY SELECT v_record.email, true::BOOLEAN, 'Session valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update refresh_client_session function
CREATE OR REPLACE FUNCTION refresh_client_session(
  p_refresh_token TEXT,
  p_company_slug TEXT
) RETURNS TABLE(
  session_token TEXT,
  refresh_token TEXT
) AS $$
DECLARE
  v_token_hash TEXT;
  v_record RECORD;
  v_new_session_token TEXT;
  v_new_refresh_token TEXT;
  v_new_session_hash TEXT;
  v_new_refresh_hash TEXT;
BEGIN
  v_token_hash := encode(sha256(p_refresh_token::bytea), 'hex');
  
  -- Find session by refresh token (without client_slug)
  SELECT * INTO v_record FROM client_sessions 
  WHERE refresh_token_hash = v_token_hash 
  AND company_slug = p_company_slug;
  
  -- Check if session exists
  IF v_record IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Generate new tokens
  v_new_session_token := encode(gen_random_bytes(32), 'hex');
  v_new_refresh_token := encode(gen_random_bytes(32), 'hex');
  v_new_session_hash := encode(sha256(v_new_session_token::bytea), 'hex');
  v_new_refresh_hash := encode(sha256(v_new_refresh_token::bytea), 'hex');
  
  -- Update session with new tokens
  UPDATE client_sessions SET 
    session_token_hash = v_new_session_hash,
    refresh_token_hash = v_new_refresh_hash,
    expires_at = NOW() + INTERVAL '24 hours',
    last_used_at = NOW()
  WHERE id = v_record.id;
  
  RETURN QUERY SELECT v_new_session_token, v_new_refresh_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
