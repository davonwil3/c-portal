-- Clean up duplicate activities
-- This removes duplicate activities that were created before the fix

-- Find and remove duplicate activities (same action, same user, within 1 minute)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id, action, user_id, DATE_TRUNC('minute', created_at)
      ORDER BY created_at DESC
    ) as rn
  FROM public.project_activities
  WHERE created_at >= NOW() - INTERVAL '1 hour' -- Only recent activities
)
DELETE FROM public.project_activities 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Show remaining activities count
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
