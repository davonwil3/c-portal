-- Add dual signature fields to contracts table
-- This allows separate tracking of client and user signatures

ALTER TABLE public.contracts 
ADD COLUMN client_signature_data jsonb,
ADD COLUMN client_signature_status text DEFAULT 'pending' CHECK (client_signature_status IN ('pending', 'signed', 'declined')),
ADD COLUMN client_signed_at timestamptz,
ADD COLUMN client_signer_name text,
ADD COLUMN client_signer_email text,

ADD COLUMN user_signature_data jsonb,
ADD COLUMN user_signature_status text DEFAULT 'pending' CHECK (user_signature_status IN ('pending', 'signed', 'declined')),
ADD COLUMN user_signed_at timestamptz,
ADD COLUMN user_signer_name text,
ADD COLUMN user_signer_email text;

-- Add indexes for the new signature fields
CREATE INDEX idx_contracts_client_signature_status ON public.contracts(client_signature_status);
CREATE INDEX idx_contracts_user_signature_status ON public.contracts(user_signature_status);
CREATE INDEX idx_contracts_client_signed_at ON public.contracts(client_signed_at);
CREATE INDEX idx_contracts_user_signed_at ON public.contracts(user_signed_at);

-- Update the main status to be calculated based on both signatures
-- A contract is fully signed only when both client and user have signed
CREATE OR REPLACE FUNCTION public.update_contract_signature_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update main signature_status based on client and user signatures
  IF NEW.client_signature_status = 'signed' AND NEW.user_signature_status = 'signed' THEN
    NEW.signature_status = 'signed';
    NEW.status = 'signed';
    NEW.signed_at = GREATEST(NEW.client_signed_at, NEW.user_signed_at);
  ELSIF NEW.client_signature_status = 'signed' OR NEW.user_signature_status = 'signed' THEN
    NEW.signature_status = 'signed'; -- Set to signed for partially signed contracts
    NEW.status = 'partially_signed';
    NEW.signed_at = COALESCE(NEW.client_signed_at, NEW.user_signed_at);
  ELSIF NEW.client_signature_status = 'declined' OR NEW.user_signature_status = 'declined' THEN
    NEW.signature_status = 'declined';
    NEW.status = 'declined';
    NEW.declined_at = COALESCE(NEW.client_signed_at, NEW.user_signed_at);
  ELSE
    NEW.signature_status = 'pending';
    NEW.status = 'awaiting_signature';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update signature status
CREATE OR REPLACE TRIGGER on_contract_signature_update
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW 
  WHEN (OLD.client_signature_status IS DISTINCT FROM NEW.client_signature_status 
        OR OLD.user_signature_status IS DISTINCT FROM NEW.user_signature_status)
  EXECUTE FUNCTION public.update_contract_signature_status();
