-- Add Stripe Connect account ID to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_enabled BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_stripe_connect_account_id 
ON public.accounts(stripe_connect_account_id);

