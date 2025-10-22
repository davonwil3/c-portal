-- Manual Activity Population Script (Safe Version)
-- This script manually inserts activities without triggering any existing functions
-- Run this after setting up the safe activity logging functions

-- First, let's check if we have any existing activities to avoid duplicates
-- Sample project activities (manual insert)
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
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 1
ON CONFLICT DO NOTHING;

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
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample file activities (if you have files) - Manual insert
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
WHERE f.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Sample contract activities (if you have contracts) - Manual insert
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
WHERE c.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 2
ON CONFLICT DO NOTHING;

-- Sample invoice activities (if you have invoices) - Manual insert
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
WHERE i.project_id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 2
ON CONFLICT DO NOTHING;

-- Add some additional sample activities for testing
INSERT INTO public.project_activities (project_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  p.id as project_id,
  p.account_id,
  'status_change' as activity_type,
  'Project status changed: draft → active' as action,
  jsonb_build_object(
    'old_status', 'draft',
    'new_status', 'active'
  ) as metadata,
  NOW() - INTERVAL '3 hours' as created_at
FROM public.projects p
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.project_activities (project_id, account_id, activity_type, action, metadata, created_at)
SELECT 
  p.id as project_id,
  p.account_id,
  'message' as activity_type,
  'New message: Project requirements updated' as action,
  jsonb_build_object(
    'message_preview', 'Updated project requirements based on client feedback'
  ) as metadata,
  NOW() - INTERVAL '1 hour' as created_at
FROM public.projects p
WHERE p.id = '84b02578-76df-40c1-a7e5-16d6938824e1'
LIMIT 1
ON CONFLICT DO NOTHING;
