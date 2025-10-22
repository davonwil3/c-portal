-- =====================================================
-- Test & Troubleshoot Overdue Invoice Automation
-- =====================================================
-- Run these queries to verify the setup and test functionality
-- =====================================================

-- 1. Check if the functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name IN ('auto_update_overdue_invoices', 'check_invoice_overdue')
ORDER BY routine_name;

-- Expected: You should see both functions listed

-- 2. Check if the trigger exists and is enabled
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_update_overdue_invoices_trigger';

-- Expected: You should see the trigger with BEFORE INSERT OR UPDATE

-- 3. View all invoices with their status and due date
SELECT 
  id,
  invoice_number,
  status,
  issue_date::date,
  due_date::date,
  CASE 
    WHEN due_date < CURRENT_DATE THEN 'PAST DUE'
    WHEN due_date = CURRENT_DATE THEN 'DUE TODAY'
    ELSE 'NOT DUE'
  END as due_status,
  CURRENT_DATE as today,
  due_date < CURRENT_DATE as is_overdue
FROM invoices
ORDER BY due_date DESC;

-- 4. Find invoices that SHOULD be overdue but aren't
SELECT 
  id,
  invoice_number,
  status,
  due_date::date,
  CURRENT_DATE - due_date::date as days_overdue
FROM invoices
WHERE 
  status IN ('sent', 'viewed', 'partially_paid')
  AND due_date < CURRENT_DATE
  AND due_date IS NOT NULL
ORDER BY due_date;

-- Expected: Should return empty if trigger is working
-- If you see results, these invoices should be marked as overdue

-- 5. Manually run the batch update function to fix existing invoices
SELECT auto_update_overdue_invoices();

-- 6. Check how many invoices were updated (run this after step 5)
SELECT 
  COUNT(*) as overdue_count
FROM invoices
WHERE status = 'overdue';

-- 7. Test the trigger by creating a test invoice with past due date
-- UNCOMMENT AND RUN THIS TO TEST:
/*
INSERT INTO invoices (
  user_id,
  invoice_number,
  status,
  issue_date,
  due_date,
  total_amount,
  subtotal_amount
)
VALUES (
  (SELECT id FROM auth.users LIMIT 1), -- Use your actual user_id
  'TEST-OVERDUE-001',
  'sent', -- This should automatically change to 'overdue'
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE - INTERVAL '5 days', -- 5 days overdue
  100.00,
  100.00
);

-- Now check if it was automatically marked as overdue
SELECT 
  invoice_number,
  status,
  due_date::date,
  created_at
FROM invoices
WHERE invoice_number = 'TEST-OVERDUE-001';
*/

-- Expected: Status should be 'overdue', not 'sent'

-- 8. Test updating an existing invoice to have past due date
-- UNCOMMENT AND RUN THIS TO TEST (replace YOUR_INVOICE_ID):
/*
UPDATE invoices
SET 
  due_date = CURRENT_DATE - INTERVAL '3 days',
  status = 'sent'
WHERE id = 'YOUR_INVOICE_ID';

-- Check if it was automatically marked as overdue
SELECT 
  id,
  invoice_number,
  status,
  due_date::date
FROM invoices
WHERE id = 'YOUR_INVOICE_ID';
*/

-- Expected: Status should change to 'overdue'

-- 9. Clean up test invoice (if you created one)
-- UNCOMMENT TO DELETE TEST INVOICE:
/*
DELETE FROM invoices WHERE invoice_number = 'TEST-OVERDUE-001';
*/

-- 10. Check trigger execution permissions
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  proowner::regrole as owner
FROM pg_proc
WHERE proname IN ('auto_update_overdue_invoices', 'check_invoice_overdue');

-- 11. View recent invoice activity
SELECT 
  invoice_number,
  status,
  due_date::date,
  updated_at,
  created_at
FROM invoices
ORDER BY updated_at DESC
LIMIT 20;

-- =====================================================
-- TROUBLESHOOTING STEPS
-- =====================================================
-- If the trigger still doesn't work:

-- Step 1: Drop and recreate everything
DROP TRIGGER IF EXISTS auto_update_overdue_invoices_trigger ON invoices;
DROP FUNCTION IF EXISTS check_invoice_overdue();
DROP FUNCTION IF EXISTS auto_update_overdue_invoices();

-- Step 2: Then re-run the auto_update_overdue_invoices.sql script

-- Step 3: Verify RLS policies aren't blocking the update
SELECT * FROM pg_policies WHERE tablename = 'invoices';

-- Step 4: Check if there are any other triggers that might interfere
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'invoices'
ORDER BY action_order;

