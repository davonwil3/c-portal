-- =====================================================
-- SCHEDULING DATABASE SCHEMA
-- =====================================================

-- =====================================================
-- SERVICES TABLE (Service types for bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Service Information
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60, -- Duration in minutes
  
  -- Pricing
  price decimal(10,2), -- Optional price for the service
  currency text DEFAULT 'USD',
  
  -- Location and Settings
  location_type text DEFAULT 'Zoom' CHECK (location_type IN ('Zoom', 'Google Meet', 'Phone', 'In-Person')),
  color text DEFAULT 'bg-blue-500', -- Color for calendar display
  
  -- Status
  is_active boolean DEFAULT true,
  is_archived boolean DEFAULT false,
  
  -- Metadata
  metadata jsonb, -- Additional service data
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SCHEDULE_SETTINGS TABLE (User schedule preferences)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.schedule_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  
  -- Timezone
  timezone text DEFAULT 'America/New_York',
  
  -- Booking Preferences
  default_duration_minutes integer DEFAULT 60,
  buffer_time_minutes integer DEFAULT 15, -- Time between consecutive meetings
  minimum_advance_notice_hours integer DEFAULT 2, -- Minimum hours before booking
  
  -- Notifications
  email_notifications boolean DEFAULT true,
  
  -- Booking Rules
  auto_confirm boolean DEFAULT false, -- Automatically confirm bookings
  
  -- Availability (stored as JSONB for flexibility)
  availability jsonb DEFAULT '{}', -- { "Monday": { "enabled": true, "startTime": "09:00", "endTime": "17:00" }, ... }
  
  -- Shareable Link
  shareable_link_url text, -- Public URL for clients to book appointments (e.g., https://jolix.io/schedule/username)
  shareable_link_slug text UNIQUE, -- Unique slug for the shareable link (e.g., "username")
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(account_id, user_id)
);

-- =====================================================
-- BOOKINGS TABLE (Appointments/Meetings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Booking Information
  booking_number text UNIQUE, -- Auto-generated booking number (e.g., BK-001)
  title text, -- Optional custom title
  
  -- Relationships
  service_id uuid REFERENCES public.services (id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  
  -- Service Details (cached for historical records)
  service_name text, -- Cached service name
  service_duration_minutes integer,
  service_price decimal(10,2),
  service_location_type text,
  service_color text,
  
  -- Scheduling
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text DEFAULT 'America/New_York',
  
  -- Location Details
  location text, -- Meeting location (Zoom link, address, phone number, etc.)
  location_type text DEFAULT 'Zoom' CHECK (location_type IN ('Zoom', 'Google Meet', 'Phone', 'In-Person')),
  
  -- Participants
  client_name text, -- Cached client name
  client_email text,
  client_phone text,
  
  -- Status
  status text DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Canceled', 'No-show', 'Rescheduled')),
  
  -- Payment
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded')),
  amount_paid decimal(10,2) DEFAULT 0,
  
  -- Notes
  notes text, -- Internal notes
  client_notes text, -- Notes visible to client
  
  -- Reminders
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  
  -- Cancellation
  canceled_at timestamptz,
  cancellation_reason text,
  canceled_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- =====================================================
-- BOOKING_ACTIVITIES TABLE (Activity log for bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.booking_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'updated', 'rescheduled', 'canceled', 'completed', 'reminder_sent', 'payment_received')),
  action text NOT NULL, -- e.g., "Booking created", "Rescheduled to Nov 25, 2024"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- CALENDAR_INTEGRATIONS TABLE (Connected calendars)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE CASCADE,
  
  -- Integration Information
  provider text NOT NULL CHECK (provider IN ('google', 'outlook', 'apple', 'caldav')),
  provider_account_id text, -- External account ID
  provider_account_email text,
  
  -- Authentication
  access_token text, -- Encrypted
  refresh_token text, -- Encrypted
  token_expires_at timestamptz,
  
  -- Settings
  sync_enabled boolean DEFAULT true,
  sync_direction text DEFAULT 'bidirectional' CHECK (sync_direction IN ('bidirectional', 'to_calendar', 'from_calendar')),
  
  -- Status
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  last_sync_error text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(account_id, user_id, provider)
);

-- =====================================================
-- PUBLIC_BOOKING_PAGES TABLE (Public booking pages for shareable links)
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
-- BLOCKED_TIME_SLOTS TABLE (When user is unavailable)
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
-- BOOKING_REMINDERS TABLE (Scheduled reminders)
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
-- RECURRING_BOOKINGS TABLE (Recurring appointment patterns)
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
-- INDEXES
-- =====================================================

-- Services indexes
CREATE INDEX IF NOT EXISTS idx_services_account_id ON public.services(account_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(account_id, is_active) WHERE is_active = true;

-- Schedule settings indexes
CREATE INDEX IF NOT EXISTS idx_schedule_settings_account_user ON public.schedule_settings(account_id, user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_settings_shareable_slug ON public.schedule_settings(shareable_link_slug) WHERE shareable_link_slug IS NOT NULL;

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_account_id ON public.bookings(account_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON public.bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(account_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON public.bookings(account_id, scheduled_date, status);

-- Booking activities indexes
CREATE INDEX IF NOT EXISTS idx_booking_activities_booking_id ON public.booking_activities(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_activities_account_id ON public.booking_activities(account_id);

-- Calendar integrations indexes
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_account_user ON public.calendar_integrations(account_id, user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_provider ON public.calendar_integrations(provider, is_active) WHERE is_active = true;

-- Public booking pages indexes
CREATE INDEX IF NOT EXISTS idx_public_booking_pages_slug ON public.public_booking_pages(slug) WHERE is_active = true AND is_published = true;
CREATE INDEX IF NOT EXISTS idx_public_booking_pages_account_user ON public.public_booking_pages(account_id, user_id);

-- Blocked time slots indexes
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_account_user ON public.blocked_time_slots(account_id, user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_datetime ON public.blocked_time_slots(start_datetime, end_datetime);

-- Booking reminders indexes
CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking_id ON public.booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_send_time ON public.booking_reminders(reminder_time, sent) WHERE sent = false;

-- Recurring bookings indexes
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_account_id ON public.recurring_bookings(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_active ON public.recurring_bookings(account_id, is_active) WHERE is_active = true;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Services policies
DROP POLICY IF EXISTS "Users can view services in their account" ON public.services;
CREATE POLICY "Users can view services in their account"
  ON public.services FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create services in their account" ON public.services;
CREATE POLICY "Users can create services in their account"
  ON public.services FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update services in their account" ON public.services;
CREATE POLICY "Users can update services in their account"
  ON public.services FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete services in their account" ON public.services;
CREATE POLICY "Users can delete services in their account"
  ON public.services FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Schedule settings policies
DROP POLICY IF EXISTS "Users can view their own schedule settings" ON public.schedule_settings;
CREATE POLICY "Users can view their own schedule settings"
  ON public.schedule_settings FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their own schedule settings" ON public.schedule_settings;
CREATE POLICY "Users can create their own schedule settings"
  ON public.schedule_settings FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own schedule settings" ON public.schedule_settings;
CREATE POLICY "Users can update their own schedule settings"
  ON public.schedule_settings FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Bookings policies
DROP POLICY IF EXISTS "Users can view bookings in their account" ON public.bookings;
CREATE POLICY "Users can view bookings in their account"
  ON public.bookings FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create bookings in their account" ON public.bookings;
CREATE POLICY "Users can create bookings in their account"
  ON public.bookings FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update bookings in their account" ON public.bookings;
CREATE POLICY "Users can update bookings in their account"
  ON public.bookings FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete bookings in their account" ON public.bookings;
CREATE POLICY "Users can delete bookings in their account"
  ON public.bookings FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Booking activities policies
DROP POLICY IF EXISTS "Users can view booking activities in their account" ON public.booking_activities;
CREATE POLICY "Users can view booking activities in their account"
  ON public.booking_activities FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create booking activities in their account" ON public.booking_activities;
CREATE POLICY "Users can create booking activities in their account"
  ON public.booking_activities FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Calendar integrations policies
DROP POLICY IF EXISTS "Users can view their own calendar integrations" ON public.calendar_integrations;
CREATE POLICY "Users can view their own calendar integrations"
  ON public.calendar_integrations FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create their own calendar integrations" ON public.calendar_integrations;
CREATE POLICY "Users can create their own calendar integrations"
  ON public.calendar_integrations FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own calendar integrations" ON public.calendar_integrations;
CREATE POLICY "Users can update their own calendar integrations"
  ON public.calendar_integrations FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete their own calendar integrations" ON public.calendar_integrations;
CREATE POLICY "Users can delete their own calendar integrations"
  ON public.calendar_integrations FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

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
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate booking number with advisory lock to prevent race conditions
CREATE OR REPLACE FUNCTION generate_booking_number()
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

-- Trigger to auto-generate booking number
DROP TRIGGER IF EXISTS set_booking_number ON public.bookings;
CREATE TRIGGER set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL)
  EXECUTE FUNCTION generate_booking_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_settings_updated_at ON public.schedule_settings;
CREATE TRIGGER update_schedule_settings_updated_at
  BEFORE UPDATE ON public.schedule_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_integrations_updated_at ON public.calendar_integrations;
CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_public_booking_pages_updated_at ON public.public_booking_pages;
CREATE TRIGGER update_public_booking_pages_updated_at
  BEFORE UPDATE ON public.public_booking_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocked_time_slots_updated_at ON public.blocked_time_slots;
CREATE TRIGGER update_blocked_time_slots_updated_at
  BEFORE UPDATE ON public.blocked_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_bookings_updated_at ON public.recurring_bookings;
CREATE TRIGGER update_recurring_bookings_updated_at
  BEFORE UPDATE ON public.recurring_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

