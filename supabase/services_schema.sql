-- Services table for billing/invoicing
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  rate DECIMAL(10, 2) NOT NULL,
  rate_type TEXT NOT NULL CHECK (rate_type IN ('hourly', 'fixed', 'monthly', 'yearly')),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own account's services"
  ON public.services
  FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert services for their own account"
  ON public.services
  FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own account's services"
  ON public.services
  FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own account's services"
  ON public.services
  FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles
      WHERE user_id = auth.uid()
    )
  );

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_account_id ON public.services(account_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

