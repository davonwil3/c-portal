-- =====================================================
-- CONTRACTS DATABASE SCHEMA
-- =====================================================

-- Enable Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONTRACTS TABLE
-- =====================================================
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Contract Information
  name text NOT NULL,
  description text,
  contract_number text UNIQUE, -- Auto-generated contract number
  
  -- Contract Content (The entire contract document)
  contract_content text NOT NULL, -- Full contract text/content
  contract_html text, -- HTML version for rich formatting
  contract_pdf_path text, -- Path to generated PDF file
  
  -- Contract Type and Template
  contract_type text DEFAULT 'custom' CHECK (contract_type IN ('custom', 'web-design', 'social-media', 'consulting', 'contractor', 'retainer', 'sow', 'nda')),
  template_id uuid REFERENCES public.contract_templates (id) ON DELETE SET NULL,
  
  -- Relationships (optional - contracts can be linked to clients, projects, or portals)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  portal_id uuid REFERENCES public.portals (id) ON DELETE SET NULL,
  
  -- Contract Status and Workflow
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'awaiting_signature', 'partially_signed', 'signed', 'declined', 'expired', 'archived')),
  current_version integer DEFAULT 1,
  
  -- Contract Terms
  total_value decimal(15,2), -- Total contract value
  currency text DEFAULT 'USD',
  payment_terms text, -- Payment schedule and terms
  deposit_amount decimal(15,2), -- Initial deposit amount
  deposit_percentage decimal(5,2), -- Deposit as percentage
  
  -- Timeline
  start_date timestamptz,
  end_date timestamptz,
  due_date timestamptz, -- When contract needs to be signed
  expiration_date timestamptz, -- When contract expires if not signed
  
  -- Signature Settings
  require_all_signatures boolean DEFAULT true,
  signature_order text DEFAULT 'any' CHECK (signature_order IN ('any', 'sequential', 'specific')),
  signature_deadline timestamptz,
  
  -- Email and Notification Settings
  email_subject text,
  email_body text,
  cc_emails text[], -- Array of CC email addresses
  bcc_emails text[], -- Array of BCC email addresses
  reminder_schedule text DEFAULT '3-days', -- When to send reminders
  auto_reminder boolean DEFAULT true,
  
  -- Contract Metadata
  tags text[], -- Array of tags for categorization
  metadata jsonb, -- Additional contract data (milestones, deliverables, etc.)
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  signed_at timestamptz,
  last_activity_at timestamptz
);

-- =====================================================
-- CONTRACT TEMPLATES TABLE (Reusable contract templates)
-- =====================================================
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Template Information
  name text NOT NULL,
  description text,
  category text, -- e.g., "Design", "Marketing", "Consulting", "Legal"
  
  -- Template Content
  template_content text NOT NULL, -- Full template content with placeholders
  template_html text, -- HTML version for rich formatting
  template_variables jsonb, -- Available variables and their descriptions
  
  -- Template Settings
  is_public boolean DEFAULT false, -- Available to all accounts
  is_premium boolean DEFAULT false, -- Premium template
  is_editable boolean DEFAULT true, -- Can be modified by users
  is_featured boolean DEFAULT false,
  
  -- Usage Statistics
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONTRACT SIGNATURES TABLE (Signature tracking)
-- =====================================================
CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts (id) ON DELETE CASCADE,
  
  -- Signature Information
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_role text, -- e.g., "Client", "Contractor", "Witness"
  signature_order integer DEFAULT 0, -- Order in sequential signing
  
  -- Signature Data
  signature_data jsonb, -- Digital signature data (coordinates, image, etc.)
  signature_ip text, -- IP address where signature was made
  signature_user_agent text, -- Browser/device information
  
  -- Signature Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  signed_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  
  -- Email Tracking
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  email_clicked_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONTRACT VERSIONS TABLE (Version control for contracts)
-- =====================================================
CREATE TABLE public.contract_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts (id) ON DELETE CASCADE,
  
  -- Version Information
  version_number integer NOT NULL,
  version_name text, -- e.g., "v2", "Final", "Revision 1"
  
  -- Version Content
  contract_content text NOT NULL, -- Full contract content for this version
  contract_html text, -- HTML version
  contract_pdf_path text, -- Path to PDF for this version
  
  -- Version Metadata
  change_summary text, -- What changed in this version
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(contract_id, version_number)
);

-- =====================================================
-- CONTRACT ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.contract_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'sent', 'viewed', 'signed', 'declined', 'expired', 'archived', 'updated', 'version_created')),
  action text NOT NULL, -- e.g., "created contract", "sent for signature", "signed contract"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Contracts indexes
CREATE INDEX idx_contracts_account_id ON public.contracts(account_id);
CREATE INDEX idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX idx_contracts_portal_id ON public.contracts(portal_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_type ON public.contracts(contract_type);
CREATE INDEX idx_contracts_created_by ON public.contracts(created_by);
CREATE INDEX idx_contracts_created_at ON public.contracts(created_at);
CREATE INDEX idx_contracts_sent_at ON public.contracts(sent_at);
CREATE INDEX idx_contracts_signed_at ON public.contracts(signed_at);
CREATE INDEX idx_contracts_expiration_date ON public.contracts(expiration_date);
CREATE INDEX idx_contracts_name ON public.contracts USING gin(to_tsvector('english', name));
CREATE INDEX idx_contracts_tags ON public.contracts USING gin(tags);

-- Contract templates indexes
CREATE INDEX idx_contract_templates_account_id ON public.contract_templates(account_id);
CREATE INDEX idx_contract_templates_category ON public.contract_templates(category);
CREATE INDEX idx_contract_templates_is_public ON public.contract_templates(is_public);
CREATE INDEX idx_contract_templates_is_premium ON public.contract_templates(is_premium);
CREATE INDEX idx_contract_templates_usage_count ON public.contract_templates(usage_count);

-- Contract signatures indexes
CREATE INDEX idx_contract_signatures_contract_id ON public.contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_signer_email ON public.contract_signatures(signer_email);
CREATE INDEX idx_contract_signatures_status ON public.contract_signatures(status);
CREATE INDEX idx_contract_signatures_signed_at ON public.contract_signatures(signed_at);

-- Contract versions indexes
CREATE INDEX idx_contract_versions_contract_id ON public.contract_versions(contract_id);
CREATE INDEX idx_contract_versions_version_number ON public.contract_versions(version_number);
CREATE INDEX idx_contract_versions_created_by ON public.contract_versions(created_by);

-- Contract activities indexes
CREATE INDEX idx_contract_activities_contract_id ON public.contract_activities(contract_id);
CREATE INDEX idx_contract_activities_account_id ON public.contract_activities(account_id);
CREATE INDEX idx_contract_activities_user_id ON public.contract_activities(user_id);
CREATE INDEX idx_contract_activities_type ON public.contract_activities(activity_type);
CREATE INDEX idx_contract_activities_created_at ON public.contract_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Contracts policies
CREATE POLICY "Users can view contracts in their account" ON public.contracts
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contracts in their account" ON public.contracts
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contracts in their account" ON public.contracts
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Contract templates policies
CREATE POLICY "Users can view contract templates in their account" ON public.contract_templates
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    ) OR is_public = true
  );

CREATE POLICY "Users can create contract templates in their account" ON public.contract_templates
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Contract signatures policies
CREATE POLICY "Users can view contract signatures in their account" ON public.contract_signatures
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage contract signatures in their account" ON public.contract_signatures
  FOR ALL USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Contract versions policies
CREATE POLICY "Users can view contract versions in their account" ON public.contract_versions
  FOR SELECT USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage contract versions in their account" ON public.contract_versions
  FOR ALL USING (
    contract_id IN (
      SELECT id FROM public.contracts WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Contract activities policies
CREATE POLICY "Users can view contract activities in their account" ON public.contract_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contract activities in their account" ON public.contract_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate contract number
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number = 'CON-' || EXTRACT(YEAR FROM now()) || '-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(contract_number FROM 9) AS INTEGER))
       FROM public.contracts 
       WHERE contract_number LIKE 'CON-' || EXTRACT(YEAR FROM now()) || '-%'
       AND account_id = NEW.account_id), 0) + 1::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate contract number
CREATE OR REPLACE TRIGGER on_contract_created
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

-- Function to update contract status based on signatures
CREATE OR REPLACE FUNCTION public.update_contract_status()
RETURNS TRIGGER AS $$
DECLARE
  total_signers INTEGER;
  signed_count INTEGER;
  declined_count INTEGER;
BEGIN
  -- Count total signers and signatures
  SELECT COUNT(*), 
         COUNT(CASE WHEN status = 'signed' THEN 1 END),
         COUNT(CASE WHEN status = 'declined' THEN 1 END)
  INTO total_signers, signed_count, declined_count
  FROM public.contract_signatures 
  WHERE contract_id = COALESCE(NEW.contract_id, OLD.contract_id);
  
  -- Update contract status based on signatures
  IF declined_count > 0 THEN
    UPDATE public.contracts SET status = 'declined' WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
  ELSIF signed_count = total_signers AND total_signers > 0 THEN
    UPDATE public.contracts SET status = 'signed', signed_at = now() WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
  ELSIF signed_count > 0 AND signed_count < total_signers THEN
    UPDATE public.contracts SET status = 'partially_signed' WHERE id = COALESCE(NEW.contract_id, OLD.contract_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update contract status when signatures change
CREATE OR REPLACE TRIGGER on_contract_signature_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_contract_status();

-- Function to auto-assign version number
CREATE OR REPLACE FUNCTION public.assign_version_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number = (
    SELECT COALESCE(MAX(version_number), 0) + 1
    FROM public.contract_versions
    WHERE contract_id = NEW.contract_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign version number
CREATE OR REPLACE TRIGGER on_contract_version_created
  BEFORE INSERT ON public.contract_versions
  FOR EACH ROW EXECUTE FUNCTION public.assign_version_number();

-- Function to update template usage count
CREATE OR REPLACE FUNCTION public.update_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.contract_templates 
    SET usage_count = usage_count + 1,
        last_used_at = now()
    WHERE id = NEW.template_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contract_templates 
    SET usage_count = usage_count - 1
    WHERE id = OLD.template_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update template usage count
CREATE OR REPLACE TRIGGER on_contract_template_usage_change
  AFTER INSERT OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_template_usage_count();

-- Function to check contract expiration
CREATE OR REPLACE FUNCTION public.check_contract_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if contract has expired
  IF NEW.expiration_date IS NOT NULL AND NEW.expiration_date < now() AND NEW.status NOT IN ('signed', 'declined', 'archived') THEN
    UPDATE public.contracts SET status = 'expired' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check contract expiration
CREATE OR REPLACE TRIGGER on_contract_expiration_check
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.check_contract_expiration();

-- Function to update contract's last activity
CREATE OR REPLACE FUNCTION public.update_contract_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contracts 
  SET last_activity_at = now()
  WHERE id = NEW.contract_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update contract last activity when activity is logged
CREATE OR REPLACE TRIGGER on_contract_activity_created
  AFTER INSERT ON public.contract_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_contract_last_activity();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample contracts (uncomment if needed for testing)
/*
INSERT INTO public.contracts (account_id, client_id, project_id, name, description, contract_content, status, total_value, created_by_name) VALUES
  ('your-account-id', 'client-id-1', 'project-id-1', 'Website Redesign Contract', 'Complete website redesign agreement', 'CONTRACT FOR SERVICES\n\nThis agreement is between Your Company and Acme Corp...', 'signed', 15000.00, 'John Smith'),
  ('your-account-id', 'client-id-2', NULL, 'Social Media Management Agreement', 'Ongoing social media management services', 'SOCIAL MEDIA MANAGEMENT AGREEMENT\n\nThis agreement is between Your Company and TechStart Inc...', 'awaiting_signature', 3500.00, 'Sarah Johnson'),
  ('your-account-id', 'client-id-3', NULL, 'Brand Identity Package', 'Complete brand identity package', 'BRAND IDENTITY AGREEMENT\n\nThis agreement is between Your Company and Local Bakery...', 'draft', 8000.00, 'Mike Davis');
*/ 