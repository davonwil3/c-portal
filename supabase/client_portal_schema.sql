-- Client Portal Authentication Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Client allowlist table
CREATE TABLE IF NOT EXISTS client_allowlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  company_slug TEXT NOT NULL,
  client_slug TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  
  -- Ensure unique email per client per account
  UNIQUE(account_id, company_slug, client_slug, email)
);

-- Magic link tokens table
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  client_slug TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client sessions table
CREATE TABLE IF NOT EXISTS client_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  company_slug TEXT NOT NULL,
  client_slug TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE client_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_link_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;

-- Allowlist policies (users can manage their own allowlist entries)
CREATE POLICY "Users can manage their own allowlist entries" ON client_allowlist
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Keep service role access for admin operations
CREATE POLICY "Service role can manage all allowlist entries" ON client_allowlist
  FOR ALL USING (auth.role() = 'service_role');

-- Magic link policies (users can manage their own magic links)
CREATE POLICY "Users can manage their own magic links" ON magic_link_tokens
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Keep service role access for admin operations
CREATE POLICY "Service role can manage all magic links" ON magic_link_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Session policies (users can manage their own sessions)
CREATE POLICY "Users can manage their own sessions" ON client_sessions
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Keep service role access for admin operations
CREATE POLICY "Service role can manage all sessions" ON client_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Functions for token generation and validation
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
  
  -- Store token hash with account_id (24 hour expiration)
  INSERT INTO magic_link_tokens (account_id, email, company_slug, client_slug, token_hash, expires_at)
  VALUES (v_account_id, p_email, p_company_slug, p_client_slug, v_token_hash, NOW() + INTERVAL '24 hours');
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate magic link token
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
  
  -- Allow token reuse within expiration period - don't check used_at
  -- This allows users to access the portal multiple times with the same email link
  
  RETURN QUERY SELECT v_record.email, true::BOOLEAN, 'Token valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create session
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
  
  -- Check if session already exists for this user and portal
  DELETE FROM client_sessions 
  WHERE email = p_email 
  AND company_slug = p_company_slug 
  AND client_slug = p_client_slug;
  
  -- Store new session with account_id (24 hour expiration)
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

-- Function to mark magic link token as used (call this after successful session creation)
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

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_client_session(
  p_session_token TEXT,
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
  v_token_hash := encode(sha256(p_session_token::bytea), 'hex');
  
  -- Find session
  SELECT * INTO v_record FROM client_sessions 
  WHERE session_token_hash = v_token_hash 
  AND company_slug = p_company_slug 
  AND client_slug = p_client_slug;
  
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

-- Function to refresh session
CREATE OR REPLACE FUNCTION refresh_client_session(
  p_refresh_token TEXT,
  p_company_slug TEXT,
  p_client_slug TEXT
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
  
  -- Find session by refresh token
  SELECT * INTO v_record FROM client_sessions 
  WHERE refresh_token_hash = v_token_hash 
  AND company_slug = p_company_slug 
  AND client_slug = p_client_slug;
  
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

-- Sample data for testing (you'll need to replace the account_id with actual values from your accounts table)
-- INSERT INTO client_allowlist (account_id, company_slug, client_slug, email, name, role) VALUES
-- ('your-account-uuid-here', 'acme-co', 'sarah-johnson', 'sarah@acmecorp.com', 'Sarah Johnson', 'Marketing Director'),
-- ('your-account-uuid-here', 'acme-co', 'sarah-johnson', 'mike@acmecorp.com', 'Mike Chen', 'Product Manager'),
-- ('your-account-uuid-here', 'techstart', 'david-wilson', 'david@techstart.com', 'David Wilson', 'CTO');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_allowlist_company_client ON client_allowlist(company_slug, client_slug);
CREATE INDEX IF NOT EXISTS idx_allowlist_email ON client_allowlist(email);
CREATE INDEX IF NOT EXISTS idx_sessions_company_client ON client_sessions(company_slug, client_slug);

-- Create indexes for magic_link_tokens table
CREATE INDEX IF NOT EXISTS idx_magic_link_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_magic_link_token ON magic_link_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_link_expires ON magic_link_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_company_client ON magic_link_tokens(company_slug, client_slug);

-- Create indexes for client_sessions table
CREATE INDEX IF NOT EXISTS idx_session_token ON client_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_token ON client_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_session_expires ON client_sessions(expires_at); 