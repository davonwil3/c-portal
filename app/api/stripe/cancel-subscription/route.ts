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
      status: 'active',
      limit: 1,
    })

    if (subscriptions.data.length === 0) {
      // No active subscription, update account to free
      await supabaseAdmin
        .from('accounts')
        .update({
          plan_tier: 'free',
          subscription_status: 'canceled',
        })
        .eq('id', profile.account_id)

      return NextResponse.json({ 
        success: true,
        message: 'Subscription already canceled'
      })
    }

    const subscription = subscriptions.data[0]

    // Cancel the subscription at period end
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    })

    // Retrieve the full subscription to ensure we have all fields
    const fullSubscription = await stripe.subscriptions.retrieve(subscription.id)

    console.log(`Canceled subscription ${subscription.id} at period end:`)
    console.log(`  - cancel_at_period_end: ${fullSubscription.cancel_at_period_end}`)
    console.log(`  - current_period_end: ${fullSubscription.current_period_end ? new Date(fullSubscription.current_period_end * 1000).toISOString() : 'undefined'}`)
    console.log(`  - status: ${fullSubscription.status}`)

    // Verify the update was successful
    if (!fullSubscription.cancel_at_period_end) {
      throw new Error('Failed to set subscription to cancel at period end')
    }

    // Use the full subscription object for the rest of the function
    const subscriptionToUse = fullSubscription

    // Update account status
    await supabaseAdmin
      .from('accounts')
      .update({
        subscription_status: 'cancel_at_period_end',
      })
      .eq('id', profile.account_id)

    // Return cancellation date (current_period_end) - ensure it exists
    let cancellationDate: string | null = null
    if (subscriptionToUse.current_period_end) {
      cancellationDate = new Date(subscriptionToUse.current_period_end * 1000).toISOString()
    } else {
      console.warn(`Warning: Subscription ${subscriptionToUse.id} does not have current_period_end set`)
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
      cancellationDate: cancellationDate,
      currentPeriodEnd: subscriptionToUse.current_period_end || null,
      cancelAtPeriodEnd: subscriptionToUse.cancel_at_period_end
    })
  } catch (error: any) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

