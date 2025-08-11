-- Temporarily disable the contract number trigger to test contract creation
DROP TRIGGER IF EXISTS on_contract_created ON public.contracts;

-- Also disable template trigger
DROP TRIGGER IF EXISTS on_template_created ON public.contract_templates; 