-- =====================================================
-- UPDATE CONTRACTS SCHEMA FOR CONTRACT BUILDER
-- =====================================================
-- This migration ensures the contracts table supports
-- all fields needed for the new contract builder

-- Ensure contract_content is JSONB (should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'contract_content'
  ) THEN
    ALTER TABLE public.contracts ADD COLUMN contract_content jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure metadata is JSONB (should already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.contracts ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Ensure contract_html exists (optional field for HTML rendering)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'contract_html'
  ) THEN
    ALTER TABLE public.contracts ADD COLUMN contract_html text;
  END IF;
END $$;

-- Ensure all required fields exist with proper types
DO $$ 
BEGIN
  -- Ensure name is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'name'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.contracts ALTER COLUMN name SET NOT NULL;
  END IF;
  
  -- Ensure status has default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'status'
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.contracts ALTER COLUMN status SET DEFAULT 'draft';
  END IF;
  
  -- Ensure contract_type has default
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts' 
    AND column_name = 'contract_type'
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE public.contracts ALTER COLUMN contract_type SET DEFAULT 'custom';
  END IF;
END $$;

-- Create index on contract_content for JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_contracts_content ON public.contracts USING gin(contract_content);

-- Create index on metadata for JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_contracts_metadata ON public.contracts USING gin(metadata);

-- Ensure contract_content can store the builder structure:
-- {
--   title: string
--   projectName: string
--   clientName: string
--   branding: { brandColor, accentColor, logoUrl, showLogo, showAddress }
--   company: { name, email, address }
--   client: { name, email, company, address }
--   terms: { revisionCount, hourlyRate, lateFee, lateDays, includeLateFee, includeHourlyClause, clientSignatureName, yourName, estimatedCompletionDate, projectTotal, paymentSchedule }
--   paymentPlan: { enabled, type, customPaymentsCount, customEqualSplit, customPaymentAmounts, milestonesCount, milestonesEqualSplit, milestones, schedule }
--   scope: { deliverables, timeline }
-- }

-- The JSONB structure is flexible and doesn't require schema changes
-- This migration just ensures the columns exist and are properly indexed

