-- Comprehensive Activity Logging Triggers
-- This script adds triggers to automatically log activities when they happen

-- =====================================================
-- PROJECT ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for project status changes
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.project_activities (
      project_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.id,
      NEW.account_id,
      'status_change',
      'Project status changed: ' || OLD.status || ' → ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'project_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER project_status_change_trigger
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();

-- =====================================================
-- FILE ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for file uploads
CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log file activity
    INSERT INTO public.file_activities (
      file_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.id,
      NEW.account_id,
      'upload',
      'Uploaded file: ' || NEW.name,
      jsonb_build_object(
        'file_name', NEW.name,
        'file_size', NEW.file_size,
        'file_type', NEW.file_type,
        'sent_by_client', NEW.sent_by_client
      )
    );
    
    -- Also log as project activity if file is associated with a project
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
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

CREATE TRIGGER file_upload_trigger
  AFTER INSERT ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_upload();

-- Trigger for file approval status changes
CREATE OR REPLACE FUNCTION log_file_approval_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    -- Log file activity
    INSERT INTO public.file_activities (
      file_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.id,
      NEW.account_id,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'approve'
        WHEN NEW.approval_status = 'rejected' THEN 'reject'
        ELSE 'updated'
      END,
      'File ' || NEW.approval_status || ': ' || NEW.name,
      jsonb_build_object(
        'file_name', NEW.name,
        'old_status', OLD.approval_status,
        'new_status', NEW.approval_status
      )
    );
    
    -- Also log as project activity if file is associated with a project
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
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

CREATE TRIGGER file_approval_change_trigger
  AFTER UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_approval_change();

-- =====================================================
-- INVOICE ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for invoice status changes
CREATE OR REPLACE FUNCTION log_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log invoice activity
    INSERT INTO public.invoice_activities (
      invoice_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.id,
      NEW.account_id,
      CASE 
        WHEN NEW.status = 'paid' THEN 'paid'
        WHEN NEW.status = 'overdue' THEN 'overdue'
        WHEN NEW.status = 'sent' THEN 'sent'
        ELSE 'updated'
      END,
      'Invoice ' || NEW.status || ': ' || COALESCE(NEW.invoice_number, 'Draft'),
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'invoice_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'total_amount', NEW.total_amount
      )
    );
    
    -- Also log as project activity if invoice is associated with a project
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
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

CREATE TRIGGER invoice_status_change_trigger
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION log_invoice_status_change();

-- =====================================================
-- CONTRACT ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for contract status changes
CREATE OR REPLACE FUNCTION log_contract_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log contract activity
    INSERT INTO public.contract_activities (
      contract_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.id,
      NEW.account_id,
      CASE 
        WHEN NEW.status = 'signed' THEN 'signed'
        WHEN NEW.status = 'sent' THEN 'sent'
        WHEN NEW.status = 'declined' THEN 'declined'
        ELSE 'updated'
      END,
      'Contract ' || NEW.status || ': ' || NEW.name,
      jsonb_build_object(
        'contract_name', NEW.name,
        'contract_number', NEW.contract_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    
    -- Also log as project activity if contract is associated with a project
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
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

CREATE TRIGGER contract_status_change_trigger
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_status_change();

-- =====================================================
-- FORM ACTIVITY TRIGGERS
-- =====================================================

-- Trigger for form submissions
CREATE OR REPLACE FUNCTION log_form_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  form_project_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get project_id from form
    SELECT project_id INTO form_project_id
    FROM public.forms
    WHERE id = NEW.form_id;
    
    -- Log form activity
    INSERT INTO public.form_activities (
      form_id,
      account_id,
      activity_type,
      action,
      metadata
    ) VALUES (
      NEW.form_id,
      (SELECT account_id FROM public.forms WHERE id = NEW.form_id),
      'submitted',
      'Form submitted: ' || NEW.submission_number,
      jsonb_build_object(
        'submission_number', NEW.submission_number,
        'respondent_name', NEW.respondent_name,
        'completion_percentage', NEW.completion_percentage
      )
    );
    
    -- Also log as project activity if form is associated with a project
    IF form_project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        form_project_id,
        (SELECT account_id FROM public.forms WHERE id = NEW.form_id),
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

CREATE TRIGGER form_submission_trigger
  AFTER INSERT ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION log_form_submission();
