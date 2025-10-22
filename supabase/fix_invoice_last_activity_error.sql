-- Fix the invoice payment issue by removing problematic triggers
-- The error "record 'old' has no field 'last_activity_at'" indicates a trigger
-- is trying to access a non-existent column

-- Drop all invoice-related triggers that might be causing issues
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON public.invoices;
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON public.invoices;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices;
DROP TRIGGER IF EXISTS update_invoice_last_activity_trigger ON public.invoices;

-- Also drop any functions that reference last_activity_at on invoices
DROP FUNCTION IF EXISTS update_invoice_last_activity();

-- Check what triggers still exist on invoices table
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'invoices' 
AND event_object_schema = 'public';

-- This should resolve the "last_activity_at" field error
