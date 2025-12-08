-- Fix bookings table foreign key constraint for meeting_type_id
-- This ensures meeting_type_id references meeting_types table, not services table

-- First, drop the existing foreign key constraint if it exists (it might be pointing to the wrong table)
ALTER TABLE IF EXISTS public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_meeting_type_id_fkey;

-- Add the meeting_type_id column if it doesn't exist
ALTER TABLE IF EXISTS public.bookings 
  ADD COLUMN IF NOT EXISTS meeting_type_id uuid;

-- Now add the correct foreign key constraint pointing to meeting_types table
ALTER TABLE IF EXISTS public.bookings
  ADD CONSTRAINT bookings_meeting_type_id_fkey 
  FOREIGN KEY (meeting_type_id) 
  REFERENCES public.meeting_types(id) 
  ON DELETE SET NULL;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_type_id ON public.bookings(meeting_type_id);

-- Also fix recurring_bookings table if it has the same issue
ALTER TABLE IF EXISTS public.recurring_bookings 
  DROP CONSTRAINT IF EXISTS recurring_bookings_meeting_type_id_fkey;

ALTER TABLE IF EXISTS public.recurring_bookings 
  ADD COLUMN IF NOT EXISTS meeting_type_id uuid;

ALTER TABLE IF EXISTS public.recurring_bookings
  ADD CONSTRAINT recurring_bookings_meeting_type_id_fkey 
  FOREIGN KEY (meeting_type_id) 
  REFERENCES public.meeting_types(id) 
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_bookings_meeting_type_id ON public.recurring_bookings(meeting_type_id);

