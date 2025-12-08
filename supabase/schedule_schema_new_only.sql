-- =====================================================
-- NEW TABLES AND OBJECTS FOR SCHEDULING SCHEMA
-- Run only these if you're getting "already exists" errors
-- =====================================================

-- Add index for shareable link slug (if schedule_settings table exists)
CREATE INDEX IF NOT EXISTS idx_schedule_settings_shareable_slug 
  ON public.schedule_settings(shareable_link_slug) 
  WHERE shareable_link_slug IS NOT NULL;

-- =====================================================
-- PUBLIC_BOOKING_PAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.public_booking_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  schedule_settings_id uuid REFERENCES public.schedule_settings (id) ON DELETE CASCADE,
  
  -- Page Information
  slug text UNIQUE NOT NULL, -- Unique slug for the booking page URL
  page_title text, -- Custom page title
  page_description text, -- Custom page description
  welcome_message text, -- Welcome message shown to clients
  
  -- Display Settings
  show_available_times boolean DEFAULT true,
  show_service_prices boolean DEFAULT true,
  show_service_descriptions boolean DEFAULT true,
  allow_guest_bookings boolean DEFAULT true, -- Allow bookings without client account
  
  -- Booking Form Fields
  require_client_name boolean DEFAULT true,
  require_client_email boolean DEFAULT true,
  require_client_phone boolean DEFAULT false,
  require_notes boolean DEFAULT false,
  custom_fields jsonb, -- Additional custom form fields
  
  -- Status
  is_active boolean DEFAULT true,
  is_published boolean DEFAULT true,
  
  -- Analytics
  total_views integer DEFAULT 0,
  total_bookings integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(account_id, user_id)
);

-- =====================================================
-- BLOCKED_TIME_SLOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  
  -- Time Slot Information
  title text, -- Reason for blocking (e.g., "Lunch", "Vacation", "Out of Office")
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz NOT NULL,
  timezone text DEFAULT 'America/New_York',
  
  -- Recurrence (optional)
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb, -- Recurrence pattern if repeating (daily, weekly, monthly, etc.)
  
  -- Status
  is_all_day boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- BOOKING_REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.booking_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Reminder Information
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
  reminder_time timestamptz NOT NULL, -- When to send the reminder
  minutes_before integer, -- Minutes before booking (e.g., 15, 60, 1440 for 1 day)
  
  -- Status
  sent boolean DEFAULT false,
  sent_at timestamptz,
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- RECURRING_BOOKINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recurring_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services (id) ON DELETE SET NULL,
  
  -- Recurrence Pattern
  recurrence_type text NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'custom')),
  recurrence_pattern jsonb NOT NULL, -- Detailed recurrence pattern
  start_date date NOT NULL,
  end_date date, -- NULL for infinite recurrence
  time_slot time NOT NULL, -- Time of day for the booking
  duration_minutes integer NOT NULL,
  
  -- Days of Week (for weekly patterns)
  days_of_week integer[], -- Array of day numbers (0=Sunday, 1=Monday, etc.)
  
  -- Status
  is_active boolean DEFAULT true,
  total_occurrences integer, -- Total number of bookings to create (NULL for infinite)
  created_occurrences integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR NEW TABLES
-- =====================================================

-- Public booking pages indexes
CREATE INDEX IF NOT EXISTS idx_public_booking_pages_slug 
  ON public.public_booking_pages(slug) 
  WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_public_booking_pages_account_user 
  ON public.public_booking_pages(account_id, user_id);

-- Blocked time slots indexes
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_account_user 
  ON public.blocked_time_slots(account_id, user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_datetime 
  ON public.blocked_time_slots(start_datetime, end_datetime);

-- Booking reminders indexes
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking_id 
  ON public.booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_send_time 
  ON public.booking_reminders(reminder_time, sent) 
  WHERE sent = false;

-- Recurring bookings indexes
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_account_id 
  ON public.recurring_bookings(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_active 
  ON public.recurring_bookings(account_id, is_active) 
  WHERE is_active = true;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.public_booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Public booking pages policies
DROP POLICY IF EXISTS "Public booking pages are viewable by anyone when published" ON public.public_booking_pages;
CREATE POLICY "Public booking pages are viewable by anyone when published"
  ON public.public_booking_pages FOR SELECT
  USING (
    is_published = true AND is_active = true
  );

DROP POLICY IF EXISTS "Users can view their own booking pages" ON public.public_booking_pages;
CREATE POLICY "Users can view their own booking pages"
  ON public.public_booking_pages FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their own booking pages" ON public.public_booking_pages;
CREATE POLICY "Users can create their own booking pages"
  ON public.public_booking_pages FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own booking pages" ON public.public_booking_pages;
CREATE POLICY "Users can update their own booking pages"
  ON public.public_booking_pages FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own booking pages" ON public.public_booking_pages;
CREATE POLICY "Users can delete their own booking pages"
  ON public.public_booking_pages FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Blocked time slots policies
DROP POLICY IF EXISTS "Users can view their own blocked time slots" ON public.blocked_time_slots;
CREATE POLICY "Users can view their own blocked time slots"
  ON public.blocked_time_slots FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their own blocked time slots" ON public.blocked_time_slots;
CREATE POLICY "Users can create their own blocked time slots"
  ON public.blocked_time_slots FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own blocked time slots" ON public.blocked_time_slots;
CREATE POLICY "Users can update their own blocked time slots"
  ON public.blocked_time_slots FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own blocked time slots" ON public.blocked_time_slots;
CREATE POLICY "Users can delete their own blocked time slots"
  ON public.blocked_time_slots FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Booking reminders policies
DROP POLICY IF EXISTS "Users can view booking reminders in their account" ON public.booking_reminders;
CREATE POLICY "Users can view booking reminders in their account"
  ON public.booking_reminders FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create booking reminders in their account" ON public.booking_reminders;
CREATE POLICY "Users can create booking reminders in their account"
  ON public.booking_reminders FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update booking reminders in their account" ON public.booking_reminders;
CREATE POLICY "Users can update booking reminders in their account"
  ON public.booking_reminders FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Recurring bookings policies
DROP POLICY IF EXISTS "Users can view recurring bookings in their account" ON public.recurring_bookings;
CREATE POLICY "Users can view recurring bookings in their account"
  ON public.recurring_bookings FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create recurring bookings in their account" ON public.recurring_bookings;
CREATE POLICY "Users can create recurring bookings in their account"
  ON public.recurring_bookings FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update recurring bookings in their account" ON public.recurring_bookings;
CREATE POLICY "Users can update recurring bookings in their account"
  ON public.recurring_bookings FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete recurring bookings in their account" ON public.recurring_bookings;
CREATE POLICY "Users can delete recurring bookings in their account"
  ON public.recurring_bookings FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_public_booking_pages_updated_at
  BEFORE UPDATE ON public.public_booking_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_time_slots_updated_at
  BEFORE UPDATE ON public.blocked_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_bookings_updated_at
  BEFORE UPDATE ON public.recurring_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

