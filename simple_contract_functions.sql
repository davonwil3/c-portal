-- Simple contract number generation function
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  year_text TEXT;
  next_number INTEGER;
BEGIN
  year_text := EXTRACT(YEAR FROM now())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contracts 
  WHERE contract_number LIKE 'CON-' || year_text || '-%'
  AND account_id = NEW.account_id;
  
  NEW.contract_number := 'CON-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple template number generation function
CREATE OR REPLACE FUNCTION public.generate_template_number()
RETURNS TRIGGER AS $$
DECLARE
  year_text TEXT;
  next_number INTEGER;
BEGIN
  year_text := EXTRACT(YEAR FROM now())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(template_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.contract_templates 
  WHERE template_number LIKE 'TPL-' || year_text || '-%'
  AND account_id = NEW.account_id;
  
  NEW.template_number := 'TPL-' || year_text || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers
CREATE OR REPLACE TRIGGER on_contract_created
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.generate_contract_number();

CREATE OR REPLACE TRIGGER on_template_created
  BEFORE INSERT ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.generate_template_number(); 