-- Add vector_store_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS vector_store_id TEXT;

COMMENT ON COLUMN public.clients.vector_store_id IS 'OpenAI Vector Store ID for this client';
