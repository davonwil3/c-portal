-- Portal Settings Schema
-- This table stores configuration settings for each client portal

CREATE TABLE IF NOT EXISTS portal_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    modules JSONB NOT NULL DEFAULT '{
        "files": true,
        "forms": false,
        "invoices": true,
        "messages": true,
        "timeline": true,
        "contracts": false,
        "ai-assistant": false
    }'::jsonb,
    project_visibility JSONB DEFAULT '{}'::jsonb,
    default_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    brand_color VARCHAR(7) DEFAULT '#3C3CFF',
    
    welcome_message TEXT DEFAULT '',
    password_protected BOOLEAN DEFAULT false,
    portal_password TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one settings record per portal
    UNIQUE(portal_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portal_settings_portal_id ON portal_settings(portal_id);
CREATE INDEX IF NOT EXISTS idx_portal_settings_updated_at ON portal_settings(updated_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portal_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_portal_settings_updated_at
    BEFORE UPDATE ON portal_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_portal_settings_updated_at();

-- Enable RLS
ALTER TABLE portal_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view portal settings for their portals" ON portal_settings
    FOR SELECT USING (
        portal_id IN (
            SELECT id FROM portals 
            WHERE account_id = auth.uid()
        )
    );

CREATE POLICY "Users can update portal settings for their portals" ON portal_settings
    FOR UPDATE USING (
        portal_id IN (
            SELECT id FROM portals 
            WHERE account_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert portal settings for their portals" ON portal_settings
    FOR INSERT WITH CHECK (
        portal_id IN (
            SELECT id FROM portals 
            WHERE account_id = auth.uid()
        )
    );

-- Grant necessary permissions
GRANT ALL ON portal_settings TO authenticated;
GRANT ALL ON portal_settings TO service_role;
