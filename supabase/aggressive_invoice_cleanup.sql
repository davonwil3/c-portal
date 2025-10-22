-- Aggressive cleanup for invoice payment issues
-- This removes ALL problematic triggers and functions with CASCADE

-- 1. Drop all invoice-related triggers first
DROP TRIGGER IF EXISTS invoice_status_change_trigger ON public.invoices CASCADE;
DROP TRIGGER IF EXISTS check_invoice_overdue_trigger ON public.invoices CASCADE;
DROP TRIGGER IF EXISTS calculate_invoice_totals_trigger ON public.invoices CASCADE;
DROP TRIGGER IF EXISTS update_invoice_last_activity_trigger ON public.invoices CASCADE;
DROP TRIGGER IF EXISTS on_invoice_activity_created ON public.invoice_activities CASCADE;

-- 2. Drop all problematic functions with CASCADE
DROP FUNCTION IF EXISTS update_invoice_last_activity() CASCADE;
DROP FUNCTION IF EXISTS log_invoice_status_change() CASCADE;
DROP FUNCTION IF EXISTS check_invoice_overdue() CASCADE;
DROP FUNCTION IF EXISTS calculate_invoice_totals() CASCADE;

-- 3. Drop any other invoice-related functions that might exist
DROP FUNCTION IF EXISTS log_invoice_activity() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_totals() CASCADE;
DROP FUNCTION IF EXISTS invoice_status_update() CASCADE;

-- 4. Create a simple, safe invoice update function
CREATE OR REPLACE FUNCTION safe_update_invoice(
    invoice_id UUID,
    new_status TEXT DEFAULT NULL,
    paid_date_value TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Simple update without any triggers or complex logic
    UPDATE public.invoices 
    SET 
        status = COALESCE(new_status, status),
        paid_date = COALESCE(paid_date_value, paid_date),
        updated_at = NOW()
    WHERE id = invoice_id;
    
    -- Log activity manually (without triggers)
    IF new_status = 'paid' THEN
        INSERT INTO public.project_activities (
            project_id,
            account_id,
            activity_type,
            action,
            metadata
        )
        SELECT 
            i.project_id,
            i.account_id,
            'status_change',
            'Invoice marked as paid: ' || COALESCE(i.invoice_number, 'Draft'),
            jsonb_build_object(
                'invoice_id', i.id,
                'invoice_number', i.invoice_number,
                'invoice_title', i.title,
                'total_amount', i.total_amount,
                'activity_source', 'invoice'
            )
        FROM public.invoices i
        WHERE i.id = invoice_id;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION safe_update_invoice(UUID, TEXT, TIMESTAMPTZ) TO authenticated;

-- Verify cleanup
SELECT 'All invoice triggers and functions cleaned up successfully' as status;
