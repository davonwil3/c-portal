-- Fix storage policy to work with current upload paths
-- Run this in your Supabase SQL Editor

-- First, drop the existing problematic policy
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;

-- Create a new policy that allows authenticated users to upload to the files bucket
-- without requiring the folder structure to match account_id
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Also update the view policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to view files" ON storage.objects;
CREATE POLICY "Allow authenticated users to view files" ON storage.objects
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Update update policy
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Update delete policy
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'files'
  );

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 