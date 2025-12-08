import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

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
        { error: 'Unauthorized', success: false },
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
        { error: 'Account not found', success: false },
        { status: 404 }
      )
    }

    // Get account with Stripe Connect account ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_connect_account_id')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'No Stripe Connect account found', success: false },
        { status: 404 }
      )
    }

    // Retrieve the Connect account to check its status
    const connectAccount = await stripe.accounts.retrieve(account.stripe_connect_account_id)

    // Check if account is fully onboarded
    const isEnabled = connectAccount.details_submitted && 
                      connectAccount.charges_enabled && 
                      connectAccount.payouts_enabled

    // Update the account status in database
    await supabaseAdmin
      .from('accounts')
      .update({ 
        stripe_connect_enabled: isEnabled,
      })
      .eq('id', profile.account_id)

    return NextResponse.json({ 
      success: isEnabled,
      enabled: isEnabled,
      details_submitted: connectAccount.details_submitted,
      charges_enabled: connectAccount.charges_enabled,
      payouts_enabled: connectAccount.payouts_enabled,
    })
  } catch (error: any) {
    console.error('Error checking Stripe Connect status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check Stripe Connect status', success: false },
      { status: 500 }
    )
  }
}

