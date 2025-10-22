-- Sample Activity Population Script
-- This script adds some sample activities to demonstrate the activity system
-- Run this after setting up the activity logging functions

-- Sample project activities
INSERT INTO public.project_activities (project_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  p.id as project_id,
  p.account_id,
  'milestone' as activity_type,
  'Created milestone: Project Kickoff' as action,
  jsonb_build_object(
    'milestone_title', 'Project Kickoff',
    'description', 'Initial project setup and planning phase'
  ) as metadata,
  NOW() - INTERVAL '2 days' as created_at
FROM public.projects p
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1' -- Replace with actual project ID
LIMIT 1;

INSERT INTO public.project_activities (project_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  p.id as project_id,
  p.account_id,
  'task' as activity_type,
  'Completed task: Initial Setup' as action,
  jsonb_build_object(
    'task_title', 'Initial Setup',
    'status', 'completed'
  ) as metadata,
  NOW() - INTERVAL '1 day' as created_at
FROM public.projects p
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1' -- Replace with actual project ID
LIMIT 1;

-- Sample file activities (if you have files)
INSERT INTO public.file_activities (file_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  f.id as file_id,
  f.account_id,
  'upload' as activity_type,
  'Uploaded file: ' || f.name as action,
  jsonb_build_object(
    'file_name', f.name,
    'file_type', f.file_type,
    'file_size', f.file_size
  ) as metadata,
  f.created_at
FROM public.files f
WHERE f.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1' -- Replace with actual project ID
LIMIT 3;

-- Sample contract activities (if you have contracts)
INSERT INTO public.contract_activities (contract_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  c.id as contract_id,
  c.account_id,
  'created' as activity_type,
  'Created contract: ' || c.name as action,
  jsonb_build_object(
    'contract_name', c.name,
    'contract_number', c.contract_number,
    'status', c.status
  ) as metadata,
  c.created_at
FROM public.contracts c
WHERE c.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1' -- Replace with actual project ID
LIMIT 2;

-- Sample invoice activities (if you have invoices)
INSERT INTO public.invoice_activities (invoice_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  i.id as invoice_id,
  i.account_id,
  'created' as activity_type,
  'Created invoice: ' || COALESCE(i.invoice_number, 'Draft') as action,
  jsonb_build_object(
    'invoice_number', i.invoice_number,
    'invoice_title', i.title,
    'total_amount', i.total_amount,
    'status', i.status
  ) as metadata,
  i.created_at
FROM public.invoices i
WHERE i.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1' -- Replace with actual project ID
LIMIT 2;
