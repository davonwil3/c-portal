-- Fix Infinite Recursion in Invoice Triggers
-- This script temporarily disables the problematic triggers to stop the infinite loop

-- First, let's see what triggers exist on the invoices table
-- You can run this to check: SELECT * FROM information_schema.triggers WHERE event_object_table = 'invoices';

-- Disable the problematic triggers temporarily
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON public.invoices;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices;
DROP TRIGGER IF EXISTS update_invoice_last_activity_trigger ON public.invoices;

-- Alternative: If you want to keep the triggers but fix the recursion, 
-- you can recreate them with proper conditions to prevent loops

-- Fixed version of check_invoice_overdue function (prevents recursion)
CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update if the status is actually changing to prevent recursion
  IF NEW.due_date IS NOT NULL 
     AND NEW.due_date < NOW() 
     AND NEW.status NOT IN ('paid', 'overdue', 'cancelled', 'refunded')
     AND OLD.status != 'overdue' THEN
    UPDATE public.invoices 
    SET status = 'overdue' 
    WHERE id = NEW.id AND status != 'overdue';
  END IF;
  RETURN NEW;
END;
$$;

-- Fixed version of calculate_invoice_totals function (prevents recursion)
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  subtotal_val DECIMAL(15,2) := 0;
  tax_amount_val DECIMAL(15,2) := 0;
  discount_value_val DECIMAL(15,2) := 0;
  total_amount_val DECIMAL(15,2) := 0;
BEGIN
  -- Calculate subtotal from line items
  IF NEW.line_items IS NOT NULL THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.line_items)
    LOOP
      subtotal_val := subtotal_val + COALESCE((item->>'amount')::DECIMAL(15,2), 0);
    END LOOP;
  END IF;
  
  -- Calculate tax amount
  tax_amount_val := subtotal_val * (NEW.tax_rate / 100);
  
  -- Calculate discount value
  IF NEW.discount_type = 'percentage' THEN
    discount_value_val := subtotal_val * (NEW.discount_amount / 100);
  ELSE
    discount_value_val := NEW.discount_amount;
  END IF;
  
  -- Calculate total amount
  total_amount_val := subtotal_val + tax_amount_val - discount_value_val;
  
  -- Only update if values have actually changed to prevent recursion
  IF NEW.subtotal != subtotal_val 
     OR NEW.tax_amount != tax_amount_val 
     OR NEW.discount_value != discount_value_val 
     OR NEW.total_amount != total_amount_val THEN
    
    NEW.subtotal := subtotal_val;
    NEW.tax_amount := tax_amount_val;
    NEW.discount_value := discount_value_val;
    NEW.total_amount := total_amount_val;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the triggers with the fixed functions
CREATE TRIGGER calculate_invoice_totals_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_totals();

CREATE TRIGGER check_invoice_overdue_trigger
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION check_invoice_overdue();

-- Optional: Update invoice last activity trigger (if it exists)
-- Note: This function is commented out because invoices table may not have last_activity_at column
-- CREATE OR REPLACE FUNCTION update_invoice_last_activity()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   -- Only update if we're not already updating last_activity_at to prevent recursion
--   IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.last_activity_at IS DISTINCT FROM NEW.last_activity_at) THEN
--     UPDATE public.invoices 
--     SET last_activity_at = NOW()
--     WHERE id = NEW.id;
--   END IF;
--   RETURN NEW;
-- END;
-- $$;

-- CREATE TRIGGER update_invoice_last_activity_trigger
--   AFTER INSERT OR UPDATE ON public.invoices
--   FOR EACH ROW
--   EXECUTE FUNCTION update_invoice_last_activity();
