# Supabase Storage Setup Guide

## Creating the Storage Bucket

To enable file uploads and downloads, you need to create a storage bucket in your Supabase project.

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar

### Step 2: Create the Bucket
1. Click **"Create a new bucket"**
2. Enter the following details:
   - **Name**: `files`
   - **Public bucket**: ✅ Check this box (allows public access to files)
   - **File size limit**: `50MB` (or your preferred limit)
   - **Allowed MIME types**: Leave empty for all types, or specify like: `image/*,application/pdf,text/*`

3. Click **"Create bucket"**

### Step 3: Set Up Storage Policies
After creating the bucket, you need to set up storage policies (NOT RLS):

1. Go to **Storage** → **Policies**
2. Click on the `files` bucket
3. Click **"New Policy"** to add policies one by one

#### Policy 1: Allow authenticated users to upload files
- **Policy Name**: `Allow authenticated users to upload files`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'files'
```

#### Policy 2: Allow users to view files in their account
- **Policy Name**: `Allow users to view files in their account`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'files' AND 
(storage.foldername(name))[1] IN (
  SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
)
```

#### Policy 3: Allow users to update files in their account
- **Policy Name**: `Allow users to update files in their account`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'files' AND 
(storage.foldername(name))[1] IN (
  SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
)
```

#### Policy 4: Allow users to delete files in their account
- **Policy Name**: `Allow users to delete files in their account`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'files' AND 
(storage.foldername(name))[1] IN (
  SELECT account_id::text FROM public.profiles WHERE user_id = auth.uid()
)
```

### Alternative: Simple Public Access (for testing)
If you want to test quickly without complex policies, you can:

1. Make sure the bucket is **Public**
2. Add a simple policy for all operations:
   - **Policy Name**: `Allow all authenticated operations`
   - **Allowed operation**: `ALL`
   - **Target roles**: `authenticated`
   - **Policy definition**:
```sql
bucket_id = 'files'
```

### Alternative: Private Bucket (Maximum Security)
For maximum security, you can make the bucket private:

1. **Create the bucket as Private** (uncheck "Public bucket")
2. **Add the same policies** as above
3. **Files will only be accessible via signed URLs**

#### Benefits of Private Bucket:
- ✅ Files are never publicly accessible
- ✅ All access requires authentication
- ✅ Signed URLs expire automatically
- ✅ Better for sensitive documents

#### Trade-offs:
- ⚠️ Slightly more complex URL generation
- ⚠️ URLs expire (can be configured)
- ⚠️ Slightly slower access (requires signing)

#### For Private Buckets, update the download function:
```typescript
// In lib/files.ts, update downloadFile function
export async function downloadFile(fileId: string): Promise<string | null> {
  const supabase = createClient()
  
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('storage_path, name')
    .eq('id', fileId)
    .single()

  if (fetchError || !file?.storage_path) {
    throw new Error('File not found')
  }

  // For private buckets, use createSignedUrl instead of getPublicUrl
  const { data: { signedUrl }, error: urlError } = await supabase.storage
    .from('files')
    .createSignedUrl(file.storage_path, 3600) // 1 hour expiry

  if (urlError) {
    console.error('Error creating signed URL:', urlError)
    throw urlError
  }

  await logFileActivity(fileId, 'download', 'downloaded file')
  return signedUrl
}
```

**Recommendation**: Start with the public bucket setup for simplicity, then switch to private if you need maximum security for sensitive files.

### Step 4: Test the Setup
1. Try uploading a file through your app
2. Check that the file appears in the Storage section
3. Try downloading the file to ensure it works

## File Structure
Files will be stored in the following structure:
```
files/
├── {account_id}/
│   ├── {timestamp}-filename1.pdf
│   ├── {timestamp}-filename2.png
│   └── ...
```

## Troubleshooting

### "Storage bucket not found" error
- Make sure the bucket name is exactly `files` (lowercase)
- Ensure the bucket is created and public
- Check that storage policies are set up correctly

### "Permission denied" error
- Verify that the user is authenticated
- Check that the storage policies are correctly configured
- Ensure the account_id in the file path matches the user's account

### Files not uploading
- Check the file size limit
- Verify the MIME type is allowed
- Check browser console for detailed error messages

### Can't enable RLS on storage bucket
- **Storage buckets don't use RLS** - they use storage policies instead
- Go to Storage → Policies to set up access control
- Make sure the bucket is set to "Public" if you want public access 