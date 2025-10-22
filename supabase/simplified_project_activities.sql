-- Simplified project activities function - only uses project_activities table
-- This prevents duplicates from multiple activity tables

CREATE OR REPLACE FUNCTION get_project_activities(project_uuid UUID)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  source_table TEXT,
  source_id UUID,
  user_name TEXT,
  user_email TEXT
) 
LANGUAGE SQL
STABLE
AS $$
  -- Only use project_activities table to avoid duplicates
  SELECT 
    pa.id,
    pa.activity_type,
    pa.action,
    pa.metadata,
    pa.created_at,
    'project_activities' as source_table,
    pa.id as source_id,
    COALESCE(
      p.first_name || ' ' || p.last_name, 
      pa.metadata->>'user_name', 
      'System'
    ) as user_name,
    p.email as user_email
  FROM public.project_activities pa
  LEFT JOIN public.profiles p ON pa.user_id = p.user_id
  WHERE pa.project_id = project_uuid
  ORDER BY pa.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_project_activities(UUID) TO authenticated;
