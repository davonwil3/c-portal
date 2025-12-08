-- Fix file upload trigger to only create project_activities entry
-- This prevents duplicate activities when uploading files

CREATE OR REPLACE FUNCTION log_file_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Only log as project activity if file is associated with a project
    -- Skip file_activities to avoid duplicates (we only want project_activities)
    IF NEW.project_id IS NOT NULL THEN
      INSERT INTO public.project_activities (
        project_id,
        account_id,
        user_id,
        activity_type,
        action,
        metadata
      ) VALUES (
        NEW.project_id,
        NEW.account_id,
        NEW.uploaded_by,
        'file',
        CASE 
          WHEN NEW.sent_by_client THEN 'Client uploaded file: ' || NEW.name
          ELSE 'File uploaded: ' || NEW.name
        END,
        jsonb_build_object(
          'file_id', NEW.id,
          'file_name', NEW.name,
          'file_type', NEW.file_type,
          'sent_by_client', NEW.sent_by_client
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

