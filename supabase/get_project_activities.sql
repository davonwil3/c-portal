-- Function to get all activities for a specific project
-- This aggregates activities from all related tables (contracts, invoices, files, forms, project activities)

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
  -- Project Activities (milestones, tasks, status changes, etc.)
  SELECT 
    pa.id,
    pa.activity_type,
    pa.action,
    pa.metadata,
    pa.created_at,
    'project_activities' as source_table,
    pa.id as source_id,
    COALESCE(p.first_name || ' ' || p.last_name, pa.metadata->>'user_name', 'System') as user_name,
    p.email as user_email
  FROM public.project_activities pa
  LEFT JOIN public.profiles p ON pa.user_id = p.user_id
  WHERE pa.project_id = project_uuid

  UNION ALL

  -- Contract Activities
  SELECT 
    ca.id,
    ca.activity_type,
    ca.action,
    ca.metadata,
    ca.created_at,
    'contract_activities' as source_table,
    ca.id as source_id,
    COALESCE(p.first_name || ' ' || p.last_name, ca.metadata->>'user_name', 'System') as user_name,
    p.email as user_email
  FROM public.contract_activities ca
  LEFT JOIN public.profiles p ON ca.user_id = p.user_id
  LEFT JOIN public.contracts c ON ca.contract_id = c.id
  WHERE c.project_id = project_uuid

  UNION ALL

  -- Invoice Activities
  SELECT 
    ia.id,
    ia.activity_type,
    ia.action,
    ia.metadata,
    ia.created_at,
    'invoice_activities' as source_table,
    ia.id as source_id,
    COALESCE(p.first_name || ' ' || p.last_name, ia.metadata->>'user_name', 'System') as user_name,
    p.email as user_email
  FROM public.invoice_activities ia
  LEFT JOIN public.profiles p ON ia.user_id = p.user_id
  LEFT JOIN public.invoices i ON ia.invoice_id = i.id
  WHERE i.project_id = project_uuid

  UNION ALL

  -- File Activities
  SELECT 
    fa.id,
    fa.activity_type,
    fa.action,
    fa.metadata,
    fa.created_at,
    'file_activities' as source_table,
    fa.id as source_id,
    COALESCE(p.first_name || ' ' || p.last_name, fa.metadata->>'user_name', f.uploaded_by_name, 'System') as user_name,
    p.email as user_email
  FROM public.file_activities fa
  LEFT JOIN public.profiles p ON fa.user_id = p.user_id
  LEFT JOIN public.files f ON fa.file_id = f.id
  WHERE f.project_id = project_uuid

  UNION ALL

  -- Form Activities
  SELECT 
    fa.id,
    fa.activity_type,
    fa.action,
    fa.metadata,
    fa.created_at,
    'form_activities' as source_table,
    fa.id as source_id,
    COALESCE(p.first_name || ' ' || p.last_name, fa.metadata->>'user_name', 'System') as user_name,
    p.email as user_email
  FROM public.form_activities fa
  LEFT JOIN public.profiles p ON fa.user_id = p.user_id
  LEFT JOIN public.forms f ON fa.form_id = f.id
  WHERE f.project_id = project_uuid

  ORDER BY created_at DESC;
$$;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_project_activities_project_id ON public.project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_activities_contract_id ON public.contract_activities(contract_id);
CREATE INDEX IF NOT EXISTS idx_invoice_activities_invoice_id ON public.invoice_activities(invoice_id);
CREATE INDEX IF NOT EXISTS idx_file_activities_file_id ON public.file_activities(file_id);
CREATE INDEX IF NOT EXISTS idx_form_activities_form_id ON public.form_activities(form_id);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_project_activities(UUID) TO authenticated;
