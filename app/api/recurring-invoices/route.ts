import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateRecurringInvoiceInput } from '@/lib/recurring-invoices'
import { calculateNextRunDate } from '@/lib/recurring-invoices'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json() as CreateRecurringInvoiceInput

    // Get user profile to get account_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.account_id) {
      return NextResponse.json(
        { error: 'No account found' },
        { status: 404 }
      )
    }

    // Calculate next_run_at from start_date
    const startDate = new Date(body.start_date)
    const nextRunAt = calculateNextRunDate(startDate, body.interval_type, body.interval_value || 1)

    const { data, error } = await supabase
      .from('recurring_invoices')
      .insert({
        ...body,
        account_id: profile.account_id,
        user_id: user.id,
        interval_value: body.interval_value || 1,
        currency: body.currency || 'USD',
        payment_terms: body.payment_terms || 'net-30',
        allow_online_payment: body.allow_online_payment ?? true,
        auto_send: body.auto_send ?? false,
        days_until_due: body.days_until_due || 30,
        next_run_at: nextRunAt.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating recurring invoice:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create recurring invoice' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating recurring invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create recurring invoice' },
      { status: 500 }
    )
  }
}

