-- Automations Schema
-- Uses JSONB for complex nested structures to minimize table joins

-- Automations table - stores user-created automations
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Basic automation info
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Trigger configuration
  trigger TEXT NOT NULL, -- e.g., "invoice_overdue", "contract_signed"
  trigger_group TEXT NOT NULL, -- e.g., "Invoices & Payments", "Contracts"
  
  -- Conditions and filters stored as JSONB
  conditions JSONB DEFAULT '[]'::jsonb, -- Array of condition strings
  filters JSONB DEFAULT '[]'::jsonb, -- Array of {field, operator, value} objects
  
  -- Actions stored as JSONB array
  -- Each action: {type: "email" | "portal_notice" | "action_needed" | "create_task" | "schedule_reminder", config: {...}}
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Scope configuration
  scope TEXT NOT NULL CHECK (scope IN ('global', 'client', 'project')),
  target_id UUID, -- client_id or project_id depending on scope
  target_name TEXT, -- Denormalized name for quick display
  
  -- Statistics
  last_run TIMESTAMPTZ,
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage (0-100)
  total_runs INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation templates table - pre-built templates users can use
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  benefit TEXT NOT NULL, -- Explains why this template is useful
  
  -- Trigger configuration
  trigger TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  
  -- Filters and actions stored as JSONB
  filters JSONB DEFAULT '[]'::jsonb, -- Array of {field, operator, value} objects
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of ActionConfig objects
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation run logs table - tracks execution history
CREATE TABLE IF NOT EXISTS automation_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  
  -- Execution details
  automation_name TEXT NOT NULL, -- Denormalized for quick queries
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target TEXT NOT NULL, -- Client name, project name, or "Global"
  target_id UUID, -- Optional reference to client/project
  
  -- Execution result
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  duration_ms INTEGER, -- Duration in milliseconds
  details TEXT, -- Error message or success details
  
  -- Execution context stored as JSONB
  execution_context JSONB, -- Store trigger data, action results, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automations_account_id ON automations(account_id);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON automations(user_id);
CREATE INDEX IF NOT EXISTS idx_automations_enabled ON automations(enabled);
CREATE INDEX IF NOT EXISTS idx_automations_scope ON automations(scope);
CREATE INDEX IF NOT EXISTS idx_automations_target_id ON automations(target_id);
CREATE INDEX IF NOT EXISTS idx_automations_trigger ON automations(trigger);
CREATE INDEX IF NOT EXISTS idx_automations_last_run ON automations(last_run);

-- JSONB indexes for common queries
CREATE INDEX IF NOT EXISTS idx_automations_actions ON automations USING GIN (actions);
CREATE INDEX IF NOT EXISTS idx_automations_filters ON automations USING GIN (filters);

CREATE INDEX IF NOT EXISTS idx_automation_templates_trigger_group ON automation_templates(trigger_group);
CREATE INDEX IF NOT EXISTS idx_automation_templates_display_order ON automation_templates(display_order);

CREATE INDEX IF NOT EXISTS idx_automation_run_logs_account_id ON automation_run_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_automation_run_logs_automation_id ON automation_run_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_run_logs_timestamp ON automation_run_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_automation_run_logs_status ON automation_run_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_run_logs_target_id ON automation_run_logs(target_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_automation_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_automations_updated_at();

CREATE TRIGGER update_automation_templates_updated_at
  BEFORE UPDATE ON automation_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_templates_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_run_logs ENABLE ROW LEVEL SECURITY;

-- Policies for automations
CREATE POLICY "Users can view automations in their account"
  ON automations FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create automations in their account"
  ON automations FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update automations in their account"
  ON automations FOR UPDATE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete automations in their account"
  ON automations FOR DELETE
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Policies for automation_templates (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view automation templates"
  ON automation_templates FOR SELECT
  TO authenticated
  USING (true);

-- Policies for automation_run_logs
CREATE POLICY "Users can view run logs in their account"
  ON automation_run_logs FOR SELECT
  USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert run logs"
  ON automation_run_logs FOR INSERT
  WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON TABLE automations IS 'User-created automation workflows';
COMMENT ON TABLE automation_templates IS 'Pre-built automation templates available to all users';
COMMENT ON TABLE automation_run_logs IS 'Execution history and logs for automation runs';

COMMENT ON COLUMN automations.conditions IS 'JSONB array of condition strings';
COMMENT ON COLUMN automations.filters IS 'JSONB array of filter objects: [{field, operator, value}]';
COMMENT ON COLUMN automations.actions IS 'JSONB array of action configurations: [{type, config}]';
COMMENT ON COLUMN automation_run_logs.execution_context IS 'JSONB object storing trigger data and action execution results';

