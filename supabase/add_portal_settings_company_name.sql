-- Add company_name column to portal_settings table
ALTER TABLE portal_settings 
ADD COLUMN IF NOT EXISTS company_name TEXT;
