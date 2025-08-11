-- Fix for contract number generation function
CREATE OR REPLACE FUNCTION public.generate_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contract_number = 'CON-' || EXTRACT(YEAR FROM now())::TEXT || '-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(contract_number FROM 9) AS INTEGER))
       FROM public.contracts 
       WHERE contract_number LIKE 'CON-' || EXTRACT(YEAR FROM now())::TEXT || '-%'
       AND account_id = NEW.account_id), 0) + 1::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix for template number generation function
CREATE OR REPLACE FUNCTION public.generate_template_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.template_number = 'TPL-' || EXTRACT(YEAR FROM now())::TEXT || '-' || 
    LPAD(COALESCE(
      (SELECT MAX(CAST(SUBSTRING(template_number FROM 9) AS INTEGER))
       FROM public.contract_templates 
       WHERE template_number LIKE 'TPL-' || EXTRACT(YEAR FROM now())::TEXT || '-%'
       AND account_id = NEW.account_id), 0) + 1::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 