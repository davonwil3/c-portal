-- Check bucket configuration
-- Run this in your Supabase SQL Editor

-- Check if the files bucket exists
SELECT * FROM storage.buckets WHERE id = 'files';

-- Check bucket settings
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'files';

-- If the bucket doesn't exist, you'll need to create it through the Supabase dashboard:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "Create a new bucket"
-- 3. Name: files
-- 4. Public: false (private)
-- 5. File size limit: 50MB (or your preferred limit)
-- 6. Allowed MIME types: */* (or specific types like text/html, image/*, etc.) 