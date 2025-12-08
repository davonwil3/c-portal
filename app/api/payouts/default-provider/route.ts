import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { provider } = await request.json()

    if (!provider || !['stripe', 'paypal'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "stripe" or "paypal"' },
        { status: 400 }
      )
    }

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

    // Get account to verify provider is connected
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_connect_account_id, stripe_connect_enabled, paypal_merchant_id, paypal_connected')
      .eq('id', profile.account_id)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Verify the provider is actually connected
    if (provider === 'stripe' && (!account.stripe_connect_account_id || !account.stripe_connect_enabled)) {
      return NextResponse.json(
        { error: 'Stripe is not connected for this workspace' },
        { status: 400 }
      )
    }

    if (provider === 'paypal' && (!account.paypal_merchant_id || !account.paypal_connected)) {
      return NextResponse.json(
        { error: 'PayPal is not connected for this workspace' },
        { status: 400 }
      )
    }

    // Update default payout provider
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        default_payout_provider: provider,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.account_id)

    if (updateError) {
      console.error('Error updating default payout provider:', updateError)
      return NextResponse.json(
        { error: 'Failed to update default payout provider' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      defaultPayoutProvider: provider,
    })
  } catch (error: any) {
    console.error('Error setting default payout provider:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set default payout provider' },
      { status: 500 }
    )
  }
}

