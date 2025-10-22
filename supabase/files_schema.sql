-- =====================================================
-- FILES DATABASE SCHEMA
-- =====================================================

-- Enable Row Level Security
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FILES TABLE
-- =====================================================
CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- File Information
  name text NOT NULL,
  original_name text NOT NULL, -- Original filename before processing
  file_type text NOT NULL, -- e.g., "PDF", "PNG", "DOCX"
  mime_type text, -- e.g., "application/pdf", "image/png"
  
  -- File Storage
  storage_path text NOT NULL, -- Path in storage bucket
  storage_bucket text DEFAULT 'files', -- Supabase storage bucket name
  file_size bigint NOT NULL, -- Size in bytes
  file_size_formatted text, -- e.g., "2.4 MB", "456 KB"
  
  -- Relationships (optional - files can be linked to clients, projects, or portals)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  portal_id uuid REFERENCES public.portals (id) ON DELETE SET NULL,
  
  -- Upload Information
  uploaded_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  uploaded_by_name text, -- Cached name for performance
  
  -- Status and Approval
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_required boolean DEFAULT false,
  
  -- File Metadata
  description text,
  tags jsonb, -- Array of tag objects: [{"name": "tag_name", "color": "#color_hex"}]
  metadata jsonb, -- Additional file metadata (dimensions, duration, etc.)
  
  -- Access Control
  is_public boolean DEFAULT false,
  access_level text DEFAULT 'team' CHECK (access_level IN ('private', 'team', 'client', 'public')),
  sent_by_client boolean DEFAULT false, -- Indicates if file was uploaded by client
  
  -- Analytics
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz
);

-- =====================================================
-- FILE VERSIONS TABLE (Version control for files)
-- =====================================================
CREATE TABLE public.file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.files (id) ON DELETE CASCADE,
  
  -- Version Information
  version_number integer NOT NULL,
  version_name text, -- e.g., "v2", "Final", "Revision 1"
  
  -- File Storage
  storage_path text NOT NULL,
  file_size bigint NOT NULL,
  file_size_formatted text,
  
  -- Upload Information
  uploaded_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  upload_reason text, -- Why this version was uploaded
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(file_id, version_number)
);

-- =====================================================
-- FILE COMMENTS TABLE (Comments on files)
-- =====================================================
CREATE TABLE public.file_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.files (id) ON DELETE CASCADE,
  
  -- Comment Information
  content text NOT NULL,
  author_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  author_name text, -- Cached name for performance
  
  -- Comment Metadata
  is_internal boolean DEFAULT false, -- Internal comment vs client-visible
  parent_comment_id uuid REFERENCES public.file_comments (id) ON DELETE CASCADE, -- For threaded comments
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- FILE APPROVALS TABLE (Approval workflow)
-- =====================================================
CREATE TABLE public.file_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.files (id) ON DELETE CASCADE,
  
  -- Approval Information
  approver_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  approver_name text, -- Cached name for performance
  
  -- Approval Details
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  decision text, -- Approval/rejection reason
  decision_date timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- FILE TAGS TABLE (Many-to-Many relationship)
-- =====================================================
CREATE TABLE public.file_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.files (id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(file_id, tag_name)
);

-- =====================================================
-- FILE ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.file_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES public.files (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('upload', 'download', 'view', 'comment', 'approve', 'reject', 'delete', 'restore', 'version_created')),
  action text NOT NULL, -- e.g., "uploaded file", "downloaded file", "approved file"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Files indexes
CREATE INDEX idx_files_account_id ON public.files(account_id);
CREATE INDEX idx_files_client_id ON public.files(client_id);
CREATE INDEX idx_files_project_id ON public.files(project_id);
CREATE INDEX idx_files_portal_id ON public.files(portal_id);
CREATE INDEX idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX idx_files_status ON public.files(status);
CREATE INDEX idx_files_approval_status ON public.files(approval_status);
CREATE INDEX idx_files_file_type ON public.files(file_type);
CREATE INDEX idx_files_created_at ON public.files(created_at);
CREATE INDEX idx_files_last_accessed ON public.files(last_accessed_at);
CREATE INDEX idx_files_sent_by_client ON public.files(sent_by_client);
CREATE INDEX idx_files_name ON public.files USING gin(to_tsvector('english', name));
CREATE INDEX idx_files_tags ON public.files USING gin(tags);

-- File versions indexes
CREATE INDEX idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX idx_file_versions_version_number ON public.file_versions(version_number);
CREATE INDEX idx_file_versions_uploaded_by ON public.file_versions(uploaded_by);

-- File comments indexes
CREATE INDEX idx_file_comments_file_id ON public.file_comments(file_id);
CREATE INDEX idx_file_comments_author_id ON public.file_comments(author_id);
CREATE INDEX idx_file_comments_parent_comment_id ON public.file_comments(parent_comment_id);
CREATE INDEX idx_file_comments_created_at ON public.file_comments(created_at);

-- File approvals indexes
CREATE INDEX idx_file_approvals_file_id ON public.file_approvals(file_id);
CREATE INDEX idx_file_approvals_approver_id ON public.file_approvals(approver_id);
CREATE INDEX idx_file_approvals_status ON public.file_approvals(status);

-- File tags indexes
CREATE INDEX idx_file_tags_file_id ON public.file_tags(file_id);
CREATE INDEX idx_file_tags_tag_name ON public.file_tags(tag_name);

-- File activities indexes
CREATE INDEX idx_file_activities_file_id ON public.file_activities(file_id);
CREATE INDEX idx_file_activities_account_id ON public.file_activities(account_id);
CREATE INDEX idx_file_activities_user_id ON public.file_activities(user_id);
CREATE INDEX idx_file_activities_type ON public.file_activities(activity_type);
CREATE INDEX idx_file_activities_created_at ON public.file_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Files policies
CREATE POLICY "Users can view files in their account" ON public.files
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create files in their account" ON public.files
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in their account" ON public.files
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in their account" ON public.files
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- File versions policies
CREATE POLICY "Users can view file versions in their account" ON public.file_versions
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file versions in their account" ON public.file_versions
  FOR ALL USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- File comments policies
CREATE POLICY "Users can view file comments in their account" ON public.file_comments
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file comments in their account" ON public.file_comments
  FOR ALL USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- File approvals policies
CREATE POLICY "Users can view file approvals in their account" ON public.file_approvals
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file approvals in their account" ON public.file_approvals
  FOR ALL USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- File tags policies
CREATE POLICY "Users can view file tags in their account" ON public.file_tags
  FOR SELECT USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file tags in their account" ON public.file_tags
  FOR ALL USING (
    file_id IN (
      SELECT id FROM public.files WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- File activities policies
CREATE POLICY "Users can view file activities in their account" ON public.file_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create file activities in their account" ON public.file_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update file's last activity
CREATE OR REPLACE FUNCTION public.update_file_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.files 
  SET last_accessed_at = now()
  WHERE id = NEW.file_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update file last activity when activity is logged
CREATE OR REPLACE TRIGGER on_file_activity_created
  AFTER INSERT ON public.file_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_file_last_activity();

-- Function to increment file view count
CREATE OR REPLACE FUNCTION public.increment_file_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activity_type = 'view' THEN
    UPDATE public.files 
    SET view_count = view_count + 1,
        last_accessed_at = now()
    WHERE id = NEW.file_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment view count on view activity
CREATE OR REPLACE TRIGGER on_file_view_activity
  AFTER INSERT ON public.file_activities
  FOR EACH ROW EXECUTE FUNCTION public.increment_file_views();

-- Function to increment file download count
CREATE OR REPLACE FUNCTION public.increment_file_downloads()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activity_type = 'download' THEN
    UPDATE public.files 
    SET download_count = download_count + 1,
        last_accessed_at = now()
    WHERE id = NEW.file_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment download count on download activity
CREATE OR REPLACE TRIGGER on_file_download_activity
  AFTER INSERT ON public.file_activities
  FOR EACH ROW EXECUTE FUNCTION public.increment_file_downloads();

-- Function to update client file count
CREATE OR REPLACE FUNCTION public.update_client_file_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET files_uploaded = files_uploaded + 1
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET files_uploaded = files_uploaded - 1
    WHERE id = OLD.client_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client file count when files are added/removed
CREATE OR REPLACE TRIGGER on_file_client_count_change
  AFTER INSERT OR DELETE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.update_client_file_count();

-- Function to update project file count
CREATE OR REPLACE FUNCTION public.update_project_file_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET total_files = total_files + 1
    WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET total_files = total_files - 1
    WHERE id = OLD.project_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update project file count when files are added/removed
CREATE OR REPLACE TRIGGER on_file_project_count_change
  AFTER INSERT OR DELETE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.update_project_file_count();

-- Function to format file size
CREATE OR REPLACE FUNCTION public.format_file_size(size_bytes bigint)
RETURNS text AS $$
BEGIN
  IF size_bytes < 1024 THEN
    RETURN size_bytes || ' B';
  ELSIF size_bytes < 1024 * 1024 THEN
    RETURN ROUND(size_bytes / 1024.0, 1) || ' KB';
  ELSIF size_bytes < 1024 * 1024 * 1024 THEN
    RETURN ROUND(size_bytes / (1024.0 * 1024.0), 1) || ' MB';
  ELSE
    RETURN ROUND(size_bytes / (1024.0 * 1024.0 * 1024.0), 1) || ' GB';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample files (uncomment if needed for testing)
/*
INSERT INTO public.files (account_id, client_id, project_id, name, original_name, file_type, mime_type, storage_path, file_size, file_size_formatted, uploaded_by_name, approval_status, tags) VALUES
  ('your-account-id', 'client-id-1', 'project-id-1', 'Brand Guidelines.pdf', 'brand-guidelines.pdf', 'PDF', 'application/pdf', 'files/brand-guidelines.pdf', 2516582, '2.4 MB', 'John Smith', 'approved', ARRAY['Branding', 'Guidelines']),
  ('your-account-id', 'client-id-2', NULL, 'Logo Design v2.png', 'logo-v2.png', 'PNG', 'image/png', 'files/logo-v2.png', 1887436, '1.8 MB', 'Sarah Johnson', 'pending', ARRAY['Logo', 'Design']),
  ('your-account-id', 'client-id-1', 'project-id-1', 'Project Requirements.docx', 'requirements.docx', 'DOCX', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'files/requirements.docx', 466944, '456 KB', 'Mike Davis', 'rejected', ARRAY['Requirements', 'Documentation']);
*/ 