-- Storage Bucket RLS Policies for client-portal-content
-- Run this in your Supabase SQL editor to ensure profile photo uploads work

-- Allow authenticated users to upload files to their account's folder structure
CREATE POLICY "Users can upload files to their account folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-portal-content' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to update files in their account's folder structure
CREATE POLICY "Users can update files in their account folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-portal-content' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to delete files in their account's folder structure
CREATE POLICY "Users can delete files in their account folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-portal-content' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to view files in their account's folder structure
CREATE POLICY "Users can view files in their account folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-portal-content' AND
  (storage.foldername(name))[1] IN (
    SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
  )
);

