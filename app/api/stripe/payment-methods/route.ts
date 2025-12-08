import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

// Get payment methods
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
      .select('stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json({ paymentMethods: [] })
    }

    // Get payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: account.stripe_customer_id,
      type: 'card',
    })

    return NextResponse.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card ? {
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        } : null,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

// Create setup intent for adding payment method
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

    // Get account with Stripe customer ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Stripe customer not found' },
        { status: 404 }
      )
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: account.stripe_customer_id,
      payment_method_types: ['card'],
    })

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Error creating setup intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create setup intent' },
      { status: 500 }
    )
  }
}

