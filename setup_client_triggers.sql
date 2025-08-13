-- =====================================================
-- SETUP CLIENT COUNT TRIGGERS
-- =====================================================
-- Run this script in your Supabase SQL editor to automatically
-- keep client counts updated when related records change

-- Step 1: Create the main function to update client counts
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

-- Step 2: Create trigger for projects table
CREATE OR REPLACE FUNCTION public.on_project_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS trigger_on_project_change ON public.projects;
CREATE TRIGGER trigger_on_project_change
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.on_project_change();

-- Step 3: Create trigger for invoices table
CREATE OR REPLACE FUNCTION public.on_invoice_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.client_id != NEW.client_id THEN
      PERFORM public.update_client_counts(OLD.client_id);
      PERFORM public.update_client_counts(NEW.client_id);
    ELSIF OLD.status != NEW.status OR OLD.total_amount != NEW.total_amount THEN
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

DROP TRIGGER IF EXISTS trigger_on_invoice_change ON public.invoices;
CREATE TRIGGER trigger_on_invoice_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.on_invoice_change();

-- Step 4: Create trigger for files table
CREATE OR REPLACE FUNCTION public.on_file_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS trigger_on_file_change ON public.files;
CREATE TRIGGER trigger_on_file_change
  AFTER INSERT OR UPDATE OR DELETE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.on_file_change();

-- Step 5: Create trigger for forms table
CREATE OR REPLACE FUNCTION public.on_form_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.update_client_counts(NEW.client_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
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

DROP TRIGGER IF EXISTS trigger_on_form_change ON public.forms;
CREATE TRIGGER trigger_on_form_change
  AFTER INSERT OR UPDATE OR DELETE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.on_form_change();

-- Step 6: Update all existing client counts (run this once)
-- This will populate the count fields for all existing clients
DO $$
DECLARE
  client_record RECORD;
BEGIN
  FOR client_record IN SELECT id FROM public.clients LOOP
    PERFORM public.update_client_counts(client_record.id);
  END LOOP;
END $$;

-- Step 7: Verify the setup
-- Check that client counts are now populated
SELECT 
  id, 
  first_name, 
  last_name, 
  project_count, 
  total_invoices, 
  paid_invoices, 
  unpaid_amount, 
  files_uploaded, 
  forms_submitted 
FROM public.clients 
LIMIT 5; 