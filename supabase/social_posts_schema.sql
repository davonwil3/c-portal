-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Post content
  content TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'twitter' or 'linkedin' or 'both'
  
  -- Images
  images TEXT[], -- Array of image URLs
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'posted', 'failed'
  
  -- Metadata
  post_id_twitter VARCHAR(255), -- ID from Twitter/X after posting
  post_id_linkedin VARCHAR(255), -- ID from LinkedIn after posting
  error_message TEXT,
  generation_method VARCHAR(50) DEFAULT 'manual', -- 'ai' or 'manual'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS social_posts_account_id_idx ON social_posts(account_id);
CREATE INDEX IF NOT EXISTS social_posts_user_id_idx ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts(status);
CREATE INDEX IF NOT EXISTS social_posts_scheduled_at_idx ON social_posts(scheduled_at);

-- Enable Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own social posts"
  ON social_posts
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own social posts"
  ON social_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own social posts"
  ON social_posts
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own social posts"
  ON social_posts
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    account_id IN (
      SELECT account_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_posts_updated_at();

-- Note: Images will be stored in the existing 'client-portal-content' bucket
-- under the path: social-posts/{user_id}/{timestamp}-{random}.{ext}
-- No new bucket creation needed!

