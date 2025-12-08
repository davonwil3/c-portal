-- Backfill schedule links for existing users
-- This creates schedule settings with shareable links for all existing accounts that don't have them

-- Function to generate a unique slug from company name or user name
CREATE OR REPLACE FUNCTION public.generate_schedule_slug(account_id uuid, user_id uuid)
RETURNS text AS $$
DECLARE
  company_name text;
  user_name text;
  base_slug text;
  slug text;
  counter integer := 0;
BEGIN
  -- Get company name
  SELECT a.company_name INTO company_name
  FROM public.accounts a
  WHERE a.id = account_id;
  
  -- Get user name
  SELECT CONCAT(p.first_name, ' ', p.last_name) INTO user_name
  FROM public.profiles p
  WHERE p.user_id = generate_schedule_slug.user_id;
  
  -- Generate base slug from company name or user name
  IF company_name IS NOT NULL AND company_name != '' THEN
    base_slug := LOWER(REGEXP_REPLACE(company_name, '[^a-z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-|-$', '', 'g');
  ELSIF user_name IS NOT NULL AND user_name != '' THEN
    base_slug := LOWER(REGEXP_REPLACE(user_name, '[^a-z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-|-$', '', 'g');
  ELSE
    base_slug := 'user';
  END IF;
  
  -- Ensure slug is not empty
  IF base_slug = '' THEN
    base_slug := 'user';
  END IF;
  
  -- Generate unique slug
  slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.schedule_settings WHERE shareable_link_slug = slug) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter::text;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Backfill schedule settings for existing accounts
-- This creates schedule settings for accounts that don't have them
INSERT INTO public.schedule_settings (
  account_id,
  user_id,
  shareable_link_slug,
  timezone,
  default_duration_minutes,
  buffer_time_minutes,
  email_notifications
)
SELECT 
  p.account_id,
  p.user_id,
  public.generate_schedule_slug(p.account_id, p.user_id),
  'America/New_York',
  60,
  15,
  true
FROM public.profiles p
WHERE p.account_id IS NOT NULL
  AND p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.schedule_settings ss 
    WHERE ss.account_id = p.account_id 
      AND ss.user_id = p.user_id
  )
ON CONFLICT (account_id, user_id) DO NOTHING;




