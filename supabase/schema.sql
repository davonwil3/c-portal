-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1) Company/organization the user belongs to (billing lives here)
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  plan_tier text NOT NULL DEFAULT 'free',  -- 'free' | 'starter' | 'premium'
  stripe_customer_id text,
  subscription_status text,
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) App profile tied to Supabase auth user
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  email text UNIQUE,               -- optional mirror for convenience
  first_name text,
  last_name text,
  role text DEFAULT 'owner',       -- 'owner' | 'member'
  phone text,
  profile_photo_url text,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to handle new user signup
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
  
  -- Create a new account for the user
  INSERT INTO public.accounts (company_name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'));
  
  -- Link the profile to the account
  UPDATE public.profiles 
  SET account_id = (SELECT id FROM public.accounts WHERE company_name = COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company') ORDER BY created_at DESC LIMIT 1)
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile and account on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login_at
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login_at on login
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_login();

-- RLS Policies for accounts table
CREATE POLICY "Users can view accounts they belong to" ON public.accounts
  FOR SELECT USING (
    id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Account owners can update their account" ON public.accounts
  FOR UPDATE USING (
    id IN (
      SELECT account_id FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for profiles table - Simplified to avoid recursion
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Indexes for better performance
CREATE INDEX idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_accounts_stripe_customer_id ON public.accounts(stripe_customer_id); 