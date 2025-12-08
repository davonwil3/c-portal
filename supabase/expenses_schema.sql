-- =====================================================
-- EXPENSES TABLE (Tax Tools)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Expense Information
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('Office', 'Software', 'Marketing', 'Education', 'Travel', 'Meals', 'Other')),
  amount decimal(10,2) NOT NULL,
  
  -- AI Categorization
  ai_categorized boolean DEFAULT false,
  
  -- Receipt/File Information
  receipt_file_path text, -- Path to uploaded receipt file
  receipt_file_name text, -- Original filename
  
  -- Metadata
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view expenses in their account" ON public.expenses
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses in their account" ON public.expenses
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses in their account" ON public.expenses
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expenses in their account" ON public.expenses
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION update_expenses_updated_at();

