-- =====================================================
-- DROP FILE_TAGS TABLE (since we're using files.tags array)
-- =====================================================

-- Drop the file_tags table and all its dependencies
-- This is safe since we're using the files.tags array column instead

-- 1. Drop RLS policies for file_tags table
DROP POLICY IF EXISTS "Users can view file tags in their account" ON public.file_tags;
DROP POLICY IF EXISTS "Users can manage file tags in their account" ON public.file_tags;

-- 2. Drop indexes for file_tags table
DROP INDEX IF EXISTS idx_file_tags_file_id;
DROP INDEX IF EXISTS idx_file_tags_tag_name;

-- 3. Drop the file_tags table itself
DROP TABLE IF EXISTS public.file_tags;

-- 4. Verify the files.tags array column still exists and works
-- You can test with:
-- SELECT id, name, tags FROM public.files WHERE tags IS NOT NULL LIMIT 5; 