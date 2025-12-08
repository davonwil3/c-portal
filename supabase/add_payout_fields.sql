-- Add PayPal and default payout provider fields to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS paypal_merchant_id TEXT,
ADD COLUMN IF NOT EXISTS paypal_connected BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_payout_provider TEXT CHECK (default_payout_provider IN ('stripe', 'paypal', NULL));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_paypal_merchant_id 
ON public.accounts(paypal_merchant_id);

