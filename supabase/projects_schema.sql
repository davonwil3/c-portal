-- =====================================================
-- PROJECTS DATABASE SCHEMA
-- =====================================================

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients (id) ON DELETE CASCADE,
  
  -- Basic Information
  name text NOT NULL,
  description text,
  
  -- Status and Progress
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'on-hold', 'completed', 'archived')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Dates
  start_date timestamptz,
  due_date timestamptz,
  completed_date timestamptz,
  
  -- Portal Integration
  portal_id uuid REFERENCES public.portals (id) ON DELETE SET NULL,
  
  -- Metrics
  total_messages integer DEFAULT 0,
  total_files integer DEFAULT 0,
  total_invoices integer DEFAULT 0,
  total_milestones integer DEFAULT 0,
  completed_milestones integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_activity_at timestamptz
);

-- =====================================================
-- PROJECT TAGS TABLE (Many-to-Many relationship)
-- =====================================================
CREATE TABLE public.project_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(project_id, tag_name)
);

-- =====================================================
-- PROJECT MILESTONES TABLE
-- =====================================================
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  
  -- Basic Information
  title text NOT NULL,
  description text,
  
  -- Status and Progress
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Dates
  due_date timestamptz,
  completed_date timestamptz,
  
  -- Client Communication
  client_note text,
  internal_note text,
  
  -- Ordering
  sort_order integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PROJECT TASKS TABLE
-- =====================================================
CREATE TABLE public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES public.project_milestones (id) ON DELETE CASCADE,
  
  -- Basic Information
  title text NOT NULL,
  description text,
  
  -- Status and Assignment
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done', 'cancelled')),
  assignee_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Dates
  due_date timestamptz,
  completed_date timestamptz,
  
  -- Priority and Ordering
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  sort_order integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PROJECT MEMBERS TABLE (Team members assigned to project)
-- =====================================================
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  
  -- Role and Permissions
  role text DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  permissions jsonb, -- Specific permissions for the project
  
  -- Timestamps
  joined_at timestamptz DEFAULT now(),
  
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- PROJECT ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('milestone', 'task', 'file', 'message', 'status_change', 'member_added', 'member_removed')),
  action text NOT NULL, -- e.g., "created milestone", "completed task", "uploaded file"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Projects indexes
CREATE INDEX idx_projects_account_id ON public.projects(account_id);
CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_portal_id ON public.projects(portal_id);
CREATE INDEX idx_projects_due_date ON public.projects(due_date);
CREATE INDEX idx_projects_last_activity ON public.projects(last_activity_at);

-- Project tags indexes
CREATE INDEX idx_project_tags_project_id ON public.project_tags(project_id);
CREATE INDEX idx_project_tags_tag_name ON public.project_tags(tag_name);

-- Project milestones indexes
CREATE INDEX idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX idx_project_milestones_due_date ON public.project_milestones(due_date);
CREATE INDEX idx_project_milestones_sort_order ON public.project_milestones(sort_order);

-- Project tasks indexes
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_milestone_id ON public.project_tasks(milestone_id);
CREATE INDEX idx_project_tasks_assignee_id ON public.project_tasks(assignee_id);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_project_tasks_priority ON public.project_tasks(priority);
CREATE INDEX idx_project_tasks_due_date ON public.project_tasks(due_date);

-- Project members indexes
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- Project activities indexes
CREATE INDEX idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX idx_project_activities_account_id ON public.project_activities(account_id);
CREATE INDEX idx_project_activities_user_id ON public.project_activities(user_id);
CREATE INDEX idx_project_activities_type ON public.project_activities(activity_type);
CREATE INDEX idx_project_activities_created_at ON public.project_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Projects policies
CREATE POLICY "Users can view projects in their account" ON public.projects
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their account" ON public.projects
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their account" ON public.projects
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their account" ON public.projects
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Project tags policies
CREATE POLICY "Users can view project tags in their account" ON public.project_tags
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage project tags in their account" ON public.project_tags
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Project milestones policies
CREATE POLICY "Users can view project milestones in their account" ON public.project_milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage project milestones in their account" ON public.project_milestones
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete project milestones in their account" ON public.project_milestones
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Project tasks policies
CREATE POLICY "Users can view project tasks in their account" ON public.project_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage project tasks in their account" ON public.project_tasks
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete project tasks in their account" ON public.project_tasks
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members in their account" ON public.project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage project members in their account" ON public.project_members
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Project activities policies
CREATE POLICY "Users can view project activities in their account" ON public.project_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project activities in their account" ON public.project_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update project progress based on milestones
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects 
  SET progress = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
      ), 0
    )
    FROM public.project_milestones 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  ),
  completed_milestones = (
    SELECT COUNT(*) 
    FROM public.project_milestones 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
    AND status = 'completed'
  ),
  total_milestones = (
    SELECT COUNT(*) 
    FROM public.project_milestones 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update project progress when milestones change
CREATE OR REPLACE TRIGGER on_milestone_status_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_project_progress();

-- Function to update milestone progress based on tasks
CREATE OR REPLACE FUNCTION public.update_milestone_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.project_milestones 
  SET progress = (
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN status = 'done' THEN 1 END) * 100.0 / COUNT(*))
      ), 0
    )
    FROM public.project_tasks 
    WHERE milestone_id = COALESCE(NEW.milestone_id, OLD.milestone_id)
  )
  WHERE id = COALESCE(NEW.milestone_id, OLD.milestone_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update milestone progress when tasks change
CREATE OR REPLACE TRIGGER on_task_status_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_milestone_progress();

-- Function to update project's last activity
CREATE OR REPLACE FUNCTION public.update_project_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects 
  SET last_activity_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update project last activity when activity is logged
CREATE OR REPLACE TRIGGER on_project_activity_created
  AFTER INSERT ON public.project_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_project_last_activity();

-- Function to auto-assign project creator as owner
CREATE OR REPLACE FUNCTION public.assign_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign project creator as owner
CREATE OR REPLACE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.assign_project_owner();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample projects (uncomment if needed for testing)
/*
INSERT INTO public.projects (account_id, client_id, name, description, status, progress, due_date) VALUES
  ('your-account-id', 'client-id-1', 'Website Redesign', 'Complete website redesign with modern UI/UX', 'active', 65, '2024-03-15'),
  ('your-account-id', 'client-id-2', 'Brand Identity', 'Complete brand identity package', 'completed', 100, '2024-02-28'),
  ('your-account-id', 'client-id-3', 'Marketing Campaign', 'Q2 marketing campaign development', 'on-hold', 30, '2024-04-01');
*/ 