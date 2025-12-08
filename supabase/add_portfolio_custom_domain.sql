-- Add custom_domain field to portfolios table
-- This allows users to use their own custom domain (e.g., portfolio.example.com)
-- instead of the default [yourname].jolix.io subdomain

ALTER TABLE portfolios
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Add index for custom domain lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_custom_domain ON portfolios(custom_domain) WHERE custom_domain IS NOT NULL;

-- Add comment
COMMENT ON COLUMN portfolios.custom_domain IS 'Custom domain for the portfolio (e.g., portfolio.example.com). If set, this will be used instead of the default [yourname].jolix.io subdomain.';

