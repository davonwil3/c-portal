-- =====================================================
-- Auto Update Overdue Invoices
-- =====================================================
-- This script creates a function and trigger to automatically
-- update invoice status to 'overdue' when the due date has passed
-- =====================================================

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS auto_update_overdue_invoices_trigger ON invoices;
DROP FUNCTION IF EXISTS auto_update_overdue_invoices();

-- Create function to update overdue invoices
CREATE OR REPLACE FUNCTION auto_update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all invoices that are:
  -- 1. Currently in 'sent', 'viewed', or 'partially_paid' status (not already paid/overdue/cancelled)
  -- 2. Due date has passed (less than current date)
  UPDATE invoices
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status IN ('sent', 'viewed', 'partially_paid')
    AND due_date < CURRENT_DATE
    AND due_date IS NOT NULL;
    
  -- Log the number of updated invoices
  RAISE NOTICE 'Updated % invoices to overdue status', (
    SELECT COUNT(*)
    FROM invoices
    WHERE status = 'overdue' AND due_date < CURRENT_DATE
  );
END;
$$;

-- Create a function that runs on each row update/insert
CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the invoice is sent/viewed/partially_paid and due date has passed, mark as overdue
  IF NEW.status IN ('sent', 'viewed', 'partially_paid')
     AND NEW.due_date < CURRENT_DATE 
     AND NEW.due_date IS NOT NULL THEN
    NEW.status = 'overdue';
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires BEFORE INSERT OR UPDATE on invoices
CREATE TRIGGER auto_update_overdue_invoices_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION check_invoice_overdue();

-- Create a scheduled job using pg_cron (if available)
-- This will run daily at 1:00 AM to catch any invoices that became overdue
-- Note: pg_cron extension must be enabled in your Supabase project
-- You can enable it in the Supabase dashboard under Database > Extensions

-- First, ensure pg_cron extension is available (uncomment if needed)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job to run daily at 1:00 AM
-- Uncomment the following lines if pg_cron is enabled:
/*
SELECT cron.schedule(
  'auto-update-overdue-invoices',  -- job name
  '0 1 * * *',                      -- cron schedule (daily at 1:00 AM)
  $$ SELECT auto_update_overdue_invoices(); $$
);
*/

-- Alternative: If pg_cron is not available, you can call this function from your application
-- or use Supabase Edge Functions to run it periodically

COMMENT ON FUNCTION auto_update_overdue_invoices() IS 'Automatically updates pending invoices to overdue when due date has passed';
COMMENT ON FUNCTION check_invoice_overdue() IS 'Trigger function to check and update invoice status on insert/update';

-- Run once immediately to update any existing overdue invoices
SELECT auto_update_overdue_invoices();

