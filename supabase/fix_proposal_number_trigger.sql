-- Fix the proposal number generation trigger
-- The issue was that SUBSTRING(proposal_number FROM 10) was extracting "-0001" instead of "0001"
-- This fixes it to properly extract the number part

CREATE OR REPLACE FUNCTION public.generate_proposal_number()
RETURNS TRIGGER AS $$
DECLARE
  current_year TEXT;
  max_number INTEGER;
  next_number INTEGER;
BEGIN
  -- Get current year
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  -- Find the maximum proposal number for this year and account
  SELECT COALESCE(
    MAX(CAST(SPLIT_PART(proposal_number, '-', 3) AS INTEGER)),
    0
  )
  INTO max_number
  FROM public.proposals
  WHERE proposal_number LIKE 'PROP-' || current_year || '-%'
    AND account_id = NEW.account_id
    AND proposal_number IS NOT NULL;
  
  -- Calculate next number
  next_number := max_number + 1;
  
  -- Generate proposal number
  NEW.proposal_number := 'PROP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger should already exist, but ensure it's correct
DROP TRIGGER IF EXISTS on_proposal_created ON public.proposals;
CREATE TRIGGER on_proposal_created
  BEFORE INSERT ON public.proposals
  FOR EACH ROW 
  WHEN (NEW.proposal_number IS NULL)
  EXECUTE FUNCTION public.generate_proposal_number();

