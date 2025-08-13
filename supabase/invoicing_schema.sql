
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Invoice Information
  invoice_number text UNIQUE NOT NULL, -- Auto-generated invoice number (e.g., INV-0015)
  invoice_type text DEFAULT 'standard' CHECK (invoice_type IN ('standard', 'deposit', 'milestone', 'final', 'recurring')),
  
  -- Relationships (optional - invoices can be linked to clients, projects, or contracts)
  client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts (id) ON DELETE SET NULL,
  
  -- Invoice Details
  title text,
  description text,
  notes text, -- Additional notes for the client
  po_number text, -- Purchase order number
  
  -- Line Items (JSON array of invoice items)
  line_items jsonb DEFAULT '[]'::jsonb, -- Array of line items with name, description, quantity, rate, amount, etc.
  
  -- Invoice Status and Workflow
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded')),
  is_recurring boolean DEFAULT false,
  recurring_schedule text, -- e.g., "monthly", "weekly", "yearly"
  
  -- Dates
  issue_date timestamptz DEFAULT now(),
  due_date timestamptz,
  sent_date timestamptz,
  paid_date timestamptz,
  viewed_date timestamptz,
  
  -- Financial Information
  subtotal decimal(15,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(15,2) DEFAULT 0,
  discount_type text DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_amount decimal(15,2) DEFAULT 0,
  discount_value decimal(15,2) DEFAULT 0, -- Calculated discount value
  total_amount decimal(15,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  
  -- Payment Settings
  payment_terms text DEFAULT 'net-30', -- e.g., "net-30", "due-on-receipt"
  allow_online_payment boolean DEFAULT true,
  payment_url text, -- Generated payment link
  payment_methods text[], -- Array of accepted payment methods
  
  -- Email and Notification Settings
  email_subject text,
  email_body text,
  cc_emails text[], -- Array of CC email addresses
  bcc_emails text[], -- Array of BCC email addresses
  reminder_schedule text DEFAULT '3-days', -- When to send reminders
  auto_reminder boolean DEFAULT true,
  
  -- Invoice Metadata
  tags text[], -- Array of tags for categorization
  metadata jsonb, -- Additional invoice data
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text, -- Cached name for performance
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_activity_at timestamptz
);

-- =====================================================
-- INVOICE PAYMENTS TABLE (Payment tracking)
-- =====================================================
CREATE TABLE public.invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices (id) ON DELETE CASCADE,
  
  -- Payment Information
  payment_number text UNIQUE, -- Auto-generated payment number
  payment_method text NOT NULL, -- e.g., "credit_card", "bank_transfer", "check", "cash"
  payment_gateway text, -- e.g., "stripe", "paypal", "square"
  gateway_transaction_id text, -- External payment gateway transaction ID
  
  -- Payment Details
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'USD',
  exchange_rate decimal(10,6) DEFAULT 1, -- For multi-currency payments
  
  -- Payment Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  failure_reason text, -- Reason for payment failure
  
  -- Payment Data
  payment_data jsonb, -- Additional payment information (card last 4, etc.)
  payment_ip text, -- IP address where payment was made
  payment_user_agent text, -- Browser/device information
  
  -- Timestamps
  payment_date timestamptz,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INVOICE TEMPLATES TABLE (Reusable invoice templates)
-- =====================================================
CREATE TABLE public.invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  
  -- Template Information
  name text NOT NULL,
  description text,
  template_type text DEFAULT 'standard' CHECK (template_type IN ('standard', 'deposit', 'milestone', 'final', 'recurring')),
  
  -- Template Content
  template_html text, -- HTML template for invoice
  template_css text, -- Custom CSS for styling
  template_variables jsonb, -- Available variables and their descriptions
  
  -- Template Settings
  is_default boolean DEFAULT false, -- Default template for the account
  is_public boolean DEFAULT false, -- Available to all accounts
  is_premium boolean DEFAULT false, -- Premium template
  
  -- Usage Statistics
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,
  
  -- Creator Information
  created_by uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  created_by_name text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- INVOICE ACTIVITIES TABLE (Activity log)
-- =====================================================
CREATE TABLE public.invoice_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices (id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (user_id) ON DELETE SET NULL,
  
  -- Activity Details
  activity_type text NOT NULL CHECK (activity_type IN ('created', 'sent', 'viewed', 'paid', 'overdue', 'cancelled', 'refunded', 'reminder_sent', 'payment_received')),
  action text NOT NULL, -- e.g., "created invoice", "sent invoice", "payment received"
  metadata jsonb, -- Additional activity data
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Invoices indexes
CREATE INDEX idx_invoices_account_id ON public.invoices(account_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_contract_id ON public.invoices(contract_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoices_paid_date ON public.invoices(paid_date);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_tags ON public.invoices USING gin(tags);
CREATE INDEX idx_invoices_line_items ON public.invoices USING gin(line_items);

-- Invoice payments indexes
CREATE INDEX idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_status ON public.invoice_payments(status);
CREATE INDEX idx_invoice_payments_method ON public.invoice_payments(payment_method);
CREATE INDEX idx_invoice_payments_gateway ON public.invoice_payments(payment_gateway);
CREATE INDEX idx_invoice_payments_transaction_id ON public.invoice_payments(gateway_transaction_id);
CREATE INDEX idx_invoice_payments_payment_date ON public.invoice_payments(payment_date);

-- Invoice templates indexes
CREATE INDEX idx_invoice_templates_account_id ON public.invoice_templates(account_id);
CREATE INDEX idx_invoice_templates_type ON public.invoice_templates(template_type);
CREATE INDEX idx_invoice_templates_is_default ON public.invoice_templates(is_default);
CREATE INDEX idx_invoice_templates_is_public ON public.invoice_templates(is_public);
CREATE INDEX idx_invoice_templates_usage_count ON public.invoice_templates(usage_count);

-- Invoice activities indexes
CREATE INDEX idx_invoice_activities_invoice_id ON public.invoice_activities(invoice_id);
CREATE INDEX idx_invoice_activities_account_id ON public.invoice_activities(account_id);
CREATE INDEX idx_invoice_activities_user_id ON public.invoice_activities(user_id);
CREATE INDEX idx_invoice_activities_type ON public.invoice_activities(activity_type);
CREATE INDEX idx_invoice_activities_created_at ON public.invoice_activities(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_activities ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view invoices in their account" ON public.invoices
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoices in their account" ON public.invoices
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoices in their account" ON public.invoices
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoices in their account" ON public.invoices
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Invoice payments policies
CREATE POLICY "Users can view invoice payments in their account" ON public.invoice_payments
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create invoice payments in their account" ON public.invoice_payments
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE account_id IN (
        SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Invoice templates policies
CREATE POLICY "Users can view invoice templates in their account" ON public.invoice_templates
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    ) OR is_public = true
  );

CREATE POLICY "Users can create invoice templates in their account" ON public.invoice_templates
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Invoice activities policies
CREATE POLICY "Users can view invoice activities in their account" ON public.invoice_activities
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoice activities in their account" ON public.invoice_activities
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number = 'INV-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER))
       FROM public.invoices 
       WHERE account_id = NEW.account_id), 0) + 1, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE TRIGGER on_invoice_created
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- Function to generate payment number
CREATE OR REPLACE FUNCTION public.generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.payment_number = 'PAY-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(payment_number FROM 5) AS INTEGER))
       FROM public.invoice_payments 
       WHERE invoice_id = NEW.invoice_id), 0) + 1, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-generate payment number
CREATE OR REPLACE TRIGGER on_payment_created
  BEFORE INSERT ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.generate_payment_number();

-- Function to calculate invoice totals from line_items JSON
CREATE OR REPLACE FUNCTION public.calculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_subtotal DECIMAL(15,2);
  invoice_tax_amount DECIMAL(15,2);
  invoice_discount_value DECIMAL(15,2);
  line_item JSONB;
BEGIN
  -- Calculate subtotal from line_items JSON array
  invoice_subtotal := 0;
  
  IF NEW.line_items IS NOT NULL THEN
    FOR line_item IN SELECT * FROM jsonb_array_elements(NEW.line_items)
    LOOP
      invoice_subtotal := invoice_subtotal + COALESCE((line_item->'total_amount')::DECIMAL(15,2), 0);
    END LOOP;
  END IF;
  
  -- Calculate tax amount
  invoice_tax_amount := invoice_subtotal * (COALESCE(NEW.tax_rate, 0) / 100);
  
  -- Calculate discount value
  IF COALESCE(NEW.discount_type, 'percentage') = 'percentage' THEN
    invoice_discount_value := invoice_subtotal * (COALESCE(NEW.discount_amount, 0) / 100);
  ELSE
    invoice_discount_value := COALESCE(NEW.discount_amount, 0);
  END IF;
  
  -- Update invoice totals
  NEW.subtotal := invoice_subtotal;
  NEW.tax_amount := invoice_tax_amount;
  NEW.discount_value := invoice_discount_value;
  NEW.total_amount := invoice_subtotal + invoice_tax_amount - invoice_discount_value;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to calculate invoice totals when invoice is created or updated
CREATE OR REPLACE TRIGGER on_invoice_totals_calculation
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.calculate_invoice_totals();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(15,2);
  invoice_total DECIMAL(15,2);
BEGIN
  -- Calculate total paid amount
  SELECT COALESCE(SUM(amount), 0)
  INTO total_paid
  FROM public.invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
  AND status = 'completed';
  
  -- Get invoice total
  SELECT total_amount
  INTO invoice_total
  FROM public.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice status based on payments
  IF total_paid >= invoice_total THEN
    UPDATE public.invoices 
    SET status = 'paid', 
        paid_date = now()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  ELSIF total_paid > 0 THEN
    UPDATE public.invoices 
    SET status = 'partially_paid'
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update invoice status when payments change
CREATE OR REPLACE TRIGGER on_payment_status_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_status();

-- Function to check invoice overdue status
CREATE OR REPLACE FUNCTION public.check_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if invoice is overdue
  IF NEW.due_date IS NOT NULL AND NEW.due_date < now() AND NEW.status NOT IN ('paid', 'cancelled', 'refunded') THEN
    UPDATE public.invoices SET status = 'overdue' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check invoice overdue status
CREATE OR REPLACE TRIGGER on_invoice_overdue_check
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.check_invoice_overdue();

-- Function to update client invoice counts
CREATE OR REPLACE FUNCTION public.update_client_invoice_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.clients 
    SET total_invoices = total_invoices + 1
    WHERE id = NEW.client_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.clients 
    SET total_invoices = total_invoices - 1
    WHERE id = OLD.client_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client invoice counts
CREATE OR REPLACE TRIGGER on_invoice_client_count_change
  AFTER INSERT OR DELETE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_client_invoice_counts();

-- Function to update invoice's last activity
CREATE OR REPLACE FUNCTION public.update_invoice_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices 
  SET last_activity_at = now()
  WHERE id = NEW.invoice_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update invoice last activity when activity is logged
CREATE OR REPLACE TRIGGER on_invoice_activity_created
  AFTER INSERT ON public.invoice_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_last_activity();

-- =====================================================
-- SAMPLE DATA STRUCTURE FOR LINE ITEMS
-- =====================================================
/*
-- Example line_items JSON structure:
[
  {
    "id": "item-1",
    "name": "Website Design",
    "description": "Complete website design including wireframes and mockups",
    "item_type": "service",
    "quantity": 1,
    "unit_rate": 2500.00,
    "total_amount": 2500.00,
    "is_taxable": true,
    "sort_order": 1
  },
  {
    "id": "item-2", 
    "name": "Development Hours",
    "description": "Frontend and backend development",
    "item_type": "time",
    "quantity": 40,
    "unit_rate": 75.00,
    "total_amount": 3000.00,
    "is_taxable": true,
    "sort_order": 2
  },
  {
    "id": "item-3",
    "name": "Domain Registration",
    "description": "1 year domain registration",
    "item_type": "product",
    "quantity": 1,
    "unit_rate": 15.00,
    "total_amount": 15.00,
    "is_taxable": false,
    "sort_order": 3
  }
]

-- Example invoice with line items:
INSERT INTO public.invoices (
  account_id, 
  client_id, 
  title, 
  description, 
  line_items,
  tax_rate,
  payment_terms,
  created_by_name
) VALUES (
  'your-account-id',
  'client-id-1',
  'Website Development Project',
  'Complete website development including design and implementation',
  '[
    {"id": "item-1", "name": "Website Design", "description": "Complete website design", "item_type": "service", "quantity": 1, "unit_rate": 2500.00, "total_amount": 2500.00, "is_taxable": true, "sort_order": 1},
    {"id": "item-2", "name": "Development Hours", "description": "Frontend and backend development", "item_type": "time", "quantity": 40, "unit_rate": 75.00, "total_amount": 3000.00, "is_taxable": true, "sort_order": 2}
  ]'::jsonb,
  8.5,
  'net-30',
  'John Smith'
);
*/

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample invoices (uncomment if needed for testing)
/*
INSERT INTO public.invoices (account_id, client_id, project_id, invoice_number, title, description, line_items, status, subtotal, tax_rate, total_amount, issue_date, due_date, created_by_name) VALUES
  ('your-account-id', 'client-id-1', 'project-id-1', 'INV-0015', 'Website Redesign - Phase 1', 'Initial design and wireframes', 
   '[{"id": "item-1", "name": "Design Phase", "description": "Wireframes and mockups", "quantity": 1, "unit_rate": 5500.00, "total_amount": 5500.00, "is_taxable": true, "sort_order": 1}]'::jsonb,
   'paid', 5500.00, 8.5, 5967.50, '2024-01-15', '2024-02-15', 'John Smith'),
   
  ('your-account-id', 'client-id-2', 'project-id-2', 'INV-0014', 'Mobile App Development', 'Complete mobile application development',
   '[{"id": "item-1", "name": "App Development", "description": "Full-stack mobile app", "quantity": 1, "unit_rate": 12000.00, "total_amount": 12000.00, "is_taxable": true, "sort_order": 1}]'::jsonb,
   'unpaid', 12000.00, 8.5, 13020.00, '2024-01-10', '2024-02-10', 'Sarah Johnson'),
   
  ('your-account-id', 'client-id-3', NULL, 'INV-0013', 'Brand Identity Package', 'Complete brand identity design',
   '[{"id": "item-1", "name": "Logo Design", "description": "Primary and secondary logos", "quantity": 1, "unit_rate": 2000.00, "total_amount": 2000.00, "is_taxable": true, "sort_order": 1},
    {"id": "item-2", "name": "Brand Guidelines", "description": "Complete brand style guide", "quantity": 1, "unit_rate": 1200.00, "total_amount": 1200.00, "is_taxable": true, "sort_order": 2}]'::jsonb,
   'overdue', 3200.00, 8.5, 3472.00, '2023-12-20', '2024-01-20', 'Mike Davis');
*/ 