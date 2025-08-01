-- Add tag_colors column to files table
-- This migration adds a JSONB column to store tag colors persistently

-- Add the tag_colors column
ALTER TABLE public.files 
ADD COLUMN tag_colors jsonb DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.files.tag_colors IS 'Store tag colors as {"tag_name": "color_hex"} for persistent color storage';

-- Create an index for better performance when querying by tag colors
CREATE INDEX idx_files_tag_colors ON public.files USING gin(tag_colors);

-- Update existing files to have empty tag_colors (optional)
-- UPDATE public.files SET tag_colors = '{}'::jsonb WHERE tag_colors IS NULL; 