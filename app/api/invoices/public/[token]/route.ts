import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const companySlug = searchParams.get('company')
    
    // Extract clean token (remove domain suffix if present)
    const cleanToken = token.split('.')[0]
    
    // Find invoice by share_token
    let query = adminClient
      .from('invoices')
      .select(`
        id,
        invoice_number,
        title,
        notes,
        po_number,
        issue_date,
        due_date,
        subtotal,
        tax_rate,
        tax_amount,
        discount_value,
        total_amount,
        currency,
        line_items,
        client_id,
        account_id,
        status,
        is_recurring,
        recurring_schedule,
        clients:client_id(
          first_name,
          last_name,
          company,
          email,
          phone
        ),
        accounts:account_id(
          company_name,
          address,
          logo_url,
          plan_tier
        )
      `)
      .eq('share_token', cleanToken)

    // If company slug is provided, verify it matches the account
    if (companySlug) {
      // Get account by company slug
      const { data: account } = await adminClient
        .from('accounts')
        .select('id, company_name')
        .or(`company_name.ilike.%${companySlug.replace(/-/g, '%')}%`)
        .limit(1)
        .maybeSingle()

      if (account) {
        query = query.eq('account_id', account.id)
      }
    }

    const { data: invoice, error } = await query.single()

    if (error) {
      console.error('Error fetching invoice:', error)
      return NextResponse.json({ error: 'Invoice not found', details: error.message }, { status: 404 })
    }

    if (!invoice) {
      console.error('Invoice not found for token:', cleanToken)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only return invoice if it's not a draft (drafts shouldn't be shareable)
    if (invoice.status === 'draft') {
      return NextResponse.json({ error: 'Invoice not available' }, { status: 404 })
    }

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        title: invoice.title,
        notes: invoice.notes,
        po_number: invoice.po_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        subtotal: Number(invoice.subtotal),
        tax_rate: Number(invoice.tax_rate),
        tax_amount: Number(invoice.tax_amount),
        discount_value: Number(invoice.discount_value),
        total_amount: Number(invoice.total_amount),
        currency: invoice.currency,
        line_items: invoice.line_items || [],
        is_recurring: invoice.is_recurring || false,
        recurring_schedule: invoice.recurring_schedule || null,
        client: invoice.clients ? {
          first_name: invoice.clients.first_name,
          last_name: invoice.clients.last_name,
          company: invoice.clients.company,
          email: invoice.clients.email,
          phone: invoice.clients.phone,
        } : null,
        account: invoice.accounts ? {
          company_name: invoice.accounts.company_name,
          address: invoice.accounts.address,
          logo_url: invoice.accounts.logo_url,
          plan_tier: invoice.accounts.plan_tier,
        } : null,
      },
    })
  } catch (error: any) {
    console.error('Error fetching public invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 })
  }
}

