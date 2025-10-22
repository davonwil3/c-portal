-- Manual fix for invoice activity logging
-- Run this in your Supabase SQL editor

-- 1. First, let's check what activity types are currently allowed
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'project_activities' 
AND table_schema = 'public'
AND column_name = 'activity_type';

-- 2. Update the constraint to allow more activity types
ALTER TABLE public.project_activities 
DROP CONSTRAINT IF EXISTS project_activities_activity_type_check;

ALTER TABLE public.project_activities 
ADD CONSTRAINT project_activities_activity_type_check 
CHECK (activity_type IN (
    'milestone', 'task', 'file', 'message', 'status_change', 
    'member_added', 'member_removed', 'invoice', 'contract', 'form'
));

-- 3. Test inserting an activity manually
INSERT INTO public.project_activities (
    project_id,
    account_id,
    activity_type,
    action,
    metadata
) VALUES (
    '84b02578-76df-40c1-a7e5-16d6938824e1', -- Replace with your actual project ID
    (SELECT account_id FROM public.projects WHERE id = '84b02578-76df-40c1-a7e5-16d6938824e1'),
    'invoice',
    'Test invoice activity',
    jsonb_build_object(
        'invoice_id', 'test-123',
        'invoice_number', 'TEST-001',
        'activity_source', 'invoice'
    )
);

-- 4. Check if the activity was inserted
SELECT * FROM public.project_activities 
WHERE project_id = '84b02578-76df-40c1-a7e5-16d6938824e1'
ORDER BY created_at DESC
LIMIT 5;
