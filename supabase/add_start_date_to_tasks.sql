-- Add start_date field to project_tasks table
ALTER TABLE public.project_tasks
ADD COLUMN IF NOT EXISTS start_date timestamptz;

-- Add index for start_date for better query performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_start_date ON public.project_tasks(start_date);

-- Add comment
COMMENT ON COLUMN public.project_tasks.start_date IS 'Task start date for timeline and scheduling';

