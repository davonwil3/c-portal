-- Emergency Fix: Disable All Invoice Triggers
-- Run this to immediately stop the infinite recursion

-- Drop all existing triggers on invoices table
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON public.invoices;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices;
DROP TRIGGER IF EXISTS update_invoice_last_activity_trigger ON public.invoices;
DROP TRIGGER IF EXISTS invoice_activity_trigger ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_created ON public.invoices;
DROP TRIGGER IF EXISTS on_invoice_updated ON public.invoices;

-- This will immediately stop the infinite recursion
-- You can then run your activity logging functions safely

-- To verify triggers are gone, run:
-- SELECT * FROM information_schema.triggers WHERE event_object_table = 'invoices';
