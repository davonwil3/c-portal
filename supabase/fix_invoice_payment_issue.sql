-- Temporarily disable invoice triggers to fix payment issues
-- Run this if invoice payments are failing

-- Drop the problematic invoice status change trigger
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON public.invoices;

-- Also drop any other invoice-related triggers that might be causing issues
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON public.invoices;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices;

-- Check if there are any other invoice triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'invoices' 
AND event_object_schema = 'public';

-- This should allow invoice payments to work without trigger conflicts
