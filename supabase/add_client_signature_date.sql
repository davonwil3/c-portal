-- =====================================================
-- ADD CLIENT SIGNATURE DATE COLUMN
-- =====================================================
-- This migration adds a dedicated column for client signature date
-- to make it easier to query and display signature dates

-- Add client_signed_at column to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_signed_at timestamptz;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_proposals_client_signed_at 
ON public.proposals(client_signed_at);

-- Migrate existing data from proposal_data.contract.clientSignatureDate
-- This will update any existing proposals that have signature dates in the JSONB
UPDATE public.proposals
SET client_signed_at = 
  CASE 
    WHEN proposal_data->'contract'->>'clientSignatureDate' IS NOT NULL 
    THEN (proposal_data->'contract'->>'clientSignatureDate')::timestamptz
    WHEN proposal_data->'contract'->>'clientSignedAt' IS NOT NULL 
    THEN (proposal_data->'contract'->>'clientSignedAt')::timestamptz
    ELSE NULL
  END
WHERE client_signed_at IS NULL 
  AND (
    proposal_data->'contract'->>'clientSignatureDate' IS NOT NULL 
    OR proposal_data->'contract'->>'clientSignedAt' IS NOT NULL
  );

-- Add comment to column
COMMENT ON COLUMN public.proposals.client_signed_at IS 
  'Timestamp when the client signed the proposal. This is set when the proposal status changes to Accepted.';

