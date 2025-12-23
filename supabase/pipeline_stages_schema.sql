-- =====================================================
-- PIPELINE STAGES SCHEMA
-- Stores custom pipeline stages/statuses per account
-- =====================================================

-- Add pipeline_stages column to accounts table
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS pipeline_stages jsonb DEFAULT '[
  {"id": "new", "name": "New", "color": "bg-blue-100 text-blue-700"},
  {"id": "contacted", "name": "Contacted", "color": "bg-purple-100 text-purple-700"},
  {"id": "discovery", "name": "Discovery", "color": "bg-yellow-100 text-yellow-700"},
  {"id": "proposal", "name": "Proposal Sent", "color": "bg-orange-100 text-orange-700"},
  {"id": "negotiation", "name": "Negotiation", "color": "bg-pink-100 text-pink-700"},
  {"id": "won", "name": "Won", "color": "bg-green-100 text-green-700"},
  {"id": "lost", "name": "Lost", "color": "bg-red-100 text-red-700"}
]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.accounts.pipeline_stages IS 'Custom pipeline stages configuration for leads, stored as JSONB array of {id, name, color} objects';
