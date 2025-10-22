-- Clean up duplicate activities in project_activities table
-- This removes duplicates based on similar actions within the same minute

-- First, let's see what duplicates exist
WITH duplicates AS (
  SELECT 
    id,
    project_id,
    action,
    user_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        project_id, 
        LOWER(TRIM(action)), 
        user_id, 
        DATE_TRUNC('minute', created_at)
      ORDER BY created_at DESC
    ) as rn
  FROM public.project_activities
  WHERE created_at >= NOW() - INTERVAL '24 hours' -- Only recent activities
)
SELECT 
  COUNT(*) as total_duplicates,
  COUNT(DISTINCT project_id) as projects_with_duplicates
FROM duplicates 
WHERE rn > 1;

-- Remove duplicates (keep the most recent one)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        project_id, 
        LOWER(TRIM(action)), 
        user_id, 
        DATE_TRUNC('minute', created_at)
      ORDER BY created_at DESC
    ) as rn
  FROM public.project_activities
  WHERE created_at >= NOW() - INTERVAL '24 hours'
)
DELETE FROM public.project_activities 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Show remaining activities
SELECT 
  COUNT(*) as total_activities,
  COUNT(DISTINCT project_id) as projects_with_activities
FROM public.project_activities;

-- Show recent activities to verify cleanup
SELECT 
  project_id,
  action,
  user_id,
  created_at,
  metadata->>'user_name' as user_name
FROM public.project_activities 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
