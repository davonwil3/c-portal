-- Rename services table to meeting_types
ALTER TABLE IF EXISTS public.services RENAME TO meeting_types;

-- Update all references in other tables
ALTER TABLE IF EXISTS public.bookings RENAME COLUMN service_id TO meeting_type_id;
ALTER TABLE IF EXISTS public.recurring_bookings RENAME COLUMN service_id TO meeting_type_id;

-- Update indexes
DROP INDEX IF EXISTS idx_services_account_id;
DROP INDEX IF EXISTS idx_services_is_active;
CREATE INDEX IF NOT EXISTS idx_meeting_types_account_id ON public.meeting_types(account_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_is_active ON public.meeting_types(account_id, is_active) WHERE is_active = true;

-- Update foreign key constraints
ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;
ALTER TABLE IF EXISTS public.bookings ADD CONSTRAINT bookings_meeting_type_id_fkey 
  FOREIGN KEY (meeting_type_id) REFERENCES public.meeting_types(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.recurring_bookings DROP CONSTRAINT IF EXISTS recurring_bookings_service_id_fkey;
ALTER TABLE IF EXISTS public.recurring_bookings ADD CONSTRAINT recurring_bookings_meeting_type_id_fkey 
  FOREIGN KEY (meeting_type_id) REFERENCES public.meeting_types(id) ON DELETE SET NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view services in their account" ON public.meeting_types;
DROP POLICY IF EXISTS "Users can create services in their account" ON public.meeting_types;
DROP POLICY IF EXISTS "Users can update services in their account" ON public.meeting_types;
DROP POLICY IF EXISTS "Users can delete services in their account" ON public.meeting_types;

CREATE POLICY "Users can view meeting types in their account"
  ON public.meeting_types FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create meeting types in their account"
  ON public.meeting_types FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update meeting types in their account"
  ON public.meeting_types FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete meeting types in their account"
  ON public.meeting_types FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

