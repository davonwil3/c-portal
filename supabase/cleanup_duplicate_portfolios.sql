-- Cleanup script to remove duplicate portfolios
-- This will keep only the most recently updated portfolio for each user
-- and delete all older duplicates

-- First, let's see what duplicates exist
-- SELECT user_id, COUNT(*) as count 
-- FROM portfolios 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;

-- For each user with multiple portfolios, keep only the most recently updated one
-- Delete all others
WITH ranked_portfolios AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY 
        COALESCE(updated_at, created_at) DESC,
        created_at DESC
    ) as rn
  FROM portfolios
)
DELETE FROM portfolios
WHERE id IN (
  SELECT id 
  FROM ranked_portfolios 
  WHERE rn > 1
);

-- After cleanup, you can verify with:
-- SELECT user_id, COUNT(*) as count 
-- FROM portfolios 
-- GROUP BY user_id 
-- HAVING COUNT(*) > 1;
-- This should return no rows if cleanup was successful

