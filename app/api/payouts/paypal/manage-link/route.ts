import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get user from server-side Supabase client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get account
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || !profile.account_id) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get account with PayPal merchant ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('paypal_merchant_id, paypal_connected')
      .eq('id', profile.account_id)
      .single()

    if (!account?.paypal_merchant_id || !account.paypal_connected) {
      return NextResponse.json(
        { error: 'PayPal is not connected for this workspace' },
        { status: 404 }
      )
    }

    // For now, return a static PayPal business dashboard URL
    // In a full implementation, you might construct a specific merchant dashboard URL
    const paypalDashboardUrl = 'https://www.paypal.com/businessmanage'

    return NextResponse.json({
      url: paypalDashboardUrl,
    })
  } catch (error: any) {
    console.error('Error creating PayPal manage link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal manage link' },
      { status: 500 }
    )
  }
}

