-- Recurring Invoices Table
-- Stores templates for recurring invoices that generate new invoices on a schedule
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Template Information
  name text NOT NULL, -- User-friendly name for this recurring invoice (e.g., "Monthly Retainer")
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  
  -- Base Invoice Data (stored directly, not as reference)
  title text,
  description text,
  notes text,
  po_number text,
  line_items jsonb DEFAULT '[]'::jsonb, -- Array of line items
  subtotal decimal(15,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount decimal(15,2) DEFAULT 0,
  discount_value decimal(15,2) DEFAULT 0,
  total_amount decimal(15,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  payment_terms text DEFAULT 'net-30',
  allow_online_payment boolean DEFAULT true,
  
  -- Email Settings
  email_subject text,
  email_body text,
  cc_emails text[],
  bcc_emails text[],
  
  -- Recurrence Settings
  interval_type text NOT NULL CHECK (interval_type IN ('weekly', 'monthly', 'yearly', 'custom')),
  interval_value integer DEFAULT 1, -- e.g., every 1 month, every 2 weeks (for custom intervals)
  start_date timestamptz NOT NULL,
  next_run_at timestamptz NOT NULL,
  end_date timestamptz, -- Optional: when to stop recurring
  
  -- Behavior Settings
  auto_send boolean DEFAULT false, -- If true, automatically send invoice when created
  days_until_due integer DEFAULT 30, -- Number of days from issue date to due date
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  
  -- Metadata
  metadata jsonb, -- Additional data
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_run_at timestamptz -- When the last invoice was generated
);

-- Indexes for performance
CREATE INDEX idx_recurring_invoices_account_id ON public.recurring_invoices(account_id);
CREATE INDEX idx_recurring_invoices_user_id ON public.recurring_invoices(user_id);
CREATE INDEX idx_recurring_invoices_status ON public.recurring_invoices(status);
CREATE INDEX idx_recurring_invoices_next_run_at ON public.recurring_invoices(next_run_at);
CREATE INDEX idx_recurring_invoices_client_id ON public.recurring_invoices(client_id);

-- Enable Row Level Security
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recurring invoices" ON public.recurring_invoices
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE account_id = recurring_invoices.account_id)
  );

CREATE POLICY "Users can create their own recurring invoices" ON public.recurring_invoices
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE account_id = recurring_invoices.account_id)
  );

CREATE POLICY "Users can update their own recurring invoices" ON public.recurring_invoices
  FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE account_id = recurring_invoices.account_id)
  );

CREATE POLICY "Users can delete their own recurring invoices" ON public.recurring_invoices
  FOR DELETE USING (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE account_id = recurring_invoices.account_id)
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_invoice_updated_at();

