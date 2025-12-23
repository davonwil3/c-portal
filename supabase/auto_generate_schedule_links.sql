-- Auto-generate schedule links for new users
-- This updates the handle_new_user function to automatically create schedule settings with a shareable link

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

-- Update handle_new_user to create schedule settings
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id uuid;
  new_user_id uuid;
  schedule_slug text;
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Create a new account for the user with free plan
  INSERT INTO public.accounts (company_name, plan_tier)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    'free'
  )
  RETURNING id INTO new_account_id;
  
  -- Link the profile to the account
  UPDATE public.profiles 
  SET account_id = new_account_id
  WHERE user_id = NEW.id;
  
  -- Generate schedule slug
  schedule_slug := public.generate_schedule_slug(new_account_id, NEW.id);
  
  -- Create schedule settings with shareable link
  INSERT INTO public.schedule_settings (
    account_id,
    user_id,
    shareable_link_slug,
    timezone,
    default_duration_minutes,
    buffer_time_minutes,
    email_notifications
  )
  VALUES (
    new_account_id,
    NEW.id,
    schedule_slug,
    'America/New_York',
    60,
    15,
    true
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;






