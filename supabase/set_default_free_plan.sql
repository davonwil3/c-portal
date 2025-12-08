-- Set all users to free plan by default
-- This ensures all existing and new users start on the free plan

-- Update all existing accounts to free plan if they don't have a plan set
UPDATE public.accounts
SET plan_tier = 'free'
WHERE plan_tier IS NULL OR plan_tier NOT IN ('free', 'pro', 'premium');

-- Ensure the default value is set for future inserts
ALTER TABLE public.accounts
ALTER COLUMN plan_tier SET DEFAULT 'free';

-- Add a check constraint to ensure only valid plan tiers are used
ALTER TABLE public.accounts
DROP CONSTRAINT IF EXISTS check_plan_tier;

ALTER TABLE public.accounts
ADD CONSTRAINT check_plan_tier CHECK (plan_tier IN ('free', 'pro', 'premium'));

-- Update the handle_new_user function to ensure new accounts are created with free plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
  );
  
  -- Link the profile to the account
  UPDATE public.profiles 
  SET account_id = (
    SELECT id FROM public.accounts 
    WHERE company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company') 
    ORDER BY created_at DESC LIMIT 1
  )
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

