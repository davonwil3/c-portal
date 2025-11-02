-- Add hero_stat2_description column for Innovate template stats
-- This supports the second stat description in the Innovate template hero section

ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS hero_stat2_description TEXT;

-- Add comment to document the field
COMMENT ON COLUMN portfolios.hero_stat2_description IS 'Second stat description for Innovate template hero section (e.g., "Successful Projects")';

