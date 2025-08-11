-- Storage policies for a PUBLIC files bucket
-- Run this in your Supabase SQL Editor

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to public bucket
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Policy to allow anyone to view files in public bucket
CREATE POLICY "Allow public access to view files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files'
  );

-- Policy to allow authenticated users to update files
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Policy to allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Alternative: If you want to make the bucket completely public (no RLS)
-- Run this instead of the above policies:
/*
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Disable RLS for completely public access
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
*/ 