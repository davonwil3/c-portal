-- Fix all activity triggers to prevent duplicates
-- All activities should only be logged in project_activities table
-- This prevents duplicate activities from appearing in the activity feed

-- =====================================================
-- FILE ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for file uploads - ONLY create project_activities
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only log as project activity if file is associated with a project
    -- Skip file_activities to avoid duplicates
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
        NEW.uploaded_by,
        'file',
        CASE 
          WHEN NEW.sent_by_client THEN 'Client uploaded file: ' || NEW.name
          ELSE 'File uploaded: ' || NEW.name
        END,
        jsonb_build_object(
          'file_id', NEW.id,
          'file_name', NEW.name,
          'file_type', NEW.file_type,
          'sent_by_client', NEW.sent_by_client
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for file approval status changes - ONLY create project_activities
CREATE OR REPLACE FUNCTION log_file_approval_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    -- Only log as project activity if file is associated with a project
    -- Skip file_activities to avoid duplicates
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
        NEW.uploaded_by,
        'file',
        'File ' || NEW.approval_status || ': ' || NEW.name,
        jsonb_build_object(
          'file_id', NEW.id,
          'file_name', NEW.name,
          'old_status', OLD.approval_status,
          'new_status', NEW.approval_status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- INVOICE ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for invoice status changes - ONLY create project_activities
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Only log as project activity if invoice is associated with a project
    -- Skip invoice_activities to avoid duplicates
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
        NEW.created_by,
        'invoice',
        'Invoice ' || NEW.status || ': ' || COALESCE(NEW.invoice_number, 'Draft'),
        jsonb_build_object(
          'invoice_id', NEW.id,
          'invoice_number', NEW.invoice_number,
          'invoice_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_amount', NEW.total_amount
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- CONTRACT ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for contract status changes - ONLY create project_activities
CREATE OR REPLACE FUNCTION log_contract_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Only log as project activity if contract is associated with a project
    -- Skip contract_activities to avoid duplicates
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
        NEW.created_by,
        'contract',
        'Contract ' || NEW.status || ': ' || NEW.name,
        jsonb_build_object(
          'contract_id', NEW.id,
          'contract_name', NEW.name,
          'contract_number', NEW.contract_number,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- FORM ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for form submissions - ONLY create project_activities
CREATE OR REPLACE FUNCTION log_form_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  form_project_id UUID;
  form_account_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get project_id and account_id from form
    SELECT project_id, account_id INTO form_project_id, form_account_id
    FROM public.forms
    WHERE id = NEW.form_id;
    
    -- Only log as project activity if form is associated with a project
    -- Skip form_activities to avoid duplicates
    IF form_project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        form_project_id,
        form_account_id,
        NULL, -- Form submissions don't have a user_id
        'form',
        'Form submitted: ' || NEW.submission_number,
        jsonb_build_object(
          'form_id', NEW.form_id,
          'submission_id', NEW.id,
          'submission_number', NEW.submission_number,
          'respondent_name', NEW.respondent_name,
          'completion_percentage', NEW.completion_percentage
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

