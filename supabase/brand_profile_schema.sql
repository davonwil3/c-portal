-- Brand Profile Table
-- Stores user's brand profile information for content generation

CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Brand information
  brand_name TEXT,
  about_brand TEXT,
  tone TEXT CHECK (tone IN ('friendly', 'professional', 'casual', 'expert')),
  topics TEXT[], -- Array of topic strings
  things_to_avoid TEXT,
  
  -- Links and promotions
  website TEXT,
  pinned_offer TEXT, -- Legacy single offer (for backward compatibility)
  pinned_offers TEXT[], -- Array of pinned offers
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Ensure one profile per account
  UNIQUE(account_id)
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own brand profile"
  ON public.brand_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brand profile"
  ON public.brand_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brand profile"
  ON public.brand_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brand profile"
  ON public.brand_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_brand_profiles_account_id ON public.brand_profiles(account_id);
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);

