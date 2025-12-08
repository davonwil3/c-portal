import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

// Verify checkout session and update subscription
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
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

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    // Verify the session belongs to this user
    const accountId = session.metadata?.accountId
    const planTier = session.metadata?.planTier as 'pro' | 'premium'
    const sessionUserId = session.metadata?.userId

    if (!accountId || !planTier || !sessionUserId) {
      return NextResponse.json(
        { error: 'Invalid session metadata' },
        { status: 400 }
      )
    }

    // CRITICAL SECURITY CHECK: Verify the session was created by this user
    if (sessionUserId !== user.id) {
      return NextResponse.json(
        { error: 'This checkout session does not belong to you' },
        { status: 403 }
      )
    }

    // Verify account belongs to user
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id, email')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.account_id !== accountId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Additional security: Verify customer email matches (if set)
    if (session.customer_email && profile.email) {
      if (session.customer_email.toLowerCase() !== profile.email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Email mismatch - this session does not belong to you' },
          { status: 403 }
        )
      }
    }

    // If payment was successful, update the account
    if (session.payment_status === 'paid' && session.status === 'complete') {
      const subscription = session.subscription as any

      await supabaseAdmin
        .from('accounts')
        .update({
          plan_tier: planTier,
          subscription_status: subscription?.status || 'active',
        })
        .eq('id', accountId)

      return NextResponse.json({ 
        success: true,
        planTier,
        subscriptionStatus: subscription?.status || 'active'
      })
    }

    return NextResponse.json({ 
      success: false,
      message: 'Payment not completed'
    })
  } catch (error: any) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify session' },
      { status: 500 }
    )
  }
}

// Sync subscription status from Stripe
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
      .select('stripe_customer_id, plan_tier')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json({ 
        planTier: account?.plan_tier || 'free',
        subscriptionStatus: null
      })
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: account.stripe_customer_id,
      status: 'all',
      limit: 1,
    })

    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    )

    if (activeSubscription) {
      // Determine plan tier from subscription
      const priceId = activeSubscription.items.data[0]?.price.id
      let planTier = account.plan_tier || 'free'
      
      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        planTier = 'pro'
      } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
        planTier = 'premium'
      }

      // Update account if plan changed
      if (planTier !== account.plan_tier) {
        await supabaseAdmin
          .from('accounts')
          .update({
            plan_tier: planTier,
            subscription_status: activeSubscription.status,
          })
          .eq('id', profile.account_id)
      }

      return NextResponse.json({
        planTier,
        subscriptionStatus: activeSubscription.status
      })
    } else {
      // No active subscription, set to free
      if (account.plan_tier !== 'free') {
        await supabaseAdmin
          .from('accounts')
          .update({
            plan_tier: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', profile.account_id)
      }

      return NextResponse.json({
        planTier: 'free',
        subscriptionStatus: 'canceled'
      })
    }
  } catch (error: any) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}

