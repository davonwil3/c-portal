-- Test script for Client Portal functionality
-- Run this in your Supabase SQL editor after setting up the schema

-- 1. Test adding a member to allowlist
INSERT INTO client_allowlist (company_slug, client_slug, email, name, role) VALUES
('acme-co', 'sarah-johnson', 'test@example.com', 'Test User', 'Developer');

-- 2. Test generating a magic link token
SELECT generate_magic_link_token('test@example.com', 'acme-co', 'sarah-johnson');

-- 3. Test validating the token (use the token from step 2)
-- SELECT validate_magic_link_token('YOUR_TOKEN_HERE', 'acme-co', 'sarah-johnson');

-- 4. Test creating a session (this happens automatically after token validation)
-- SELECT create_client_session('test@example.com', 'acme-co', 'sarah-johnson');

-- 5. Test session validation (use session token from step 4)
-- SELECT validate_client_session('YOUR_SESSION_TOKEN_HERE', 'acme-co', 'sarah-johnson');

-- 6. Check current allowlist
SELECT * FROM client_allowlist WHERE company_slug = 'acme-co';

-- 7. Check magic link tokens
SELECT * FROM magic_link_tokens WHERE company_slug = 'acme-co';

-- 8. Check sessions
SELECT * FROM client_sessions WHERE company_slug = 'acme-co'; 