-- Storage policies for the files bucket
-- Run this in your Supabase SQL Editor

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

-- Check if files bucket exists, if not create it
-- Note: Bucket creation should be done through Supabase dashboard or API
-- This is just a reference for the bucket structure

-- Bucket should have these settings:
-- Name: files
-- Public: false (private bucket)
-- File size limit: 50MB (or your preferred limit)
-- Allowed MIME types: */* (or specific types like text/html, image/*, etc.) 