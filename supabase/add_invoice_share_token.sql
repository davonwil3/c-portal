-- Add share_token field to invoices table for shareable invoice links
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_share_token ON public.invoices(share_token);

-- Function to generate a unique short share token (8 characters)
CREATE OR REPLACE FUNCTION generate_invoice_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  exists_check BOOLEAN;
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  i INTEGER;
BEGIN
  LOOP
    -- Generate a short random token (8 characters, alphanumeric)
    token := '';
    FOR i IN 1..8 LOOP
      token := token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.invoices WHERE share_token = token) INTO exists_check;
    
    -- Exit loop if token is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql;

