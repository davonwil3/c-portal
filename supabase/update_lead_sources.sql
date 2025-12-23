-- =====================================================
-- UPDATE LEAD SOURCES
-- Update the lead source options to match new requirements
-- =====================================================

-- Drop the old check constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;

-- Add new check constraint with updated sources
ALTER TABLE public.leads 
ADD CONSTRAINT leads_source_check 
CHECK (source IN ('Lead Engine', 'Portfolio', 'Website form', 'Social', 'Referral', 'Manual Import'));

-- Update default value
ALTER TABLE public.leads ALTER COLUMN source SET DEFAULT 'Manual Import';

-- Update existing records to map old sources to new ones
UPDATE public.leads 
SET source = CASE
  WHEN source = 'Website' THEN 'Website form'
  WHEN source = 'Social Media' THEN 'Social'
  WHEN source = 'Ad Campaign' THEN 'Lead Engine'
  WHEN source = 'Other' THEN 'Manual Import'
  ELSE source
END
WHERE source IN ('Website', 'Social Media', 'Ad Campaign', 'Other');
