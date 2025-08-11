-- Proper storage policies for authenticated users
-- Run this in your Supabase SQL Editor

-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Policy to allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
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

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 