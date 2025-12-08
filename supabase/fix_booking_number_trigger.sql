-- Fix booking number trigger to prevent duplicate key errors
-- Complete script that drops and recreates both function and trigger

-- Step 1: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_booking_number_trigger ON public.bookings;

-- Step 2: Drop and recreate the function
DROP FUNCTION IF EXISTS public.generate_booking_number() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER AS $$
DECLARE
  max_number INTEGER;
  next_number INTEGER;
  booking_num TEXT;
  attempt_count INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Only generate booking number if it's NULL or empty
  IF NEW.booking_number IS NULL OR TRIM(NEW.booking_number) = '' THEN
    -- Lock the table for this account to prevent race conditions
    PERFORM pg_advisory_xact_lock(hashtext(NEW.account_id::text || 'booking_number'));
    
    -- Get the maximum existing booking number for this account
    -- Handle both formats: BK-001 and BK-001-1234
    SELECT COALESCE(
      (SELECT MAX(
        CASE 
          WHEN booking_number ~ '^BK-[0-9]+$' THEN 
            CAST(SUBSTRING(booking_number FROM 4) AS INTEGER)
          WHEN booking_number ~ '^BK-[0-9]+-[0-9]+$' THEN 
            CAST(SUBSTRING(booking_number FROM 4 FOR 3) AS INTEGER)
          ELSE 0
        END
      )
       FROM public.bookings 
       WHERE account_id = NEW.account_id
       AND booking_number LIKE 'BK-%'), 0) INTO max_number;
    
    -- Start from max_number + 1
    next_number := max_number + 1;
    
    -- Try to find a unique booking number
    LOOP
      attempt_count := attempt_count + 1;
      
      -- Format with leading zeros
      booking_num := 'BK-' || LPAD(next_number::TEXT, 3, '0');
      
      -- Check if this number already exists (check both formats)
      IF NOT EXISTS(
        SELECT 1 FROM public.bookings 
        WHERE account_id = NEW.account_id 
        AND (booking_number = booking_num OR booking_number LIKE booking_num || '-%')
      ) THEN
        -- Found a unique number, use it
        NEW.booking_number := booking_num;
        EXIT;
      END IF;
      
      -- If exists, try next number
      next_number := next_number + 1;
      
      -- Safety check to prevent infinite loop
      IF attempt_count >= max_attempts THEN
        -- Fallback: use timestamp to ensure uniqueness
        booking_num := 'BK-' || LPAD(next_number::TEXT, 3, '0') || '-' || 
          LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 5, '0');
        NEW.booking_number := booking_num;
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create the trigger
CREATE TRIGGER set_booking_number_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_booking_number();

-- Verify the trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_booking_number_trigger'
  ) THEN
    RAISE NOTICE 'Trigger set_booking_number_trigger created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create trigger set_booking_number_trigger';
  END IF;
END $$;

