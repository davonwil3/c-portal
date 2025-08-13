-- =====================================================
-- CLIENT COUNT AUTOMATIC UPDATES
-- =====================================================
-- This file contains functions and triggers to automatically
-- keep client counts updated when related records change

-- =====================================================
-- FUNCTION: Update client counts for a specific client
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_client_counts(target_client_id uuid)
RETURNS void AS $$
DECLARE
  project_count_val integer;
  total_invoices_val integer;
  paid_invoices_val integer;
  unpaid_amount_val decimal(10,2);
  files_count_val integer;
  forms_count_val integer;
BEGIN
  -- Get project count
  SELECT COUNT(*) INTO project_count_val
  FROM public.projects
  WHERE client_id = target_client_id;
  
  -- Get total invoices count
  SELECT COUNT(*) INTO total_invoices_val
  FROM public.invoices
  WHERE client_id = target_client_id;
  
  -- Get paid invoices count
  SELECT COUNT(*) INTO paid_invoices_val
  FROM public.invoices
  WHERE client_id = target_client_id
    AND status = 'paid';
  
  -- Get unpaid amount
  SELECT COALESCE(SUM(total_amount), 0) INTO unpaid_amount_val
  FROM public.invoices
  WHERE client_id = target_client_id
    AND status != 'paid';
  
  -- Get files count
  SELECT COUNT(*) INTO files_count_val
  FROM public.files
  WHERE client_id = target_client_id;
  
  -- Get forms count
  SELECT COUNT(*) INTO forms_count_val
  FROM public.forms
  WHERE client_id = target_client_id;
  
  -- Update the client record
  UPDATE public.clients
  SET 
    project_count = project_count_val,
    total_invoices = total_invoices_val,
    paid_invoices = paid_invoices_val,
    unpaid_amount = unpaid_amount_val,
    files_uploaded = files_count_val,
    forms_submitted = forms_count_val,
    updated_at = now()
  WHERE id = target_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Update client counts for all clients
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_all_client_counts()
RETURNS void AS $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN SELECT id FROM public.clients LOOP
    PERFORM public.update_client_counts(client_record.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR PROJECTS TABLE
-- =====================================================

-- Function to handle project changes
CREATE OR REPLACE FUNCTION public.on_project_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client counts when a project is inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If client_id changed, update both old and new client
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.update_client_counts(OLD.client_id);
      PERFORM public.update_client_counts(NEW.client_id);
    ELSE
      PERFORM public.update_client_counts(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_client_counts(OLD.client_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_on_project_change ON public.projects;
CREATE TRIGGER trigger_on_project_change
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.on_project_change();

-- =====================================================
-- TRIGGERS FOR INVOICES TABLE
-- =====================================================

-- Function to handle invoice changes
CREATE OR REPLACE FUNCTION public.on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client counts when an invoice is inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If client_id changed, update both old and new client
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.update_client_counts(OLD.client_id);
      PERFORM public.update_client_counts(NEW.client_id);
    -- If status changed, update client counts (affects paid_invoices and unpaid_amount)
    ELSIF OLD.status != NEW.status THEN
      PERFORM public.update_client_counts(NEW.client_id);
    -- If total_amount changed, update client counts (affects unpaid_amount)
    ELSIF OLD.total_amount != NEW.total_amount THEN
      PERFORM public.update_client_counts(NEW.client_id);
    ELSE
      PERFORM public.update_client_counts(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_client_counts(OLD.client_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on invoices table
DROP TRIGGER IF EXISTS trigger_on_invoice_change ON public.invoices;
CREATE TRIGGER trigger_on_invoice_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.on_invoice_change();

-- =====================================================
-- TRIGGERS FOR FILES TABLE
-- =====================================================

-- Function to handle file changes
CREATE OR REPLACE FUNCTION public.on_file_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client counts when a file is inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If client_id changed, update both old and new client
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.update_client_counts(OLD.client_id);
      PERFORM public.update_client_counts(NEW.client_id);
    ELSE
      PERFORM public.update_client_counts(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_client_counts(OLD.client_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on files table
DROP TRIGGER IF EXISTS trigger_on_file_change ON public.files;
CREATE TRIGGER trigger_on_file_change
  AFTER INSERT OR UPDATE OR DELETE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.on_file_change();

-- =====================================================
-- TRIGGERS FOR FORMS TABLE
-- =====================================================

-- Function to handle form changes
CREATE OR REPLACE FUNCTION public.on_form_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update client counts when a form is inserted, updated, or deleted
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If client_id changed, update both old and new client
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.update_client_counts(OLD.client_id);
      PERFORM public.update_client_counts(NEW.client_id);
    ELSE
      PERFORM public.update_client_counts(NEW.client_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.update_client_counts(OLD.client_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on forms table
DROP TRIGGER IF EXISTS trigger_on_form_change ON public.forms;
CREATE TRIGGER trigger_on_form_change
  AFTER INSERT OR UPDATE OR DELETE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.on_form_change();

-- =====================================================
-- INITIAL DATA UPDATE
-- =====================================================
-- Run this once to update all existing client counts
-- SELECT public.update_all_client_counts();

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
-- To update counts for a specific client:
-- SELECT public.update_client_counts('client-uuid-here');

-- To update counts for all clients:
-- SELECT public.update_all_client_counts();

-- To see current client counts:
-- SELECT id, first_name, last_name, project_count, total_invoices, paid_invoices, unpaid_amount, files_uploaded, forms_submitted FROM public.clients; 