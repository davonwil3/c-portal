-- Starred Conversations Schema
-- This table tracks which project conversations are starred by which users

CREATE TABLE IF NOT EXISTS public.starred_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  
  -- Ensure a user can only star a project once
  UNIQUE(user_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_starred_conversations_user_id ON public.starred_conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_starred_conversations_project_id ON public.starred_conversations (project_id);
CREATE INDEX IF NOT EXISTS idx_starred_conversations_account_id ON public.starred_conversations (account_id);
CREATE INDEX IF NOT EXISTS idx_starred_conversations_created_at ON public.starred_conversations (created_at DESC);

-- Enable RLS
ALTER TABLE public.starred_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own starred conversations
CREATE POLICY "Users can view their own starred conversations" ON public.starred_conversations
  FOR SELECT USING (
    user_id = auth.uid() AND
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Users can insert their own starred conversations
CREATE POLICY "Users can insert their own starred conversations" ON public.starred_conversations
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    ) AND
    project_id IN (
      SELECT id FROM public.projects 
      WHERE account_id = starred_conversations.account_id
    )
  );

-- Policy: Users can delete their own starred conversations
CREATE POLICY "Users can delete their own starred conversations" ON public.starred_conversations
  FOR DELETE USING (
    user_id = auth.uid() AND
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.starred_conversations IS 'Tracks which project conversations are starred by which users';
COMMENT ON COLUMN public.starred_conversations.user_id IS 'The user who starred the conversation';
COMMENT ON COLUMN public.starred_conversations.project_id IS 'The project/conversation that was starred';

