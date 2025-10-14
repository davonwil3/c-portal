-- Messages Schema for Client Portal
-- This schema handles messaging between clients and account users within projects

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  
  -- Message Content
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  
  -- Sender Information
  sender_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL, -- Account user who sent the message
  sender_name text NOT NULL, -- Cached name for performance
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'account_user')), -- Who sent the message
  
  -- Client Information (if sent by client)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  
  -- File Attachments (optional)
  attachment_url text, -- URL to attached file
  attachment_name text, -- Original filename
  attachment_type text, -- MIME type
  attachment_size bigint, -- File size in bytes
  
  -- Message Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Message Threading (for replies)
  parent_message_id uuid REFERENCES public.messages (id) ON DELETE CASCADE,
  thread_id uuid, -- Groups related messages together
  
  -- Message Metadata
  metadata jsonb, -- Additional message data (reactions, mentions, etc.)
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_project_id ON public.messages (project_id);
CREATE INDEX idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX idx_messages_client_id ON public.messages (client_id);
CREATE INDEX idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX idx_messages_thread_id ON public.messages (thread_id);
CREATE INDEX idx_messages_account_id ON public.messages (account_id);

-- Create RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Account users can see all messages for their account
CREATE POLICY "Account users can view all messages for their account" ON public.messages
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Account users can insert messages for their account
CREATE POLICY "Account users can insert messages for their account" ON public.messages
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Account users can update messages they sent
CREATE POLICY "Account users can update their own messages" ON public.messages
  FOR UPDATE USING (
    sender_id = auth.uid() AND
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE id IN (
        SELECT account_id FROM public.profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Clients can view messages for their projects (via allowlist)
CREATE POLICY "Clients can view messages for their projects" ON public.messages
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.client_allowlist ca ON ca.client_id = p.client_id
      WHERE ca.account_id = messages.account_id
      AND ca.is_active = true
    )
  );

-- Policy: Clients can insert messages for their projects (via allowlist)
CREATE POLICY "Clients can insert messages for their projects" ON public.messages
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      JOIN public.client_allowlist ca ON ca.client_id = p.client_id
      WHERE ca.account_id = messages.account_id
      AND ca.is_active = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Create function to generate thread_id for new messages
CREATE OR REPLACE FUNCTION generate_message_thread_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If no thread_id is provided, generate one
  IF NEW.thread_id IS NULL THEN
    NEW.thread_id = gen_random_uuid();
  END IF;
  
  -- If no parent_message_id but we want to create a thread, use the message's own ID
  IF NEW.parent_message_id IS NULL AND NEW.thread_id IS NOT NULL THEN
    NEW.thread_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for thread_id generation
CREATE TRIGGER generate_message_thread_id
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_message_thread_id();

-- Add comments for documentation
COMMENT ON TABLE public.messages IS 'Messages between clients and account users within projects';
COMMENT ON COLUMN public.messages.sender_type IS 'Type of sender: client or account_user';
COMMENT ON COLUMN public.messages.thread_id IS 'Groups related messages together for conversation threading';
COMMENT ON COLUMN public.messages.parent_message_id IS 'ID of the message this is replying to';
COMMENT ON COLUMN public.messages.metadata IS 'Additional message data like reactions, mentions, etc.';
