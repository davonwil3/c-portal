-- =====================================================
-- PROPOSALS DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- PROPOSALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Proposal Information
  proposal_number text UNIQUE, -- Auto-generated proposal number (e.g., PROP-2024-0001)
  title text NOT NULL,
  description text,
  
  -- Proposal Content (JSONB - stores all proposal builder data)
  proposal_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Structure:
  -- {
  --   "client": { "name", "email", "company", "address" },
  --   "company": { "name", "email", "address" },
  --   "branding": { "brandColor", "accentColor", "logoUrl", "showLogo" },
  --   "content": { "title", "subtitle", "goals", "successOutcome", "deliverables", "timeline", "labels" },
  --   "pricing": { "items": [], "addons": [], "currency", "taxRate" },
  --   "paymentPlan": { "enabled", "type", "schedule": [] },
  --   "contract": { "projectName", "revisionCount", "hourlyRate", "lateFee", etc. },
  --   "invoice": { "number", "issueDate", "dueDate" }
  -- }
  
  -- Relationships (optional - proposals can be linked to clients, projects, or leads)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads (id) ON DELETE SET NULL,
  
  -- Recipient Information (cached for quick access)
  recipient_name text,
  recipient_email text,
  recipient_company text,
  recipient_type text DEFAULT 'Client' CHECK (recipient_type IN ('Client', 'Lead')),
  
  -- Proposal Status and Workflow
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Declined')),
  
  -- Financial Information
  total_value decimal(15,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  subtotal decimal(15,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  
  -- Timeline
  valid_until timestamptz, -- Proposal expiration date
  sent_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  declined_reason text,
  
  -- Email and Notification Settings
  email_subject text,
  email_body text,
  cc_emails text[],
  bcc_emails text[],
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  email_clicked_at timestamptz,
  
  -- Document Settings
  proposal_html text, -- HTML version for rich formatting (optional)
  proposal_pdf_path text, -- Path to generated PDF file (optional)
  
  -- Metadata
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb, -- Additional proposal data
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_activity_at timestamptz
);

-- =====================================================
-- PROPOSAL ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.proposal_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'sent', 'viewed', 'accepted', 'declined', 'updated', 'archived')),
  action text NOT NULL, -- e.g., "created proposal", "sent for review", "accepted proposal"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_account_id ON public.proposals(account_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON public.proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_recipient_email ON public.proposals(recipient_email);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON public.proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_sent_at ON public.proposals(sent_at);
CREATE INDEX IF NOT EXISTS idx_proposals_valid_until ON public.proposals(valid_until);
CREATE INDEX IF NOT EXISTS idx_proposals_title ON public.proposals USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_proposals_tags ON public.proposals USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_proposals_data ON public.proposals USING gin(proposal_data);

-- Proposal activities indexes
CREATE INDEX IF NOT EXISTS idx_proposal_activities_proposal_id ON public.proposal_activities(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_account_id ON public.proposal_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_user_id ON public.proposal_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_type ON public.proposal_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_proposal_activities_created_at ON public.proposal_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Proposals policies
CREATE POLICY "Users can view proposals in their account" ON public.proposals
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create proposals in their account" ON public.proposals
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update proposals in their account" ON public.proposals
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete proposals in their account" ON public.proposals
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Proposal activities policies
CREATE POLICY "Users can view proposal activities in their account" ON public.proposal_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create proposal activities in their account" ON public.proposal_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate proposal number
CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  max_number INTEGER;
  next_number INTEGER;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Find the maximum proposal number for this year and account
  -- Use SPLIT_PART to extract the number part (3rd segment after splitting by '-')
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(proposal_number, '-', 3) AS INTEGER)),
    0
  )
  INTO max_number
  FROM public.proposals
  WHERE proposal_number LIKE 'PROP-' || current_year || '-%'
    AND account_id = NEW.account_id
    AND proposal_number IS NOT NULL;
  
  -- Calculate next number
  next_number := max_number + 1;
  
  -- Generate proposal number
  NEW.proposal_number := 'PROP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate proposal number
DROP TRIGGER IF EXISTS on_proposal_created ON public.proposals;
CREATE TRIGGER on_proposal_created
  BEFORE INSERT ON public.proposals
  FOR EACH ROW 
  WHEN (NEW.proposal_number IS NULL)
  EXECUTE FUNCTION public.generate_proposal_number();

-- Function to update proposal's last activity
CREATE OR REPLACE FUNCTION public.update_proposal_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.proposals 
  SET last_activity_at = now(), updated_at = now()
  WHERE id = NEW.proposal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update proposal last activity when activity is logged
DROP TRIGGER IF EXISTS on_proposal_activity_created ON public.proposal_activities;
CREATE TRIGGER on_proposal_activity_created
  AFTER INSERT ON public.proposal_activities
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_proposal_last_activity();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_proposal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on proposal update
DROP TRIGGER IF EXISTS on_proposal_updated ON public.proposals;
CREATE TRIGGER on_proposal_updated
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_proposal_updated_at();


