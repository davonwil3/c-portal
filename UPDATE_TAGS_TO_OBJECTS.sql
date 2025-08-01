-- Update tags column to store objects with name and color
-- This migration changes the tags column from text[] to jsonb

-- First, backup existing data (optional)
-- CREATE TABLE files_backup AS SELECT * FROM files;

-- Step 1: Add a new column for the new format
ALTER TABLE public.files 
ADD COLUMN tags_new jsonb;

-- Step 2: Convert existing data
UPDATE public.files 
SET tags_new = (
  SELECT jsonb_agg(
    jsonb_build_object('name', tag, 'color', '#3B82F6')
  )
  FROM unnest(tags) AS tag
)
WHERE tags IS NOT NULL;

-- Step 3: Drop the old column and rename the new one
ALTER TABLE public.files DROP COLUMN tags;
ALTER TABLE public.files RENAME COLUMN tags_new TO tags;

-- Step 4: Add a comment to document the new structure
COMMENT ON COLUMN public.files.tags IS 'Array of tag objects: [{"name": "tag_name", "color": "#color_hex"}]';

-- Step 5: Create a GIN index for better performance when querying JSONB
CREATE INDEX idx_files_tags ON public.files USING gin(tags); 