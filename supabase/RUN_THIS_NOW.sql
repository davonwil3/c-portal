-- =====================================================
-- COPY THIS ENTIRE FILE AND RUN IT IN SUPABASE SQL EDITOR
-- =====================================================
-- This will fix the overdue invoice automation
-- =====================================================

-- Step 1: Clean up any existing setup
DROP TRIGGER IF EXISTS auto_update_overdue_invoices_trigger ON invoices;
DROP FUNCTION IF EXISTS check_invoice_overdue() CASCADE;
DROP FUNCTION IF EXISTS auto_update_overdue_invoices() CASCADE;

-- Step 2: Create the batch update function
CREATE OR REPLACE FUNCTION auto_update_overdue_invoices()
RETURNS TABLE(updated_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows bigint;
BEGIN
  -- Update all invoices that should be overdue
  UPDATE invoices
  SET 
    status = 'overdue',
    updated_at = NOW()
  WHERE 
    status IN ('sent', 'viewed', 'partially_paid')
    AND due_date < CURRENT_DATE
    AND due_date IS NOT NULL;
    
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RAISE NOTICE 'Updated % invoices to overdue status', affected_rows;
  
  RETURN QUERY SELECT affected_rows;
END;
$$;

-- Step 3: Create the trigger function
CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If the invoice should be overdue, mark it
  IF NEW.status IN ('sent', 'viewed', 'partially_paid')
     AND NEW.due_date < CURRENT_DATE 
     AND NEW.due_date IS NOT NULL THEN
    NEW.status = 'overdue';
    NEW.updated_at = NOW();
    RAISE NOTICE 'Invoice % automatically marked as overdue', NEW.invoice_number;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER auto_update_overdue_invoices_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION check_invoice_overdue();

-- Step 5: Immediately update any existing overdue invoices
SELECT * FROM auto_update_overdue_invoices();

-- Step 6: Show results
SELECT 
  'Setup Complete!' as message,
  COUNT(*) FILTER (WHERE status = 'overdue') as total_overdue_invoices,
  COUNT(*) FILTER (WHERE status IN ('sent', 'viewed', 'partially_paid') AND due_date < CURRENT_DATE) as should_be_overdue
FROM invoices;

-- Step 7: Show invoices that are now overdue
SELECT 
  invoice_number,
  status,
  issue_date::date,
  due_date::date,
  CURRENT_DATE - due_date::date as days_overdue,
  total_amount
FROM invoices
WHERE status = 'overdue'
ORDER BY due_date;

