-- Activity Logging Functions and Triggers
-- This file contains functions and triggers to automatically log activities
-- when various actions happen across the system

-- =====================================================
-- PROJECT ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log project activities
CREATE OR REPLACE FUNCTION log_project_activity(
  p_project_id UUID,
  p_activity_type TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  account_id_val UUID;
BEGIN
  -- Get account_id from project
  SELECT account_id INTO account_id_val
  FROM public.projects
  WHERE id = p_project_id;
  
  -- Insert activity
  INSERT INTO public.project_activities (
    project_id,
    account_id,
    user_id,
    activity_type,
    action,
    metadata
  ) VALUES (
    p_project_id,
    account_id_val,
    p_user_id,
    p_activity_type,
    p_action,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  -- Update project last_activity_at
  UPDATE public.projects
  SET last_activity_at = NOW()
  WHERE id = p_project_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- CONTRACT ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log contract activities
CREATE OR REPLACE FUNCTION log_contract_activity(
  p_contract_id UUID,
  p_activity_type TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  account_id_val UUID;
BEGIN
  -- Get account_id from contract
  SELECT account_id INTO account_id_val
  FROM public.contracts
  WHERE id = p_contract_id;
  
  -- Insert activity
  INSERT INTO public.contract_activities (
    contract_id,
    account_id,
    user_id,
    activity_type,
    action,
    metadata
  ) VALUES (
    p_contract_id,
    account_id_val,
    p_user_id,
    p_activity_type,
    p_action,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- INVOICE ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log invoice activities
CREATE OR REPLACE FUNCTION log_invoice_activity(
  p_invoice_id UUID,
  p_activity_type TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  account_id_val UUID;
BEGIN
  -- Get account_id from invoice
  SELECT account_id INTO account_id_val
  FROM public.invoices
  WHERE id = p_invoice_id;
  
  -- Insert activity
  INSERT INTO public.invoice_activities (
    invoice_id,
    account_id,
    user_id,
    activity_type,
    action,
    metadata
  ) VALUES (
    p_invoice_id,
    account_id_val,
    p_user_id,
    p_activity_type,
    p_action,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- FILE ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log file activities
CREATE OR REPLACE FUNCTION log_file_activity(
  p_file_id UUID,
  p_activity_type TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  account_id_val UUID;
BEGIN
  -- Get account_id from file
  SELECT account_id INTO account_id_val
  FROM public.files
  WHERE id = p_file_id;
  
  -- Insert activity
  INSERT INTO public.file_activities (
    file_id,
    account_id,
    user_id,
    activity_type,
    action,
    metadata
  ) VALUES (
    p_file_id,
    account_id_val,
    p_user_id,
    p_activity_type,
    p_action,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- FORM ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log form activities
CREATE OR REPLACE FUNCTION log_form_activity(
  p_form_id UUID,
  p_activity_type TEXT,
  p_action TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  account_id_val UUID;
BEGIN
  -- Get account_id from form
  SELECT account_id INTO account_id_val
  FROM public.forms
  WHERE id = p_form_id;
  
  -- Insert activity
  INSERT INTO public.form_activities (
    form_id,
    account_id,
    user_id,
    activity_type,
    action,
    metadata
  ) VALUES (
    p_form_id,
    account_id_val,
    p_user_id,
    p_activity_type,
    p_action,
    p_metadata
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- AUTOMATIC ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for project milestones
CREATE OR REPLACE FUNCTION trigger_log_milestone_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_project_activity(
      NEW.project_id,
      'milestone',
      'Created milestone: ' || NEW.title,
      jsonb_build_object(
        'milestone_id', NEW.id,
        'milestone_title', NEW.title,
        'due_date', NEW.due_date
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM log_project_activity(
        NEW.project_id,
        'milestone',
        'Updated milestone status: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')',
        jsonb_build_object(
          'milestone_id', NEW.id,
          'milestone_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER milestone_activity_trigger
  AFTER INSERT OR UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_milestone_activity();

-- Trigger for project tasks
CREATE OR REPLACE FUNCTION trigger_log_task_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_project_activity(
      NEW.project_id,
      'task',
      'Created task: ' || NEW.title,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'milestone_id', NEW.milestone_id,
        'priority', NEW.priority
      )
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      PERFORM log_project_activity(
        NEW.project_id,
        'task',
        'Updated task status: ' || NEW.title || ' (' || OLD.status || ' → ' || NEW.status || ')',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_task_activity();

-- Trigger for file uploads (DISABLED to prevent conflicts with existing triggers)
-- CREATE OR REPLACE FUNCTION trigger_log_file_activity()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   IF TG_OP = 'INSERT' THEN
--     PERFORM log_file_activity(
--       NEW.id,
--       'upload',
--       'Uploaded file: ' || NEW.name,
--       jsonb_build_object(
--         'file_name', NEW.name,
--         'file_size', NEW.file_size,
--         'file_type', NEW.file_type,
--         'sent_by_client', NEW.sent_by_client
--       )
--     );
--     
--     -- Also log as project activity if file is associated with a project
--     IF NEW.project_id IS NOT NULL THEN
--       PERFORM log_project_activity(
--         NEW.project_id,
--         'file',
--         'File uploaded: ' || NEW.name,
--         jsonb_build_object(
--           'file_id', NEW.id,
--           'file_name', NEW.name,
--           'file_type', NEW.file_type,
--           'sent_by_client', NEW.sent_by_client
--         )
--       );
--     END IF;
--   ELSIF TG_OP = 'UPDATE' THEN
--     IF OLD.approval_status != NEW.approval_status THEN
--       PERFORM log_file_activity(
--         NEW.id,
--         CASE 
--           WHEN NEW.approval_status = 'approved' THEN 'approve'
--           WHEN NEW.approval_status = 'rejected' THEN 'reject'
--           ELSE 'updated'
--         END,
--         'File ' || NEW.approval_status || ': ' || NEW.name,
--         jsonb_build_object(
--           'file_name', NEW.name,
--           'old_status', OLD.approval_status,
--           'new_status', NEW.approval_status
--         )
--       );
--     END IF;
--   END IF;
--   RETURN COALESCE(NEW, OLD);
-- END;
-- $$;

-- CREATE TRIGGER file_activity_trigger
--   AFTER INSERT OR UPDATE ON public.files
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_log_file_activity();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_project_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_contract_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_invoice_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_file_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_form_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
