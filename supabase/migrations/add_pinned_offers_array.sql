-- Add pinned_offers array column to brand_profiles table
-- This supports multiple pinned offers instead of just one

ALTER TABLE public.brand_profiles
ADD COLUMN IF NOT EXISTS pinned_offers TEXT[] DEFAULT '{}';

-- Migrate existing single pinned_offer to array if it exists
UPDATE public.brand_profiles
SET pinned_offers = ARRAY[pinned_offer]
WHERE pinned_offer IS NOT NULL AND pinned_offer != ''
  AND (pinned_offers IS NULL OR array_length(pinned_offers, 1) IS NULL);

-- Comment for clarity
COMMENT ON COLUMN public.brand_profiles.pinned_offers IS 'Array of pinned offers - one will be randomly selected for promotional posts';

