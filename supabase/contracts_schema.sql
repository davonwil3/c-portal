-- =====================================================
-- CONTRACTS DATABASE SCHEMA (SIMPLIFIED)
-- =====================================================

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
  contract_content jsonb NOT NULL, -- Full contract content as JSON structure
  contract_html text, -- HTML version for rich formatting (optional)
  contract_pdf_path text, -- Path to generated PDF file (optional)
  
  -- Contract Type
  contract_type text DEFAULT 'custom' CHECK (contract_type IN ('custom', 'web-design', 'social-media', 'consulting', 'contractor', 'retainer', 'sow', 'nda')),
  
  -- Relationships (optional - contracts can be linked to clients, projects, or portals)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  portal_id uuid REFERENCES public.portals (id) ON DELETE SET NULL,
  source_contract_id uuid REFERENCES public.contracts (id) ON DELETE SET NULL, -- If created from another contract
  
  -- Contract Status and Workflow
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'awaiting_signature', 'partially_signed', 'signed', 'declined', 'expired', 'archived')),
  
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
  
  -- Signature Information (Simplified - directly in contracts table)
  signer_name text,
  signer_email text,
  signer_role text, -- e.g., "Client", "Contractor", "Witness"
  signature_data jsonb, -- Digital signature data (coordinates, image, etc.)
  signature_ip text, -- IP address where signature was made
  signature_user_agent text, -- Browser/device information
  signature_status text DEFAULT 'pending' CHECK (signature_status IN ('pending', 'signed', 'declined')),
  signed_at timestamptz,
  declined_at timestamptz,
  decline_reason text,
  
  -- Email and Notification Settings
  email_subject text,
  email_body text,
  cc_emails text[], -- Array of CC email addresses
  bcc_emails text[], -- Array of BCC email addresses
  reminder_schedule text DEFAULT '3-days', -- When to send reminders
  auto_reminder boolean DEFAULT true,
  email_sent_at timestamptz,
  email_opened_at timestamptz,
  email_clicked_at timestamptz,
  
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
  last_activity_at timestamptz
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
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'sent', 'viewed', 'signed', 'declined', 'expired', 'archived', 'updated')),
  action text NOT NULL, -- e.g., "created contract", "sent for signature", "signed contract"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CONTRACT TEMPLATES TABLE
-- =====================================================
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Template Information
  name text NOT NULL,
  description text,
  template_number text UNIQUE, -- Auto-generated template number
  
  -- Template Content (Based on contract structure)
  template_content jsonb NOT NULL, -- Contract template content as JSON structure
  template_html text, -- HTML version for rich formatting
  template_pdf_path text, -- Path to generated PDF file
  
  -- Template Type
  template_type text DEFAULT 'custom' CHECK (template_type IN ('custom', 'web-design', 'social-media', 'consulting', 'contractor', 'retainer', 'sow', 'nda')),
  
  -- Source Contract (if created from existing contract)
  source_contract_id uuid REFERENCES public.contracts (id) ON DELETE SET NULL,
  
  -- Template Settings
  is_public boolean DEFAULT false, -- Whether template is available to all accounts
  is_default boolean DEFAULT false, -- Whether this is a default template for the account
  
  -- Template Metadata
  tags text[], -- Array of tags for categorization
  metadata jsonb, -- Additional template data
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX idx_contracts_signer_email ON public.contracts(signer_email);
CREATE INDEX idx_contracts_signature_status ON public.contracts(signature_status);
CREATE INDEX idx_contracts_content ON public.contracts USING gin(contract_content);

-- Contract activities indexes
CREATE INDEX idx_contract_activities_contract_id ON public.contract_activities(contract_id);
CREATE INDEX idx_contract_activities_account_id ON public.contract_activities(account_id);
CREATE INDEX idx_contract_activities_user_id ON public.contract_activities(user_id);
CREATE INDEX idx_contract_activities_type ON public.contract_activities(activity_type);
CREATE INDEX idx_contract_activities_created_at ON public.contract_activities(created_at);

-- Contract templates indexes
CREATE INDEX idx_contract_templates_account_id ON public.contract_templates(account_id);
CREATE INDEX idx_contract_templates_source_contract_id ON public.contract_templates(source_contract_id);
CREATE INDEX idx_contract_templates_type ON public.contract_templates(template_type);
CREATE INDEX idx_contract_templates_created_by ON public.contract_templates(created_by);
CREATE INDEX idx_contract_templates_created_at ON public.contract_templates(created_at);
CREATE INDEX idx_contract_templates_is_public ON public.contract_templates(is_public);
CREATE INDEX idx_contract_templates_is_default ON public.contract_templates(is_default);
CREATE INDEX idx_contract_templates_name ON public.contract_templates USING gin(to_tsvector('english', name));
CREATE INDEX idx_contract_templates_tags ON public.contract_templates USING gin(tags);
CREATE INDEX idx_contract_templates_content ON public.contract_templates USING gin(template_content);

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

CREATE POLICY "Users can delete contracts in their account" ON public.contracts
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
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

-- Contract templates policies
CREATE POLICY "Users can view contract templates in their account and public templates" ON public.contract_templates
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

CREATE POLICY "Users can update contract templates in their account" ON public.contract_templates
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contract templates in their account" ON public.contract_templates
  FOR DELETE USING (
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
  NEW.contract_number = 'CON-' || EXTRACT(YEAR FROM now())::TEXT || '-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(contract_number FROM 9) AS INTEGER))
       FROM public.contracts 
       WHERE contract_number LIKE 'CON-' || EXTRACT(YEAR FROM now())::TEXT || '-%'
       AND account_id = NEW.account_id), 0) + 1::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate contract number
CREATE OR REPLACE TRIGGER on_contract_created
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

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
-- CONTRACT TEMPLATES FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate template number
CREATE OR REPLACE FUNCTION public.generate_template_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.template_number = 'TPL-' || EXTRACT(YEAR FROM now())::TEXT || '-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(template_number FROM 9) AS INTEGER))
       FROM public.contract_templates 
       WHERE template_number LIKE 'TPL-' || EXTRACT(YEAR FROM now())::TEXT || '-%'
       AND account_id = NEW.account_id), 0) + 1::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate template number
CREATE OR REPLACE TRIGGER on_template_created
  BEFORE INSERT ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.generate_template_number();

-- Function to update template's last used timestamp
CREATE OR REPLACE FUNCTION public.update_template_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.contract_templates 
  SET last_used_at = now()
  WHERE id = NEW.source_contract_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update template last used when contract is created from template
CREATE OR REPLACE TRIGGER on_contract_created_from_template
  AFTER INSERT ON public.contracts
  FOR EACH ROW 
  WHEN (NEW.source_contract_id IS NOT NULL)
  EXECUTE FUNCTION public.update_template_last_used();

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