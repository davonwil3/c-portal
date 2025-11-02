-- =====================================================
-- Time Tracking Schema
-- =====================================================
-- Tables for tracking time entries for projects
-- =====================================================

-- Time Entries Table
CREATE TABLE IF NOT EXISTS time_entries (
  -- Primary Keys
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Project Info (denormalized for history)
  project_name text NOT NULL,
  
  -- Time Tracking
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_seconds integer, -- Calculated on end
  is_running boolean DEFAULT false,
  
  -- Billing
  hourly_rate decimal(10,2), -- Optional hourly rate for this entry
  billable_amount decimal(10,2), -- Calculated: (duration_seconds / 3600) * hourly_rate
  
  -- Additional Info
  note text,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_account_id ON time_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_is_running ON time_entries(is_running) WHERE is_running = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_time_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER time_entries_updated_at
BEFORE UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_time_entry_updated_at();

-- Trigger to calculate duration and billable amount when entry is stopped
CREATE OR REPLACE FUNCTION calculate_time_entry_amounts()
RETURNS TRIGGER AS $$
BEGIN
  -- If end_time is set and start_time exists, calculate duration
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::integer;
    NEW.is_running = false;
    
    -- Calculate billable amount if hourly_rate is set
    IF NEW.hourly_rate IS NOT NULL AND NEW.hourly_rate > 0 THEN
      NEW.billable_amount = (NEW.duration_seconds::decimal / 3600) * NEW.hourly_rate;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_time_entry_amounts_trigger
BEFORE INSERT OR UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION calculate_time_entry_amounts();

-- Function to stop a running timer
CREATE OR REPLACE FUNCTION stop_time_entry(entry_id uuid)
RETURNS time_entries AS $$
DECLARE
  result time_entries;
BEGIN
  UPDATE time_entries
  SET 
    end_time = now(),
    is_running = false
  WHERE id = entry_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active/running timer for a user
CREATE OR REPLACE FUNCTION get_running_timer(p_user_id uuid)
RETURNS time_entries AS $$
DECLARE
  result time_entries;
BEGIN
  SELECT * INTO result
  FROM time_entries
  WHERE user_id = p_user_id
    AND is_running = true
  ORDER BY start_time DESC
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own time entries
CREATE POLICY "Users can view own time entries"
  ON time_entries
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    account_id IN (
      SELECT account_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own time entries
CREATE POLICY "Users can insert own time entries"
  ON time_entries
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND
    account_id IN (
      SELECT account_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their own time entries
CREATE POLICY "Users can update own time entries"
  ON time_entries
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    account_id IN (
      SELECT account_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own time entries
CREATE POLICY "Users can delete own time entries"
  ON time_entries
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    account_id IN (
      SELECT account_id 
      FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE time_entries IS 'Stores time tracking entries for projects';
COMMENT ON COLUMN time_entries.duration_seconds IS 'Duration in seconds, calculated when entry is stopped';
COMMENT ON COLUMN time_entries.is_running IS 'True if timer is currently running';
COMMENT ON COLUMN time_entries.billable_amount IS 'Calculated billable amount based on duration and hourly rate';
COMMENT ON COLUMN time_entries.project_name IS 'Denormalized project name for historical accuracy';

-- Grant permissions
GRANT ALL ON time_entries TO authenticated;
GRANT ALL ON time_entries TO service_role;

