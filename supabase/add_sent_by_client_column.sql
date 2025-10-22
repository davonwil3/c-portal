-- Add sent_by_client column to files table
-- This column tracks whether a file was uploaded by a client

ALTER TABLE public.files 
ADD COLUMN IF NOT EXISTS sent_by_client BOOLEAN DEFAULT FALSE;

-- Add index for better performance when filtering by sent_by_client
CREATE INDEX IF NOT EXISTS idx_files_sent_by_client ON public.files(sent_by_client);

-- Update existing files to set sent_by_client based on tags
-- This will set sent_by_client to true for files that have the "uploaded by client" tag
UPDATE public.files 
SET sent_by_client = TRUE 
WHERE tags @> '[{"name": "uploaded by client"}]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN public.files.sent_by_client IS 'Indicates whether the file was uploaded by a client (true) or by team members (false)';
