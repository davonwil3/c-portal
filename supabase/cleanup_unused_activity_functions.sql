-- Clean up unused SQL functions and simplify the activity system
-- Since we're now only using project_activities table directly

-- Drop the complex get_project_activities function (no longer needed)
DROP FUNCTION IF EXISTS get_project_activities(UUID);

-- Drop any remaining activity logging functions from other tables
DROP FUNCTION IF EXISTS log_file_upload() CASCADE;
DROP FUNCTION IF EXISTS log_file_approval_change() CASCADE;
DROP FUNCTION IF EXISTS log_invoice_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_contract_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_form_submission() CASCADE;

-- Drop any remaining triggers on other activity tables
DROP TRIGGER IF EXISTS file_upload_trigger ON public.files CASCADE;
DROP TRIGGER IF EXISTS file_approval_change_trigger ON public.files CASCADE;
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON public.invoices CASCADE;
DROP TRIGGER IF EXISTS contract_status_change_trigger ON public.contracts CASCADE;
DROP TRIGGER IF EXISTS form_submission_trigger ON public.form_submissions CASCADE;

-- Keep only the safe_update_invoice function for invoice payments
-- (This one is still needed for the invoice payment functionality)

-- Verify cleanup
SELECT 'Activity system simplified - only using project_activities table' as status;
