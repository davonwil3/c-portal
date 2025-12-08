-- Create custom_domains table for portfolio custom domain management
-- This table stores custom domain configurations for user portfolios

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'verified', 'failed')),
  verification_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one domain per user (can be updated, but only one active at a time)
  UNIQUE(user_id)
);

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);

-- Add comment
COMMENT ON TABLE custom_domains IS 'Stores custom domain configurations for user portfolios. Each user can have one custom domain at a time.';
COMMENT ON COLUMN custom_domains.domain IS 'The custom domain (e.g., example.com) - stored without www prefix and without protocol';
COMMENT ON COLUMN custom_domains.status IS 'Domain verification status: pending (just added), verifying (DNS check in progress), verified (connected and working), failed (verification failed)';
COMMENT ON COLUMN custom_domains.verification_error IS 'Error message if verification failed';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON custom_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_domains_updated_at();

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own custom domains
CREATE POLICY "Users can view their own custom domains"
  ON custom_domains
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own custom domains
CREATE POLICY "Users can insert their own custom domains"
  ON custom_domains
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom domains
CREATE POLICY "Users can update their own custom domains"
  ON custom_domains
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own custom domains
CREATE POLICY "Users can delete their own custom domains"
  ON custom_domains
  FOR DELETE
  USING (auth.uid() = user_id);

