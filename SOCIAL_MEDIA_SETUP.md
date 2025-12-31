# Social Media Image Storage Setup

## 1. Run the Database Schema

Execute the SQL in `supabase/social_posts_schema.sql` in your Supabase SQL Editor to create:
- `social_posts` table
- Indexes for performance
- Row Level Security policies
- Updated_at trigger

## 2. Storage Configuration

**No new bucket needed!** Images will be stored in your existing `client-portal-content` bucket under the path:
```
social-posts/{user_id}/{timestamp}-{random}.{ext}
```

The existing storage policies for `client-portal-content` bucket will handle access control.

## 3. Verify Setup

1. Run the SQL schema in Supabase SQL Editor
2. Try uploading an image from the AI Studio tab
3. Check that images appear in Storage > client-portal-content > social-posts folder
4. Verify images are organized by user ID

## Features Implemented

- ✅ Image upload from composer
- ✅ Multiple image support
- ✅ Image preview with remove functionality
- ✅ Images stored in existing `client-portal-content` bucket
- ✅ Organized in social-posts/{user_id} folder structure
- ✅ Public URLs for easy embedding
- ✅ Database table for social posts with image array column
- ✅ Images sticky at bottom of composer

