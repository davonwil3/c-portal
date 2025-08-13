-- =====================================================
-- TEST CLIENT COUNT TRIGGERS
-- =====================================================
-- Run this after setting up the triggers to verify they work

-- Step 1: Check current client counts
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
ORDER BY first_name 
LIMIT 5;

-- Step 2: Test project creation (if you have a test client)
-- Replace 'your-test-client-id' with an actual client ID from your database
-- INSERT INTO public.projects (name, description, client_id, status, account_id) 
-- VALUES ('Test Project', 'Testing client count triggers', 'your-test-client-id', 'active', 'your-account-id');

-- Step 3: Test invoice creation (if you have a test client)
-- Replace 'your-test-client-id' with an actual client ID from your database
-- INSERT INTO public.invoices (title, client_id, project_id, status, total_amount, account_id) 
-- VALUES ('Test Invoice', 'your-test-client-id', NULL, 'draft', 100.00, 'your-account-id');

-- Step 4: Check that counts updated automatically
-- SELECT 
--   id, 
--   first_name, 
--   last_name, 
--   project_count, 
--   total_invoices, 
--   paid_invoices, 
--   unpaid_amount, 
--   files_uploaded, 
--   forms_submitted 
-- FROM public.clients 
-- WHERE id = 'your-test-client-id';

-- Step 5: Test invoice status change
-- UPDATE public.invoices 
-- SET status = 'paid' 
-- WHERE title = 'Test Invoice';

-- Step 6: Check that paid_invoices and unpaid_amount updated
-- SELECT 
--   id, 
--   first_name, 
--   last_name, 
--   project_count, 
--   total_invoices, 
--   paid_invoices, 
--   unpaid_amount, 
--   files_uploaded, 
--   forms_submitted 
-- FROM public.clients 
-- WHERE id = 'your-test-client-id';

-- Step 7: Clean up test data (optional)
-- DELETE FROM public.invoices WHERE title = 'Test Invoice';
-- DELETE FROM public.projects WHERE name = 'Test Project';

-- Step 8: Verify final counts
-- SELECT 
--   id, 
--   first_name, 
--   last_name, 
--   project_count, 
--   total_invoices, 
--   paid_invoices, 
--   unpaid_amount, 
--   files_uploaded, 
--   forms_submitted 
-- FROM public.clients 
-- WHERE id = 'your-test-client-id'; 