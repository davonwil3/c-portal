-- Add display_name and industry_label columns to schedule_settings table

ALTER TABLE IF EXISTS public.schedule_settings
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS industry_label text;

