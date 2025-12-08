-- Make milestone_id nullable in project_tasks table
-- This allows tasks to exist without being assigned to a milestone

-- The milestone_id should already be nullable based on the schema,
-- but this ensures it explicitly and adds a comment for clarity

ALTER TABLE public.project_tasks
ALTER COLUMN milestone_id DROP NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN public.project_tasks.milestone_id IS 'Optional reference to parent milestone. NULL means task is not assigned to any milestone.';

-- Verify the relationship still works
-- Tasks can belong to a milestone or be standalone
-- When milestone is deleted, its tasks are also deleted (CASCADE)

