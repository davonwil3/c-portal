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

    // Get account with Stripe Connect account ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_connect_account_id, stripe_connect_enabled')
      .eq('id', profile.account_id)
      .single()

    if (!account?.stripe_connect_account_id || !account.stripe_connect_enabled) {
      return NextResponse.json(
        { error: 'Stripe Connect is not connected for this workspace' },
        { status: 404 }
      )
    }

    // Create a login link for the connected account
    const loginLink = await stripe.accounts.createLoginLink(account.stripe_connect_account_id)

    return NextResponse.json({
      url: loginLink.url,
    })
  } catch (error: any) {
    console.error('Error creating Stripe manage link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe manage link' },
      { status: 500 }
    )
  }
}

