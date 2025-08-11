-- Completely disable the contract number trigger to fix duplicate key errors
DROP TRIGGER IF EXISTS on_contract_created ON public.contracts;
DROP TRIGGER IF EXISTS on_template_created ON public.contract_templates;

-- Also drop the problematic functions
DROP FUNCTION IF EXISTS public.generate_contract_number();
DROP FUNCTION IF EXISTS public.generate_template_number(); 