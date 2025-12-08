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

    // Get account with Stripe customer ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_customer_id, subscription_status')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json({
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        subscriptionStatus: account?.subscription_status || null
      })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    // Find active subscription (including those set to cancel at period end)
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    if (!activeSubscription) {
      console.log(`No active subscription found for customer ${account.stripe_customer_id}`)
      return NextResponse.json({
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        subscriptionStatus: account?.subscription_status || null
      })
    }

    console.log(`Found subscription ${activeSubscription.id}: cancel_at_period_end=${activeSubscription.cancel_at_period_end}, current_period_end=${activeSubscription.current_period_end}`)

    return NextResponse.json({
      cancelAtPeriodEnd: activeSubscription.cancel_at_period_end || false,
      currentPeriodEnd: activeSubscription.current_period_end 
        ? new Date(activeSubscription.current_period_end * 1000).toISOString()
        : null,
      subscriptionStatus: account?.subscription_status || activeSubscription.status
    })
  } catch (error: any) {
    console.error('Error fetching subscription details:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription details' },
      { status: 500 }
    )
  }
}

