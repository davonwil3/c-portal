import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { planTier } = await request.json()

    if (!planTier || !['free', 'pro', 'premium'].includes(planTier)) {
      return NextResponse.json(
        { error: 'Invalid plan tier' },
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
      .select('stripe_customer_id, plan_tier')
      .eq('id', profile.account_id)
      .single()

    // If changing to free, cancel subscription at period end (no proration)
    if (planTier === 'free') {
      if (account?.stripe_customer_id) {
        const subscriptions = await stripe.subscriptions.list({
          customer: account.stripe_customer_id,
          status: 'all',
          limit: 10,
        })

        // Find active subscription
        const subscription = subscriptions.data.find(
          sub => sub.status === 'active' || sub.status === 'trialing'
        )

        if (subscription) {
          // Cancel at period end (no proration, no refund)
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
          })
        }
      }

      // Update account status (keep plan_tier as current until period ends)
      await supabaseAdmin
        .from('accounts')
        .update({
          subscription_status: 'cancel_at_period_end',
        })
        .eq('id', profile.account_id)

      return NextResponse.json({ 
        success: true,
        message: 'Your subscription will be canceled at the end of your billing period. You\'ll keep your current plan features until then.'
      })
    }

    // For pro/premium, we need an active subscription
    if (!account?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No active subscription found. Please use the checkout flow to subscribe.' },
        { status: 400 }
      )
    }

    // Get active subscription (including those set to cancel at period end)
    const subscriptions = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: 'all',
      limit: 10,
    })

    // Find active subscription (including those set to cancel at period end)
    const subscription = subscriptions.data.find(
      sub => sub.status === 'active'
    )

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found. Please use the checkout flow to subscribe.' },
        { status: 400 }
      )
    }

    // If subscription is set to cancel at period end, reactivate it (for upgrades)
    if (subscription.cancel_at_period_end) {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      })
    }
    const priceId = planTier === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PRICE_ID

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID for ${planTier} plan is not configured` },
        { status: 500 }
      )
    }

    // Update subscription to new plan (charge immediately, no proration)
    await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        price: priceId,
      }],
      proration_behavior: 'none', // No proration - charge immediately for full amount
      metadata: {
        accountId: profile.account_id,
        userId: user.id,
        planTier,
      },
    })

    // Update account
    await supabaseAdmin
      .from('accounts')
      .update({
        plan_tier: planTier,
        subscription_status: 'active',
      })
      .eq('id', profile.account_id)

    return NextResponse.json({ 
      success: true,
      message: `Plan changed to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)} successfully`
    })
  } catch (error: any) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to change plan' },
      { status: 500 }
    )
  }
}

