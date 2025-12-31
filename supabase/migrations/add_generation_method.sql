-- Add generation_method column to social_posts table
-- This tracks whether a post was created with AI or manually

ALTER TABLE social_posts 
ADD COLUMN IF NOT EXISTS generation_method VARCHAR(50) DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN social_posts.generation_method IS 'How the post was created: "ai" or "manual"';

