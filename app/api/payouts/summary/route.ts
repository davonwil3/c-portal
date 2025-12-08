import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
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

    // Get account with payout provider info
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_connect_account_id, stripe_connect_enabled, paypal_merchant_id, paypal_connected, default_payout_provider, plan_tier')
      .eq('id', profile.account_id)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const result: {
      stripe: {
        connected: boolean
        available: { amount: number; currency: string } | null
        pending: { amount: number; currency: string } | null
      }
      paypal: {
        connected: boolean
      }
      defaultPayoutProvider: 'stripe' | 'paypal' | null
    } = {
      stripe: {
        connected: !!(account.stripe_connect_account_id && account.stripe_connect_enabled),
        available: null,
        pending: null,
      },
      paypal: {
        connected: !!(account.paypal_merchant_id && account.paypal_connected),
      },
      defaultPayoutProvider: (account.default_payout_provider as 'stripe' | 'paypal' | null) || null,
    }

    // If Stripe Connect is connected and user is on a plan that supports payouts, fetch balance
    if (result.stripe.connected && account.stripe_connect_account_id && (account.plan_tier === 'premium' || account.plan_tier === 'pro')) {
      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: account.stripe_connect_account_id,
        })

        // Find USD balance (or first available currency)
        const usdBalance = balance.available.find((b) => b.currency === 'usd') || balance.available[0]
        const usdPending = balance.pending.find((b) => b.currency === 'usd') || balance.pending[0]

        if (usdBalance) {
          result.stripe.available = {
            amount: usdBalance.amount,
            currency: usdBalance.currency.toUpperCase(),
          }
        }

        if (usdPending) {
          result.stripe.pending = {
            amount: usdPending.amount,
            currency: usdPending.currency.toUpperCase(),
          }
        }
      } catch (error: any) {
        console.error('Error fetching Stripe balance:', error)
        // Don't fail the whole request if balance fetch fails
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching payout summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payout summary' },
      { status: 500 }
    )
  }
}

