-- Create meeting_types table (separate from services which are for billing)
CREATE TABLE IF NOT EXISTS public.meeting_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Meeting Type Information
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60, -- Duration in minutes
  
  -- Pricing (optional - for paid meetings)
  price decimal(10,2), -- Optional price for the meeting
  currency text DEFAULT 'USD',
  
  -- Location and Settings
  location_type text DEFAULT 'Zoom' CHECK (location_type IN ('Zoom', 'Google Meet', 'Phone', 'In-Person')),
  color text DEFAULT 'bg-blue-500', -- Color for calendar display
  
  -- Status
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  
  -- Metadata
  metadata jsonb, -- Additional meeting type data
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meeting_types_account_id ON public.meeting_types(account_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_is_active ON public.meeting_types(account_id, is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.meeting_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting types in their account" ON public.meeting_types;
CREATE POLICY "Users can view meeting types in their account"
  ON public.meeting_types FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create meeting types in their account" ON public.meeting_types;
CREATE POLICY "Users can create meeting types in their account"
  ON public.meeting_types FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update meeting types in their account" ON public.meeting_types;
CREATE POLICY "Users can update meeting types in their account"
  ON public.meeting_types FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete meeting types in their account" ON public.meeting_types;
CREATE POLICY "Users can delete meeting types in their account"
  ON public.meeting_types FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Update bookings table to have meeting_type_id (in addition to service_id for backward compatibility)
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS meeting_type_id uuid REFERENCES public.meeting_types (id) ON DELETE SET NULL;

-- Create index for meeting_type_id
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_type_id ON public.bookings(meeting_type_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_meeting_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_meeting_types_updated_at_trigger ON public.meeting_types;
CREATE TRIGGER update_meeting_types_updated_at_trigger
  BEFORE UPDATE ON public.meeting_types
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_types_updated_at();

