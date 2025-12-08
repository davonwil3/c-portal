-- Migrate portal_settings to use JSONB for all settings
-- This allows for flexible settings storage and global settings override

-- Add new JSONB settings column
ALTER TABLE portal_settings 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data to JSONB settings column
UPDATE portal_settings
SET settings = jsonb_build_object(
  'brandColor', COALESCE(brand_color, '#3C3CFF'),
  'welcomeMessage', COALESCE(welcome_message, ''),
  'logoUrl', COALESCE(logo_url, ''),
  'companyName', company_name,
  'useBackgroundImage', COALESCE(use_background_image, false),
  'backgroundImageUrl', COALESCE(background_image_url, ''),
  'backgroundColor', COALESCE(background_color, '#3C3CFF'),
  'sidebarBgColor', COALESCE(settings->>'sidebarBgColor', '#FFFFFF'),
  'sidebarTextColor', COALESCE(settings->>'sidebarTextColor', '#1F2937'),
  'sidebarHighlightColor', COALESCE(settings->>'sidebarHighlightColor', COALESCE(brand_color, '#4647E0')),
  'sidebarHighlightTextColor', COALESCE(settings->>'sidebarHighlightTextColor', '#FFFFFF'),
  'portalFont', COALESCE(settings->>'portalFont', 'Inter'),
  'taskViews', COALESCE((settings->'taskViews')::jsonb, '{"milestones": true, "board": true}'::jsonb),
  'login', COALESCE((settings->'login')::jsonb, '{}'::jsonb)
)
WHERE settings = '{}'::jsonb OR settings IS NULL;

-- Create index on settings JSONB column for better query performance
CREATE INDEX IF NOT EXISTS idx_portal_settings_settings ON portal_settings USING GIN (settings);

-- Note: We keep the old columns for backward compatibility during migration
-- They can be dropped later after confirming everything works
