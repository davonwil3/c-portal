-- Remove minimum_advance_notice_hours and auto_confirm from schedule_settings
-- These fields are no longer needed

ALTER TABLE IF EXISTS public.schedule_settings 
  DROP COLUMN IF EXISTS minimum_advance_notice_hours,
  DROP COLUMN IF EXISTS auto_confirm;

-- Add meeting_type_id to public_booking_pages to link to a specific meeting type
ALTER TABLE IF EXISTS public.public_booking_pages 
  ADD COLUMN IF NOT EXISTS meeting_type_id uuid REFERENCES public.meeting_types (id) ON DELETE SET NULL;

-- Create index for meeting_type_id
CREATE INDEX IF NOT EXISTS idx_public_booking_pages_meeting_type ON public.public_booking_pages(meeting_type_id);

-- Remove UNIQUE constraint on (account_id, user_id) from public_booking_pages
-- Users can now have multiple booking pages with different slugs
ALTER TABLE IF EXISTS public.public_booking_pages 
  DROP CONSTRAINT IF EXISTS public_booking_pages_account_id_user_id_key;

