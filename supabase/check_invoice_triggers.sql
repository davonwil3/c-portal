-- Check for any remaining references to last_activity_at in invoices
-- This will help identify what's causing the error

-- Check all triggers on invoices table
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'invoices' 
AND event_object_schema = 'public';

-- Check all functions that might reference invoices.last_activity_at
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition LIKE '%last_activity_at%'
AND routine_definition LIKE '%invoices%';

-- Check if invoices table actually has last_activity_at column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
AND column_name = 'last_activity_at';
