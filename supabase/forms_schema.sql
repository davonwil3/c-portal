-- =====================================================
-- FORMS DATABASE SCHEMA (CONSOLIDATED)
-- =====================================================

-- =====================================================
-- FORM TEMPLATES TABLE (Reusable form templates) - MUST BE FIRST
-- =====================================================
CREATE TABLE public.form_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Template Information
  name text NOT NULL,
  description text,
  category text, -- e.g., "onboarding", "feedback", "approval"
  
  -- Template Data (JSON object containing complete form structure)
  template_data jsonb NOT NULL, -- Complete form structure and fields
  
  -- Template Settings
  is_public boolean DEFAULT false, -- Available to all accounts
  is_featured boolean DEFAULT false,
  
  -- Usage Statistics
  usage_count integer DEFAULT 0,
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- FORMS TABLE (CONSOLIDATED)
-- =====================================================
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Form Information
  title text NOT NULL,
  description text,
  instructions text, -- Form instructions for respondents
  
  -- Form Structure (JSON object containing all form fields and settings)
  form_structure jsonb NOT NULL, -- Complete form structure as JSON
  
  -- Status and Settings
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
  is_template boolean DEFAULT false,
  template_id uuid REFERENCES public.form_templates (id) ON DELETE SET NULL,
  
  -- Relationships (optional - forms can be assigned to clients, projects, or portals)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  portal_id uuid REFERENCES public.portals (id) ON DELETE SET NULL,
  
  -- Access Control
  access_level text DEFAULT 'public' CHECK (access_level IN ('private', 'team', 'client', 'public')),
  password_protected boolean DEFAULT false,
  password_hash text,
  
  -- Submission Settings
  max_submissions integer, -- NULL = unlimited
  submission_deadline timestamptz,
  notify_on_submission boolean DEFAULT true,
  notify_emails text[], -- Array of email addresses to notify
  
  -- Analytics
  total_submissions integer DEFAULT 0,
  total_views integer DEFAULT 0,
  completion_rate decimal(5,2) DEFAULT 0, -- Percentage
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  last_submission_at timestamptz
);

-- =====================================================
-- FORM SUBMISSIONS TABLE (Individual form submissions)
-- =====================================================
CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms (id) ON DELETE CASCADE,
  
  -- Submission Information
  submission_number integer, -- Auto-incrementing submission number for the form
  status text DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'abandoned')),
  
  -- Respondent Information (optional - for authenticated users)
  respondent_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  respondent_name text,
  respondent_email text,
  respondent_ip text,
  user_agent text,
  
  -- Submission Data (JSON object containing all responses)
  responses jsonb NOT NULL, -- All form responses as JSON
  
  -- Submission Metadata
  total_fields integer,
  completed_fields integer,
  completion_percentage decimal(5,2),
  
  -- Time Tracking
  started_at timestamptz,
  completed_at timestamptz,
  time_spent integer, -- seconds
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- FORM ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.form_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.forms (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'published', 'archived', 'viewed', 'submitted', 'edited', 'duplicated', 'deleted')),
  action text NOT NULL, -- e.g., "created form", "published form", "submitted form"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Form templates indexes
CREATE INDEX idx_form_templates_account_id ON public.form_templates(account_id);
CREATE INDEX idx_form_templates_category ON public.form_templates(category);
CREATE INDEX idx_form_templates_is_public ON public.form_templates(is_public);
CREATE INDEX idx_form_templates_usage_count ON public.form_templates(usage_count);
CREATE INDEX idx_form_templates_data ON public.form_templates USING gin(template_data);

-- Forms indexes
CREATE INDEX idx_forms_account_id ON public.forms(account_id);
CREATE INDEX idx_forms_client_id ON public.forms(client_id);
CREATE INDEX idx_forms_project_id ON public.forms(project_id);
CREATE INDEX idx_forms_portal_id ON public.forms(portal_id);
CREATE INDEX idx_forms_status ON public.forms(status);
CREATE INDEX idx_forms_created_by ON public.forms(created_by);
CREATE INDEX idx_forms_created_at ON public.forms(created_at);
CREATE INDEX idx_forms_published_at ON public.forms(published_at);
CREATE INDEX idx_forms_title ON public.forms USING gin(to_tsvector('english', title));
CREATE INDEX idx_forms_structure ON public.forms USING gin(form_structure);

-- Form submissions indexes
CREATE INDEX idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_status ON public.form_submissions(status);
CREATE INDEX idx_form_submissions_respondent_id ON public.form_submissions(respondent_id);
CREATE INDEX idx_form_submissions_created_at ON public.form_submissions(created_at);
CREATE INDEX idx_form_submissions_completed_at ON public.form_submissions(completed_at);
CREATE INDEX idx_form_submissions_responses ON public.form_submissions USING gin(responses);

-- Form activities indexes
CREATE INDEX idx_form_activities_form_id ON public.form_activities(form_id);
CREATE INDEX idx_form_activities_account_id ON public.form_activities(account_id);
CREATE INDEX idx_form_activities_user_id ON public.form_activities(user_id);
CREATE INDEX idx_form_activities_type ON public.form_activities(activity_type);
CREATE INDEX idx_form_activities_created_at ON public.form_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Form templates policies
CREATE POLICY "Users can view form templates in their account" ON public.form_templates
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    ) OR is_public = true
  );

CREATE POLICY "Users can create form templates in their account" ON public.form_templates
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Forms policies
CREATE POLICY "Users can view forms in their account" ON public.forms
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create forms in their account" ON public.forms
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update forms in their account" ON public.forms
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete forms in their account" ON public.forms
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Form submissions policies
CREATE POLICY "Users can view form submissions in their account" ON public.form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM public.forms WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create form submissions in their account" ON public.form_submissions
  FOR INSERT WITH CHECK (
    form_id IN (
      SELECT id FROM public.forms WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Form activities policies
CREATE POLICY "Users can view form activities in their account" ON public.form_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create form activities in their account" ON public.form_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update form submission count
CREATE OR REPLACE FUNCTION public.update_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forms 
    SET total_submissions = total_submissions + 1,
        last_submission_at = now()
    WHERE id = NEW.form_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forms 
    SET total_submissions = total_submissions - 1
    WHERE id = OLD.form_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update form submission count
CREATE OR REPLACE TRIGGER on_form_submission_count_change
  AFTER INSERT OR DELETE ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_form_submission_count();

-- Function to update form completion rate
CREATE OR REPLACE FUNCTION public.update_form_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.forms 
  SET completion_rate = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
      ), 0
    )
    FROM public.form_submissions 
    WHERE form_id = COALESCE(NEW.form_id, OLD.form_id)
  )
  WHERE id = COALESCE(NEW.form_id, OLD.form_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update form completion rate
CREATE OR REPLACE TRIGGER on_form_submission_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_form_completion_rate();

-- Function to auto-assign submission number
CREATE OR REPLACE FUNCTION public.assign_submission_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.submission_number = (
    SELECT COALESCE(MAX(submission_number), 0) + 1
    FROM public.form_submissions
    WHERE form_id = NEW.form_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign submission number
CREATE OR REPLACE TRIGGER on_form_submission_created
  BEFORE INSERT ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_submission_number();

-- Function to update client form count
CREATE OR REPLACE FUNCTION public.update_client_form_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET forms_submitted = forms_submitted + 1
    WHERE id = (
      SELECT client_id FROM public.forms WHERE id = NEW.form_id
    );
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET forms_submitted = forms_submitted - 1
    WHERE id = (
      SELECT client_id FROM public.forms WHERE id = OLD.form_id
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client form count
CREATE OR REPLACE TRIGGER on_form_submission_client_count_change
  AFTER INSERT OR DELETE ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_client_form_count();