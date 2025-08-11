-- Fix storage RLS issue - disable RLS for storage.objects
-- Run this in your Supabase SQL Editor

-- First, drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to view files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Disable RLS completely for storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS but fix the policies, run this instead:
/*
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to do everything
CREATE POLICY "Allow all authenticated users" ON storage.objects
  FOR ALL USING (auth.role() = 'authenticated');
*/ 