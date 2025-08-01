-- =====================================================
-- CLIENTS AND PORTALS DATABASE SCHEMA
-- =====================================================

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_modules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CLIENTS TABLE
-- =====================================================
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Basic Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  company text,
  phone text,
  
  -- Portal Information
  portal_url text UNIQUE, -- e.g., "acme-co" or "acme.clientportalhq.com"
  
  -- Status and Metadata
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'pending')),
  avatar_initials text, -- e.g., "SJ" for Sarah Johnson
  
  -- Financial Information
  total_invoices integer DEFAULT 0,
  paid_invoices integer DEFAULT 0,
  unpaid_amount decimal(10,2) DEFAULT 0,
  
  -- Activity Metrics
  files_uploaded integer DEFAULT 0,
  forms_submitted integer DEFAULT 0,
  project_count integer DEFAULT 0,
  
  -- Timestamps
  joined_date timestamptz DEFAULT now(),
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- CLIENT TAGS TABLE (Many-to-Many relationship)
-- =====================================================
CREATE TABLE public.client_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients (id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  color text DEFAULT '#6B7280', -- Color for the tag
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(client_id, tag_name)
);

-- =====================================================
-- CLIENT ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.client_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('file', 'payment', 'message', 'form', 'login', 'portal_access')),
  action text NOT NULL, -- e.g., "uploaded contract.pdf", "paid invoice #1234"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- PORTALS TABLE
-- =====================================================
CREATE TABLE public.portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  
  -- Basic Information
  name text NOT NULL,
  description text,
  url text UNIQUE NOT NULL, -- e.g., "acme.clientportalhq.com"
  
  -- Status and Configuration
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'archived')),
  brand_color text DEFAULT '#3C3CFF',
  welcome_text text,
  
  -- Access Control
  access_type text DEFAULT 'invite' CHECK (access_type IN ('public', 'invite', 'password')),
  password text, -- Hashed password if password protected
  has_expiry boolean DEFAULT false,
  expiry_days integer DEFAULT 30,
  expires_at timestamptz,
  
  -- Analytics
  view_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PORTAL MODULES TABLE (Modules enabled for each portal)
-- =====================================================
CREATE TABLE public.portal_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES public.portals (id) ON DELETE CASCADE,
  
  -- Module Configuration
  module_name text NOT NULL CHECK (module_name IN ('timeline', 'files', 'forms', 'invoices', 'messages', 'ai')),
  is_enabled boolean DEFAULT true,
  settings jsonb, -- Module-specific settings
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(portal_id, module_name)
);

-- =====================================================
-- PORTAL INVITES TABLE (For invite-only portals)
-- =====================================================
CREATE TABLE public.portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid REFERENCES public.portals (id) ON DELETE CASCADE,
  
  -- Invite Details
  email text NOT NULL,
  invite_token text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  
  -- Timestamps
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Clients indexes
CREATE INDEX idx_clients_account_id ON public.clients(account_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_company ON public.clients(company);
CREATE INDEX idx_clients_portal_url ON public.clients(portal_url);
CREATE INDEX idx_clients_last_activity ON public.clients(last_activity_at);

-- Client tags indexes
CREATE INDEX idx_client_tags_client_id ON public.client_tags(client_id);
CREATE INDEX idx_client_tags_tag_name ON public.client_tags(tag_name);

-- Client activities indexes
CREATE INDEX idx_client_activities_client_id ON public.client_activities(client_id);
CREATE INDEX idx_client_activities_account_id ON public.client_activities(account_id);
CREATE INDEX idx_client_activities_type ON public.client_activities(activity_type);
CREATE INDEX idx_client_activities_created_at ON public.client_activities(created_at);

-- Portals indexes
CREATE INDEX idx_portals_account_id ON public.portals(account_id);
CREATE INDEX idx_portals_client_id ON public.portals(client_id);
CREATE INDEX idx_portals_status ON public.portals(status);
CREATE INDEX idx_portals_url ON public.portals(url);

-- Portal modules indexes
CREATE INDEX idx_portal_modules_portal_id ON public.portal_modules(portal_id);
CREATE INDEX idx_portal_modules_name ON public.portal_modules(module_name);

-- Portal invites indexes
CREATE INDEX idx_portal_invites_portal_id ON public.portal_invites(portal_id);
CREATE INDEX idx_portal_invites_email ON public.portal_invites(email);
CREATE INDEX idx_portal_invites_token ON public.portal_invites(invite_token);
CREATE INDEX idx_portal_invites_status ON public.portal_invites(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Clients policies
CREATE POLICY "Users can view clients in their account" ON public.clients
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create clients in their account" ON public.clients
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update clients in their account" ON public.clients
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete clients in their account" ON public.clients
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Client tags policies
CREATE POLICY "Users can view client tags in their account" ON public.client_tags
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.clients WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage client tags in their account" ON public.client_tags
  FOR ALL USING (
    client_id IN (
      SELECT id FROM public.clients WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Client activities policies
CREATE POLICY "Users can view client activities in their account" ON public.client_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create client activities in their account" ON public.client_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete client activities in their account" ON public.client_activities
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Portals policies
CREATE POLICY "Users can view portals in their account" ON public.portals
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create portals in their account" ON public.portals
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update portals in their account" ON public.portals
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete portals in their account" ON public.portals
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Portal modules policies
CREATE POLICY "Users can view portal modules in their account" ON public.portal_modules
  FOR SELECT USING (
    portal_id IN (
      SELECT id FROM public.portals WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage portal modules in their account" ON public.portal_modules
  FOR ALL USING (
    portal_id IN (
      SELECT id FROM public.portals WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Portal invites policies
CREATE POLICY "Users can view portal invites in their account" ON public.portal_invites
  FOR SELECT USING (
    portal_id IN (
      SELECT id FROM public.portals WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage portal invites in their account" ON public.portal_invites
  FOR ALL USING (
    portal_id IN (
      SELECT id FROM public.portals WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update client's last activity
CREATE OR REPLACE FUNCTION public.update_client_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.clients 
  SET last_activity_at = now()
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client last activity when activity is logged
CREATE OR REPLACE TRIGGER on_client_activity_created
  AFTER INSERT ON public.client_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_client_last_activity();

-- Function to update portal view count
CREATE OR REPLACE FUNCTION public.increment_portal_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.portals 
  SET view_count = view_count + 1,
      last_accessed_at = now()
  WHERE id = NEW.portal_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate portal URL slug
CREATE OR REPLACE FUNCTION public.generate_portal_url(client_name text)
RETURNS text AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  RETURN lower(regexp_replace(regexp_replace(client_name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample clients (uncomment if needed for testing)
/*
INSERT INTO public.clients (account_id, first_name, last_name, email, company, phone, portal_url, status, avatar_initials, total_invoices, paid_invoices, unpaid_amount, files_uploaded, forms_submitted, project_count, joined_date) VALUES
  ('your-account-id', 'Sarah', 'Johnson', 'sarah@acmecorp.com', 'Acme Corp', '+1 (555) 123-4567', 'acme-co', 'active', 'SJ', 12, 10, 5400.00, 23, 8, 3, '2024-01-15'),
  ('your-account-id', 'Mike', 'Chen', 'mike@techstart.io', 'TechStart Inc', '+1 (555) 987-6543', 'techstart', 'active', 'MC', 8, 8, 0.00, 15, 5, 5, '2024-02-20');
*/

-- =====================================================
-- MIGRATION: Add color column to existing client_tags table
-- =====================================================

-- Add color column to existing client_tags table (run this if table already exists)
-- ALTER TABLE public.client_tags ADD COLUMN IF NOT EXISTS color text DEFAULT '#6B7280';

-- Update existing tags with default colors based on standard tags
-- UPDATE public.client_tags 
-- SET color = CASE 
--   WHEN LOWER(tag_name) = 'vip' THEN '#FFD700'
--   WHEN LOWER(tag_name) = 'enterprise' THEN '#4F46E5'
--   WHEN LOWER(tag_name) = 'startup' THEN '#10B981'
--   WHEN LOWER(tag_name) = 'design' THEN '#F59E0B'
--   WHEN LOWER(tag_name) = 'marketing' THEN '#EC4899'
--   WHEN LOWER(tag_name) = 'retainer' THEN '#8B5CF6'
--   WHEN LOWER(tag_name) = 'completed' THEN '#6B7280'
--   WHEN LOWER(tag_name) = 'new' THEN '#3B82F6'
--   WHEN LOWER(tag_name) = 'priority' THEN '#EF4444'
--   WHEN LOWER(tag_name) = 'long-term' THEN '#059669'
--   ELSE '#6B7280'
-- END
-- WHERE color IS NULL OR color = '#6B7280'; 