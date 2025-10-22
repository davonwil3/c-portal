-- Safe Activity Logging Functions (No Triggers)
-- This file contains only the logging functions without triggers to prevent conflicts
-- with existing database triggers that might cause infinite recursion

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_project_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_contract_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_invoice_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_file_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION log_form_activity(UUID, TEXT, TEXT, JSONB, UUID) TO authenticated;
