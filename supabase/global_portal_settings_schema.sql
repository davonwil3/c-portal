-- Global Portal Settings Schema
-- This table stores account-level default settings for all portals
-- Individual portal settings can override these defaults

CREATE TABLE IF NOT EXISTS global_portal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    
    -- All settings stored in JSONB for flexibility
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Modules configuration
    modules JSONB NOT NULL DEFAULT '{
        "files": true,
        "forms": false,
        "invoices": true,
        "messages": true,
        "timeline": true,
        "contracts": false,
        "ai-assistant": false
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one global settings record per account
    UNIQUE(account_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_global_portal_settings_account_id ON global_portal_settings(account_id);
CREATE INDEX IF NOT EXISTS idx_global_portal_settings_settings ON global_portal_settings USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_global_portal_settings_updated_at ON global_portal_settings(updated_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_global_portal_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_global_portal_settings_updated_at
    BEFORE UPDATE ON global_portal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_global_portal_settings_updated_at();

-- Enable RLS
ALTER TABLE global_portal_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own global portal settings" ON global_portal_settings
    FOR SELECT USING (
        account_id IN (
            SELECT account_id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own global portal settings" ON global_portal_settings
    FOR UPDATE USING (
        account_id IN (
            SELECT account_id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own global portal settings" ON global_portal_settings
    FOR INSERT WITH CHECK (
        account_id IN (
            SELECT account_id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON global_portal_settings TO authenticated;
GRANT ALL ON global_portal_settings TO service_role;
