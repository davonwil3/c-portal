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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile and account
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
      .select('stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    // Find active subscription (including those set to cancel at period end)
    const subscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    if (!subscription.cancel_at_period_end) {
      return NextResponse.json(
        { error: 'Subscription is not set to cancel' },
        { status: 400 }
      )
    }

    // Resume the subscription by removing cancel_at_period_end
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    })

    console.log(`Resumed subscription ${subscription.id}: cancel_at_period_end=${updatedSubscription.cancel_at_period_end}`)

    // Update account status
    await supabaseAdmin
      .from('accounts')
      .update({
        subscription_status: 'active',
      })
      .eq('id', profile.account_id)

    return NextResponse.json({ 
      success: true,
      message: 'Subscription resumed successfully'
    })
  } catch (error: any) {
    console.error('Error resuming subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resume subscription' },
      { status: 500 }
    )
  }
}

