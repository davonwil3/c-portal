import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { planTier } = await request.json()

    if (!planTier || !['pro', 'premium'].includes(planTier)) {
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
      .select('account_id, email')
      .eq('user_id', user.id)
      .single()

    if (!profile || !profile.account_id) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      profile.email || user.email || '',
      profile.account_id
    )

    // Create checkout session
    const session = await createCheckoutSession(
      customerId,
      planTier,
      profile.account_id,
      user.id,
      profile.email || user.email || undefined // Pass email for additional security
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    
    // Provide more helpful error messages
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          error: 'Invalid Stripe API key. Please check your STRIPE_SECRET_KEY in .env.local and make sure it starts with sk_test_ or sk_live_',
          details: 'Make sure you\'ve copied the key correctly from https://dashboard.stripe.com/test/apikeys and restarted your dev server'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

