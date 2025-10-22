-- Remove duplicate activity logging triggers
-- This will prevent multiple activity entries for the same action

-- Drop any remaining file upload triggers that might cause duplicates
DROP TRIGGER IF EXISTS file_upload_trigger ON public.files CASCADE;
DROP TRIGGER IF EXISTS file_approval_change_trigger ON public.files CASCADE;

-- Drop any remaining invoice triggers
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON public.invoices CASCADE;

-- Drop any remaining contract triggers  
DROP TRIGGER IF EXISTS contract_status_change_trigger ON public.contracts CASCADE;

-- Drop any remaining form triggers
DROP TRIGGER IF EXISTS form_submission_trigger ON public.form_submissions CASCADE;

-- Drop the functions that were causing duplicates
DROP FUNCTION IF EXISTS log_file_upload() CASCADE;
DROP FUNCTION IF EXISTS log_file_approval_change() CASCADE;
DROP FUNCTION IF EXISTS log_invoice_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_contract_status_change() CASCADE;
DROP FUNCTION IF EXISTS log_form_submission() CASCADE;

-- Check what triggers still exist
SELECT 
    trigger_name, 
    event_object_table,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table IN ('files', 'invoices', 'contracts', 'form_submissions')
ORDER BY event_object_table, trigger_name;

-- This should eliminate duplicate activities
SELECT 'Duplicate activity triggers removed successfully' as status;
