-- =====================================================
-- LEADS DATABASE SCHEMA
-- For managing leads in the lead workflow
-- =====================================================

-- =====================================================
-- LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Lead Information
  name text NOT NULL,
  company text,
  email text,
  phone text,
  
  -- Social Media (JSONB to store multiple platforms)
  -- Format: {"twitter": "@username", "linkedin": "username", "instagram": "@username", etc.}
  social_media jsonb DEFAULT '{}'::jsonb,
  
  -- Lead Source & Tracking
  source text DEFAULT 'Manual' CHECK (source IN ('Website', 'Referral', 'Ad Campaign', 'Manual Import', 'Portfolio', 'Social Media', 'Other')),
  portfolio_id uuid REFERENCES public.portfolios (id) ON DELETE SET NULL, -- If lead came from portfolio
  portfolio_url text, -- URL of the portfolio page that generated the lead
  
  -- Lead Status & Value
  status text DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost')),
  value decimal(10,2) DEFAULT 0, -- Lead value in dollars
  
  -- Ownership & Assignment
  owner_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  owner_name text, -- Cached owner name for performance
  
  -- Contact History
  last_contacted_at timestamptz,
  first_contacted_at timestamptz DEFAULT now(),
  
  -- Notes & Additional Info
  notes text,
  
  -- Tags for organization (optional)
  tags text[] DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_leads_account_id ON public.leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_portfolio_id ON public.leads(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads USING gin(to_tsvector('english', company));

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Users can view leads in their account
CREATE POLICY "Users can view leads in their account" ON public.leads
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can create leads in their account
CREATE POLICY "Users can create leads in their account" ON public.leads
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can update leads in their account
CREATE POLICY "Users can update leads in their account" ON public.leads
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Users can delete leads in their account
CREATE POLICY "Users can delete leads in their account" ON public.leads
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS on_leads_updated ON public.leads;
CREATE TRIGGER on_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_leads_updated_at();

-- Function to set first_contacted_at on first contact
CREATE OR REPLACE FUNCTION public.set_leads_first_contacted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_contacted_at IS NOT NULL AND OLD.last_contacted_at IS NULL THEN
    NEW.first_contacted_at = NEW.last_contacted_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set first_contacted_at
DROP TRIGGER IF EXISTS on_leads_first_contacted ON public.leads;
CREATE TRIGGER on_leads_first_contacted
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_leads_first_contacted();
