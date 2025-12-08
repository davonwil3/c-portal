import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createBillingPortalSession, getOrCreateStripeCustomer } from '@/lib/stripe'

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

    // Get account
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

    // Get account with Stripe customer ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    // Get or create Stripe customer if one doesn't exist
    let customerId = account?.stripe_customer_id
    if (!customerId) {
      customerId = await getOrCreateStripeCustomer(
        user.id,
        profile.email || user.email || '',
        profile.account_id
      )
    }

    // Create billing portal session
    const session = await createBillingPortalSession(customerId)

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating billing portal session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}

