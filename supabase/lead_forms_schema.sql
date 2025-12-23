-- =====================================================
-- LEAD FORMS DATABASE SCHEMA
-- Similar to forms schema but specifically for lead workflow
-- =====================================================

-- =====================================================
-- LEAD FORMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_forms (
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
  
  -- Form Type (Lead or Project)
  form_type text DEFAULT 'Lead' CHECK (form_type IN ('Lead', 'Project')),
  
  -- Relationships (optional - forms can be assigned to projects)
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  
  -- Access Control
  access_level text DEFAULT 'public' CHECK (access_level IN ('private', 'team', 'public')),
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
  
  -- Embed Link
  embed_link text,
  
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
-- LEAD FORM SUBMISSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES public.lead_forms (id) ON DELETE CASCADE,
  
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
  
  -- Tag for organization (New, Qualified, Reviewed, etc.)
  tag text DEFAULT 'New',
  tag_color text DEFAULT '#f59e0b',
  
  -- Time Tracking
  started_at timestamptz,
  completed_at timestamptz,
  time_spent integer, -- seconds
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.lead_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_form_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Lead forms indexes
CREATE INDEX IF NOT EXISTS idx_lead_forms_account_id ON public.lead_forms(account_id);
CREATE INDEX IF NOT EXISTS idx_lead_forms_project_id ON public.lead_forms(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_forms_status ON public.lead_forms(status);
CREATE INDEX IF NOT EXISTS idx_lead_forms_form_type ON public.lead_forms(form_type);
CREATE INDEX IF NOT EXISTS idx_lead_forms_created_by ON public.lead_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_lead_forms_created_at ON public.lead_forms(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_forms_published_at ON public.lead_forms(published_at);
CREATE INDEX IF NOT EXISTS idx_lead_forms_title ON public.lead_forms USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_lead_forms_structure ON public.lead_forms USING gin(form_structure);

-- Lead form submissions indexes
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_form_id ON public.lead_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_status ON public.lead_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_tag ON public.lead_form_submissions(tag);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_respondent_id ON public.lead_form_submissions(respondent_id);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_created_at ON public.lead_form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_completed_at ON public.lead_form_submissions(completed_at);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_responses ON public.lead_form_submissions USING gin(responses);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Lead forms policies
CREATE POLICY "Users can view lead forms in their account" ON public.lead_forms
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lead forms in their account" ON public.lead_forms
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lead forms in their account" ON public.lead_forms
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lead forms in their account" ON public.lead_forms
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Lead form submissions policies
CREATE POLICY "Users can view lead form submissions in their account" ON public.lead_form_submissions
  FOR SELECT USING (
    form_id IN (
      SELECT id FROM public.lead_forms WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create lead form submissions in their account" ON public.lead_form_submissions
  FOR INSERT WITH CHECK (
    form_id IN (
      SELECT id FROM public.lead_forms WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update lead form submissions in their account" ON public.lead_form_submissions
  FOR UPDATE USING (
    form_id IN (
      SELECT id FROM public.lead_forms WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update lead form submission count
CREATE OR REPLACE FUNCTION public.update_lead_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.lead_forms 
    SET total_submissions = total_submissions + 1,
        last_submission_at = now()
    WHERE id = NEW.form_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.lead_forms 
    SET total_submissions = total_submissions - 1
    WHERE id = OLD.form_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update lead form submission count
DROP TRIGGER IF EXISTS on_lead_form_submission_count_change ON public.lead_form_submissions;
CREATE TRIGGER on_lead_form_submission_count_change
  AFTER INSERT OR DELETE ON public.lead_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_form_submission_count();

-- Function to update lead form completion rate
CREATE OR REPLACE FUNCTION public.update_lead_form_completion_rate()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lead_forms 
  SET completion_rate = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
      ), 0
    )
    FROM public.lead_form_submissions 
    WHERE form_id = COALESCE(NEW.form_id, OLD.form_id)
  )
  WHERE id = COALESCE(NEW.form_id, OLD.form_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update lead form completion rate
DROP TRIGGER IF EXISTS on_lead_form_submission_status_change ON public.lead_form_submissions;
CREATE TRIGGER on_lead_form_submission_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.lead_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_form_completion_rate();

-- Function to auto-assign submission number
CREATE OR REPLACE FUNCTION public.assign_lead_submission_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.submission_number = (
    SELECT COALESCE(MAX(submission_number), 0) + 1
    FROM public.lead_form_submissions
    WHERE form_id = NEW.form_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-assign submission number
DROP TRIGGER IF EXISTS on_lead_form_submission_created ON public.lead_form_submissions;
CREATE TRIGGER on_lead_form_submission_created
  BEFORE INSERT ON public.lead_form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.assign_lead_submission_number();
