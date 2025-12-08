-- Add description field to bookings table
-- This field stores the description/notes that clients fill out on the scheduling link page

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS description text;

-- Add comment to document the field
COMMENT ON COLUMN public.bookings.description IS 'Description/notes provided by the client when booking through the public scheduling link';
