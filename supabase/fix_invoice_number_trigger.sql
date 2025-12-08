-- Fix invoice number trigger to only generate if invoice_number is NULL or empty
-- This allows users to set custom invoice numbers while auto-generating when not provided

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate invoice number if it's NULL or empty
  IF NEW.invoice_number IS NULL OR TRIM(NEW.invoice_number) = '' THEN
    NEW.invoice_number = 'INV-' || 
      LPAD(COALESCE(
        (SELECT MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER))
         FROM public.invoices 
         WHERE account_id = NEW.account_id
         AND invoice_number ~ '^INV-[0-9]+$'), 0) + 1, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

