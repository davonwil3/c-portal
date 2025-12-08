-- Add owner_id to accounts table
ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create workspace_invites table
CREATE TABLE IF NOT EXISTS public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(workspace_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_workspace_id ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON public.workspace_invites(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON public.workspace_invites(email);

-- Enable RLS
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_members
CREATE POLICY "Users can view members of their workspaces" ON public.workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can insert members" ON public.workspace_members
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members" ON public.workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete members" ON public.workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for workspace_invites
CREATE POLICY "Users can view invites for their workspaces" ON public.workspace_invites
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and admins can create invites" ON public.workspace_invites
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update invites" ON public.workspace_invites
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete invites" ON public.workspace_invites
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Function to set owner_id when account is created
CREATE OR REPLACE FUNCTION public.set_account_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Set owner_id to the user who created the account
  UPDATE public.accounts
  SET owner_id = (
    SELECT user_id FROM public.profiles WHERE account_id = NEW.id LIMIT 1
  )
  WHERE id = NEW.id AND owner_id IS NULL;
  
  -- Create workspace_member entry for owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT NEW.id, user_id, 'owner'
  FROM public.profiles
  WHERE account_id = NEW.id
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set owner when account is created
DROP TRIGGER IF EXISTS on_account_created ON public.accounts;
CREATE TRIGGER on_account_created
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_account_owner();

-- Backfill: Set owner_id for existing accounts
UPDATE public.accounts
SET owner_id = (
  SELECT user_id FROM public.profiles 
  WHERE profiles.account_id = accounts.id 
  AND profiles.role = 'owner'
  LIMIT 1
)
WHERE owner_id IS NULL;

-- Backfill: Create workspace_members for existing owner relationships
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT account_id, user_id, COALESCE(role, 'owner')
FROM public.profiles
WHERE account_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;

